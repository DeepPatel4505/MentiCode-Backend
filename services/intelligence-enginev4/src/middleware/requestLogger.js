import crypto from "crypto";
import logger from "../utils/logger.js";

export function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint();

    req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);

    res.on("finish", () => {
        const durationNs = process.hrtime.bigint() - startedAt;
        const durationMs = Number(durationNs) / 1_000_000;

        logger.info("http_request", {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(3)),
            userAgent: req.headers["user-agent"] || "-",
        });
    });

    next();
}
