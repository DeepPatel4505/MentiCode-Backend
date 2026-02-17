// Centralized Express error-handling middleware.
// Ensures consistent error responses and structured logging.

export const errorHandler = (err, req, res, next) => {
    // Fallbacks
    const statusCode = err.statusCode && Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;

    const publicMessage =
        err.publicMessage || (statusCode === 500 ? "Internal server error" : "Request failed");

    const logEntry = {
        level: "error",
        msg: "unhandled_error",
        error: err.message,
        stack: err.stack,
        path: req.originalUrl || req.url,
        method: req.method,
        requestId: req.id,
    };

    // In production, this can be swapped out for a real logger.
    console.error(JSON.stringify(logEntry));

    if (res.headersSent) {
        return next(err);
    }

    return res.status(statusCode).json({
        error: publicMessage,
    });
};

