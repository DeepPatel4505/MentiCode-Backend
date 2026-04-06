import prisma from "../../config/prisma.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
import { logger } from "@menticode/shared";

function toNotFound() {
	const error = new Error("Not found");
	error.statusCode = 404;
	return error;
}

function toConflict(message) {
	const error = new Error(message);
	error.statusCode = 409;
	return error;
}

function toUnprocessable(message) {
	const error = new Error(message);
	error.statusCode = 422;
	return error;
}

export async function startFileAnalysis(userId, playgroundId, fileId) {
	const ownedFile = await prisma.file.findFirst({
		where: {
			id: fileId,
			playgroundId,
			playground: {
				userId,
			},
		},
		select: {
			id: true,
		},
	});

	if (!ownedFile) {
		throw toNotFound();
	}

	const existingJob = await prisma.analysisJob.findFirst({
		where: {
			fileId,
			status: {
				in: ["pending", "running"],
			},
		},
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			status: true,
		},
	});

	if (existingJob) {
		return {
			jobId: existingJob.id,
			status: existingJob.status,
		};
	}

	const job = await prisma.analysisJob.create({
		data: {
			fileId,
			status: "pending",
		},
		select: {
			id: true,
			status: true,
		},
	});

	try {
		await analysisQueue.add(
			"analyze-file",
			{
				jobId: job.id,
				fileId,
				userId,
			},
			{
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 5000,
				},
			}
		);

		logger.base.info({ userId, playgroundId, fileId, jobId: job.id }, "job.enqueue.success");
	} catch (error) {
		await prisma.analysisJob.update({
			where: { id: job.id },
			data: {
				status: "failed",
				errorMessage: error?.message || "Failed to enqueue analysis job",
				completedAt: new Date(),
			},
		});

		logger.base.error({ userId, playgroundId, fileId, jobId: job.id, error: error?.message }, "job.enqueue.failed");

		throw toUnprocessable("Failed to enqueue analysis job");
	}

	return {
		jobId: job.id,
		status: job.status,
	};
}

export async function getJobStatusForUser(userId, jobId) {
	const ownedJob = await prisma.analysisJob.findFirst({
		where: {
			id: jobId,
			file: {
				playground: {
					userId,
				},
			},
		},
		select: {
			id: true,
			status: true,
		},
	});

	if (!ownedJob) {
		throw toNotFound();
	}

	return {
		jobId: ownedJob.id,
		status: ownedJob.status,
	};
}

export async function getJobResultForUser(userId, jobId) {
	const ownedJob = await prisma.analysisJob.findFirst({
		where: {
			id: jobId,
			file: {
				playground: {
					userId,
				},
			},
		},
		select: {
			id: true,
			status: true,
			errorMessage: true,
			fileId: true,
			result: {
				select: {
					summary: true,
					findings: true,
				},
			},
		},
	});

	if (!ownedJob) {
		throw toNotFound();
	}

	if (ownedJob.status === "pending" || ownedJob.status === "running") {
		throw toConflict("Result not ready");
	}

	if (ownedJob.status === "failed") {
		throw toUnprocessable("Analysis failed");
	}

	if (!ownedJob.result) {
		throw toConflict("Result not ready");
	}

	return {
		fileId: ownedJob.fileId,
		summary: ownedJob.result.summary,
		findings: ownedJob.result.findings,
	};
}
