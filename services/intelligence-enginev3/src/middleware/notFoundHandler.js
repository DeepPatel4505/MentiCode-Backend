// 404 handler for unmatched routes.

export const notFoundHandler = (req, res) => {
    return res.status(404).json({
        error: "Not found",
        path: req.originalUrl || req.url,
    });
};

