import { listFilesForOwnedPlayground } from "./file.service.js";

export async function listFiles(req, res, next) {
	try {
		const { playgroundId } = req.params;
		const result = await listFilesForOwnedPlayground(req.user.id, playgroundId);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}
