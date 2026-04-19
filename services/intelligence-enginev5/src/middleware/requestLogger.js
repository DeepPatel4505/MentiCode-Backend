import crypto from "crypto";
import logger from "../utils/logger.js";

export function requestLogger(req, res, next) {
    req.requestId = crypto.randomUUID();
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const latencyMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
        logger.info("http_request", {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            latency_ms: latencyMs,
        });
    });

    next();
}
