// Centralized Express error-handling middleware.
// Ensures consistent error responses, structured logging, and request traceability.

import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    // Determine HTTP status — use err.statusCode when set (operational error),
    // otherwise fall back to 500 (programmer / unexpected error).
    const statusCode =
        err.statusCode && Number.isInteger(err.statusCode)
            ? err.statusCode
            : 500;

    const isOperational = statusCode < 500;
    const publicMessage =
        err.publicMessage ||
        (isOperational ? "Request failed" : "Internal server error");

    // ── Structured error log ────────────────────────────────────────────
    logger.error("unhandled_error", {
        requestId: req.id,
        error: err.message,
        stack: err.stack,
        path: req.originalUrl || req.url,
        method: req.method,
        statusCode,
        operational: isOperational,
    });

    if (res.headersSent) {
        return next(err);
    }

    // Build response payload.
    const body = {
        error: publicMessage,
        requestId: req.id,
    };

    // Expose stack trace in non-production for debugging.
    if (process.env.NODE_ENV !== "production") {
        body.detail = err.message;
        body.stack = err.stack;
    }

    return res.status(statusCode).json(body);
};
