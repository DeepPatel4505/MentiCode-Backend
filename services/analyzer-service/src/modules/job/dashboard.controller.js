import { getDashboardDataForUser } from "./dashboard.service.js";

export async function getDashboard(req, res, next) {
	try {
		const result = await getDashboardDataForUser(req.user.id);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}
