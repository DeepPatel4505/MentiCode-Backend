import ApiError from './ApiError.js';
import logger from './logger.js';

/**
 * Centralized Express 4-argument error-handling middleware.
 * Mount LAST in app.js, after all routes and notFoundHandler.
 *
 * Responds with a consistent JSON shape:
 *   { code, message, path, details? }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // Determine status code — operational errors keep theirs, unexpected become 500
    const statusCode =
        err instanceof ApiError && Number.isInteger(err.statusCode)
            ? err.statusCode
            : 500;

    const message =
        typeof err?.message === 'string' && err.message.trim()
            ? err.message
            : 'Internal server error';

    // Structured log
    logger.base.error(
        {
            err: {
                message: err.message,
                stack: err.stack,
                showStack: statusCode >= 500,
            },
            method: req.method,
            url: req.originalUrl,
            statusCode,
        },
        'http.error'
    );

    if (res.headersSent) {
        return next(err);
    }

    const body = {
        code: statusCode,
        message,
        path: req.originalUrl,
    };

    if (process.env.NODE_ENV === 'development') {
        body.details = err instanceof ApiError ? err.details : { stack: err.stack };
    }

    return res.status(statusCode).json(body);
};

export default errorHandler;
