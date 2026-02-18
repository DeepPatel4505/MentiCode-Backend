import config from "../config.js";
import logger from "../utils/logger.js";

/**
 * Global Express error-handling middleware.
 * Must be registered AFTER all routes.
 */
export function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`${statusCode} — ${message}`, {
        stack: config.NODE_ENV !== "production" ? err.stack : undefined,
    });

    res.status(statusCode).json({
        error: true,
        statusCode,
        message:
            config.NODE_ENV === "production" && statusCode === 500
                ? "Internal Server Error"
                : message,
    });
}
