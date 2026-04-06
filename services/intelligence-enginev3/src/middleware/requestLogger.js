import crypto from "crypto";
import logger from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
    // Nanosecond-precision timer via process.hrtime.bigint().
    const elapsed = logger.startTimer();

    // RFC 4122 v4 UUID — cryptographically random, globally unique.
    req.id = req.headers["x-request-id"] || crypto.randomUUID();

    // Propagate request ID to downstream consumers via response header.
    res.setHeader("X-Request-Id", req.id);

    res.on("finish", () => {
        const { durationNs, durationMs, durationSec } = elapsed();

        logger.info("http_request", {
            requestId: req.id,
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode: res.statusCode,
            contentLength: res.getHeader("content-length") || 0,
            userAgent: req.headers["user-agent"] || "-",
            durationNs,
            durationMs,
            durationSec,
        });
    });

    next();
};
