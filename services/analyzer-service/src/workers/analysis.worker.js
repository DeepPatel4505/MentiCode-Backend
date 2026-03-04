import "dotenv/config";
import axios from "axios";
import { Worker } from "bullmq";
import { logger } from "@menticode/shared";
import prisma from "../config/prisma.js";
import { redisConnection } from "../config/redis.js";
import { readFileContentFromStoragePath } from "../utils/storage.js";
import { closeJobEventsPublisher, publishJobUpdate } from "../websocket/events.js";

const ENGINE_URL = process.env.ENGINE_URL || process.env.ANALYSIS_ENGINE_URL || "http://localhost:5000/code_review";
const ENGINE_TIMEOUT_MS = Number(process.env.ANALYSIS_ENGINE_TIMEOUT_MS || 30000);
const WORKER_CONCURRENCY = Number(process.env.ANALYSIS_WORKER_CONCURRENCY || 5);

const worker = new Worker(
	"analysis",
	async (queueJob) => {
		const { jobId, fileId } = queueJob.data;
		const startedAtMs = Date.now();

		try {
			logger.base.info({ queueJobId: queueJob.id, jobId, fileId }, "worker.job.start");

			await prisma.analysisJob.update({
				where: { id: jobId },
				data: {
					status: "running",
					startedAt: new Date(),
					errorMessage: null,
				},
			});

			await publishJobUpdate(jobId, {
				type: "job.running",
				jobId,
				status: "running",
			});

			const file = await prisma.file.findUnique({
				where: { id: fileId },
				select: {
					id: true,
					language: true,
					storagePath: true,
				},
			});

			if (!file) {
				throw new Error("File not found");
			}

			const code = readFileContentFromStoragePath(file);
			const engineStartMs = Date.now();

			const response = await axios.post(
				ENGINE_URL,
				{
					language: file.language,
					code,
				},
				{ timeout: ENGINE_TIMEOUT_MS }
			);

			const summary = response?.data?.summary ?? {};
			const findings = Array.isArray(response?.data?.findings) ? response.data.findings : [];
			const engineLatencyMs = Date.now() - engineStartMs;

			await prisma.$transaction([
				prisma.analysisResult.upsert({
					where: { jobId },
					create: {
						jobId,
						summary,
						findings,
					},
					update: {
						summary,
						findings,
					},
				}),
				prisma.analysisJob.update({
					where: { id: jobId },
					data: {
						status: "completed",
						errorMessage: null,
						completedAt: new Date(),
					},
				}),
			]);

			await publishJobUpdate(jobId, {
				type: "job.completed",
				jobId,
				status: "completed",
				engineLatencyMs,
			});

			logger.base.info(
				{
					queueJobId: queueJob.id,
					jobId,
					fileId,
					engineLatencyMs,
					totalDurationMs: Date.now() - startedAtMs,
				},
				"worker.job.success"
			);

			return { jobId, status: "completed" };
		} catch (error) {
			const errorMessage = error?.code === "ECONNABORTED" ? `Engine timeout after ${ENGINE_TIMEOUT_MS}ms` : error?.message || "Worker processing failed";

			await prisma.analysisJob.update({
				where: { id: jobId },
				data: {
					status: "failed",
					errorMessage: errorMessage,
					completedAt: new Date(),
				},
			});

			await publishJobUpdate(jobId, {
				type: "job.failed",
				jobId,
				status: "failed",
			});

			logger.base.error({ queueJobId: queueJob.id, jobId, fileId, error: errorMessage }, "worker.job.failed");

			throw error;
		}
	},
	{
		connection: redisConnection,
		concurrency: WORKER_CONCURRENCY,
	}
);

worker.on("completed", (queueJob) => {
	logger.base.info({ queueJobId: queueJob.id }, "worker.queue.completed");
});

worker.on("failed", (queueJob, error) => {
	logger.base.error({ queueJobId: queueJob?.id, error: error?.message }, "worker.queue.failed");
});

worker.on("error", (error) => {
	logger.base.error({ error: error?.message }, "worker.runtime.error");
});

process.on("unhandledRejection", (reason) => {
	logger.base.error({ reason }, "worker.unhandledRejection");
});

process.on("uncaughtException", (error) => {
	logger.base.error({ error: error?.message }, "worker.uncaughtException");
});

process.on("SIGINT", async () => {
	await worker.close();
	await closeJobEventsPublisher();
	await prisma.$disconnect();
	await redisConnection.quit();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await worker.close();
	await closeJobEventsPublisher();
	await prisma.$disconnect();
	await redisConnection.quit();
	process.exit(0);
});

logger.base.info({ concurrency: WORKER_CONCURRENCY, engineUrl: ENGINE_URL, engineTimeoutMs: ENGINE_TIMEOUT_MS }, "analysis-worker.started");
