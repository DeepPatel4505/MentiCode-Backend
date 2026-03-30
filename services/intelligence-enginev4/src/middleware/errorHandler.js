import logger from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
    const statusCode =
        Number.isInteger(err?.statusCode) && err.statusCode >= 400
            ? err.statusCode
            : 500;

    const isServerError = statusCode >= 500;

    logger.error("request_error", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode,
        message: err?.message || "Unexpected error",
        attempts: Array.isArray(err?.attempts) ? err.attempts : undefined,
        stack: isServerError ? err?.stack : undefined,
    });

    if (res.headersSent) {
        return next(err);
    }

    const body = {
        error: isServerError ? "Internal server error" : err.message,
        requestId: req.requestId,
    };

    if (process.env.NODE_ENV !== "production" && Array.isArray(err?.attempts)) {
        body.details = {
            attempts: err.attempts,
        };
    }

    return res.status(statusCode).json(body);
}
