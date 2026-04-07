import ApiError from './ApiError.js';

/**
 * Express middleware for 404 Not Found responses.
 * Mount AFTER all routes.
 */
const notFoundHandler = (req, res) => {
    const err = ApiError.notFound(`Route ${req.originalUrl} not found`);
    return res.status(err.statusCode).json(err.toJSON());
};

export default notFoundHandler;
