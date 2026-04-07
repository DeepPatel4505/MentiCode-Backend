import { ApiError, logger } from "@menticode/shared";

export function notFoundHandler(req, res) {
    const err = ApiError.notFound(`Route ${req.originalUrl} not found`);
    return res.status(err.statusCode).json(err.toJSON());
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode =
        err instanceof ApiError && Number.isInteger(err.statusCode)
            ? err.statusCode
            : 500;

    const message =
        typeof err?.message === "string" && err.message.trim()
            ? err.message
            : "Internal server error";

    logger.base.error(
        {
            err: { message: err.message, stack: err.stack },
            method: req.method,
            url: req.originalUrl,
            statusCode,
        },
        "http.error"
    );

    const body = {
        code: statusCode,
        message,
        path: req.originalUrl,
    };

    if (process.env.NODE_ENV === "development") {
        body.details = err instanceof ApiError ? err.details : { stack: err.stack };
    }

    return res.status(statusCode).json(body);
}
