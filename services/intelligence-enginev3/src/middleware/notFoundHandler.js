// 404 handler for unmatched routes.

import logger from "../utils/logger.js";

export const notFoundHandler = (req, res) => {
    const path = req.originalUrl || req.url;

    logger.warn("route_not_found", {
        requestId: req.id,
        method: req.method,
        path,
    });

    return res.status(404).json({
        error: "Not found",
        path,
        requestId: req.id,
    });
};
