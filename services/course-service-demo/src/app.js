import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

const app = express();

// ── Security & utilities ──────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Rate limiting ─────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX        ?? "100",   10),
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, message: "Too many requests, please try again later" },
  })
);

// ── CORS ──────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods:     ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    headers:     ["Authorization", "Content-Type"],
  })
);

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────
import healthRouter from "./routes/health.routes.js";
app.use("/api/v1/health", healthRouter);

import courseRouter from "./routes/course.routes.js";
app.use("/api/v1/courses", courseRouter);

import sectionRouter from "./routes/section.routes.js";
app.use("/api/v1/courses/:courseId/sections", sectionRouter);

import { sectionLessonRouter, lessonRouter } from "./routes/lesson.routes.js";
app.use("/api/v1/sections/:sectionId/lessons", sectionLessonRouter);
app.use("/api/v1/lessons", lessonRouter);

import { sectionLevelRouter, levelRouter } from "./routes/gameLevel.routes.js";
app.use("/api/v1/sections/:sectionId/levels", sectionLevelRouter);
app.use("/api/v1/levels", levelRouter);

import enrollmentRouter from "./routes/enrollment.routes.js";
app.use("/api/v1/courses/:courseId", enrollmentRouter);

import myEnrollmentsRouter from "./routes/my-enrollments.routes.js";
app.use("/api/v1/enrollments", myEnrollmentsRouter);

import progressRouter from "./routes/progress.routes.js";
app.use("/api/v1", progressRouter);

import roadmapRouter from "./routes/roadmap.routes.js";
app.use("/api/v1/roadmaps", roadmapRouter);

import gamificationRouter from "./routes/gamification.routes.js";
app.use("/api/v1", gamificationRouter);

// ── Global error handler — same shape as your auth service ────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    data:    err.data  ?? null,
    error:   err.error ?? null,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

export default app;
