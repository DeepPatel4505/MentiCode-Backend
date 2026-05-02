import { listFilesForOwnedPlayground } from "./file.service.js";
import { getFileContentForUser } from "./file.service.js";

export async function listFiles(req, res, next) {
	try {
		const { playgroundId } = req.params;
		const result = await listFilesForOwnedPlayground(req.user.id, playgroundId);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

// file.controller.js

export async function getFileContent(req, res, next) {
    try {
		console.log("Getting file content for user:", req.user.id);
        const { fileId } = req.params;
        const result = await getFileContentForUser(req.user.id, fileId);
        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
}