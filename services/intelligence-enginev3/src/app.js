import express from "express";
import config from "./config/config.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import codeReviewRoutes from "./routes/codeReviewRoutes.js";

const app = express();

// Core middleware
app.use(express.json({ limit: "256kb" }));

// Lightweight request logging suitable for production; can be swapped for
// a dedicated logging library later without changing application code.
app.use(requestLogger);

// Health check endpoint for monitoring and orchestration systems.
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        env: config.env,
    });
});

// Basic landing route
app.get("/", (req, res) => {
    res.send("Welcome to the Intelligence Engine v3 API");
});

// Application routes
app.use("/code_review", codeReviewRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
