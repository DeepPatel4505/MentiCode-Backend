import express from "express";
import cors from "cors";
import config from "./config.js";
import logger from "./utils/logger.js";
import { analyze } from "./core/pipeline.js";
import { errorHandler } from "./middleware/error-handler.js";
import { validateAnalyzeRequest } from "./middleware/validate-request.js";

// ── Express app ─────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json({ limit: config.BODY_LIMIT }));

// ── Health check ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ── Analysis endpoint ───────────────────────────────────────────────
app.post("/analyze", validateAnalyzeRequest, async (req, res, next) => {
    try {
        const { code } = req.body;
        logger.info("POST /analyze — request received", {
            codeLength: code.length,
        });

        const result = await analyze(code);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ── Global error handler (must be last) ─────────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────────────
const server = app.listen(config.PORT, () => {
    logger.info(`Intelligence Engine v2 running`, {
        port: config.PORT,
        env: config.NODE_ENV,
        model: config.OLLAMA_MODEL,
    });
});

// ── Graceful shutdown ───────────────────────────────────────────────
function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });

    // Force exit after 10 seconds if connections are still draining
    setTimeout(() => {
        logger.warn("Forceful shutdown — timeout exceeded");
        process.exit(1);
    }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
