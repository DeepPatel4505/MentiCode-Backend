const generateRequestId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Attach a lightweight request id for correlation.
    req.id = req.id || generateRequestId();

    res.on("finish", () => {
        const durationMs = Date.now() - start;
        const logEntry = {
            level: "info",
            msg: "http_request",
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode: res.statusCode,
            durationMs,
            requestId: req.id,
        };

        console.log(JSON.stringify(logEntry));
    });

    next();
};

