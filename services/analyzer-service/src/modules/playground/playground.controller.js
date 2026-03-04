import { createPlaygroundForUser, listPlaygroundsForUser } from "./playground.service.js";

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
