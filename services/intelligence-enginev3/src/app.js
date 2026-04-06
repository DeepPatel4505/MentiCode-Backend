import express from "express";
import helmet from "helmet";
import cors from "cors";
import config from "./config/config.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import codeReviewRoutes from "./routes/codeReviewRoutes.js";
import { createRequire } from "module";

// Read version from package.json at startup (once, not per-request).
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const app = express();

// ── Security ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ── Core middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));

// Structured request logging with nanosecond-precision timing.
app.use(requestLogger);

// ── Health check (orchestration / monitoring) ───────────────────────────
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        env: config.env,
        version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ── Landing route ───────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("Welcome to the Intelligence Engine v3 API");
});

// ── Application routes ──────────────────────────────────────────────────
app.use("/code_review", codeReviewRoutes);

// ── 404 handler ─────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Centralized error handler (must be last) ────────────────────────────
app.use(errorHandler);

export default app;
