import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from "@menticode/shared";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- Routes ---
import healthCheckRouter from "./src/routes/health-check.routes.js";
app.use("/api/v1/health/", healthCheckRouter);

import authRouter from "./src/routes/auth.routes.js";
app.use("/api/v1/auth", authRouter);

// --- 404 & Global Error Handler (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;