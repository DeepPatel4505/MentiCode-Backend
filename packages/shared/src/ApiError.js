class ApiError extends Error {
    constructor(statusCode, message = 'Something went wrong', details = {}, path = '') {
        // Mask Prisma errors
        const isPrismaError =
            details?.name?.toLowerCase?.().includes('prisma') ||
            details?.message?.toLowerCase?.().includes('prisma') ||
            false;

        const finalMsg = isPrismaError ? 'Something went wrong...' : message;

        super(finalMsg);

        this.statusCode = statusCode;
        this.details = details;
        this.path = path;

        Error.captureStackTrace(this, this.constructor);
    }

    // Used only inside the global error handler
    toJSON() {
        return {
            code: this.statusCode,
            message: this.message,
            path: this.path,
            details: process.env.NODE_ENV === 'development' ? this.details : undefined,
        };
    }

    // Helper methods
    static badRequest(msg = 'Bad request', details = {}, path = '') {
        return new ApiError(400, msg, details, path);
    }

    static unauthorized(msg = 'Unauthorized', details = {}, path = '') {
        return new ApiError(401, msg, details, path);
    }

    static forbidden(msg = 'Forbidden', details = {}, path = '') {
        return new ApiError(403, msg, details, path);
    }

    static notFound(msg = 'Not found', details = {}, path = '') {
        return new ApiError(404, msg, details, path);
    }

    static internal(msg = 'Internal server error', details = {}, path = '') {
        return new ApiError(500, msg, details, path);
    }
}

export default ApiError;
