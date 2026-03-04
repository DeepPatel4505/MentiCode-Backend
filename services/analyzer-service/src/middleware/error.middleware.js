export function notFoundHandler(req, res) {
	return res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
	if (res.headersSent) {
		return next(err);
	}

	const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
	const message = typeof err?.message === "string" && err.message.trim() ? err.message : "Internal server error";

	return res.status(statusCode).json({ error: message });
}
