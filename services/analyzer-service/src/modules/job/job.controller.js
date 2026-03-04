import { getJobResultForUser, getJobStatusForUser, startFileAnalysis } from "./job.service.js";

export async function startAnalysis(req, res, next) {
	try {
		const { playgroundId, fileId } = req.params;
		const result = await startFileAnalysis(req.user.id, playgroundId, fileId);
		return res.status(202).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function getJobStatus(req, res, next) {
	try {
		const { jobId } = req.params;
		const result = await getJobStatusForUser(req.user.id, jobId);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function getJobResult(req, res, next) {
	try {
		const { jobId } = req.params;
		const result = await getJobResultForUser(req.user.id, jobId);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}
