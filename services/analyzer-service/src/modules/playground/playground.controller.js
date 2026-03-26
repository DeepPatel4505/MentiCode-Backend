import { createPlaygroundForUser, listPlaygroundsForUser, deletePlaygroundForUser } from "./playground.service.js";

export async function createPlayground(req, res, next) {
	try {
		const result = await createPlaygroundForUser(req.user.id, req.body);
		return res.status(201).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function listPlaygrounds(req, res, next) {
	try {
		const result = await listPlaygroundsForUser(req.user.id);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

export async function deletePlayground(req, res, next) {
	try {
		const playgroundId = req.params.playgroundId;
		if (!playgroundId) {
			return res.status(400).json({ message: "playgroundId is required" });
		}
		const result = await deletePlaygroundForUser(req.user.id, playgroundId);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}

