import express from "express";
import cors from "cors";
import helmet from "helmet";

import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./api/routes/health.routes.js";
import reviewRoutes from "./api/routes/review.routes.js";
import findingsRoutes from "./api/routes/findings.routes.js";
import compatRoutes from "./api/routes/compat.routes.js";

const app = express();

// ── Security + parsing ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "512kb" }));  // Larger than IE4 to support file content in body

// ── Logging ─────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/health", healthRoutes);
app.use("/review", reviewRoutes);
app.use("/findings", findingsRoutes);
app.use("/code_review", compatRoutes);   // IE4 backward-compat

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
