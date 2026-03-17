import * as env from "./config/env.js";
import cors from "cors";
import express from "express";
import { ApiResponse, logger } from "@menticode/shared";
const app = express();


// Import routes
import playgroundRoutes from "./modules/playground/playground.routes.js";
import fileRoutes from "./modules/file/file.routes.js";
import jobRoutes from "./modules/job/job.routes.js";
import { queueAdminRouter } from "./admin/queue.admin.js";
import { requireAdmin, requireAuth } from "./middleware/auth.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";


app.use(cors({
    origin: 'http://localhost:5173', // Adjust this to your frontend URL
    credentials: true,
}));
app.use(express.json());

app.use((req, res, next) => {
    const startedAt = Date.now();
    logger.base.info({ method: req.method, path: req.originalUrl }, "request.start");

    res.on("finish", () => {
        logger.base.info(
            {
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt,
            },
            "request.end"
        );
    });

    next();
});

// Use routes
app.get("/api/v1/", (req, res) => {
    return res
        .status(200)
        .json(ApiResponse.success("Welcome to the Analyzer Service API", { version: "1.0.0" }));
});
app.use("/api/v1/analysis", requireAuth, playgroundRoutes);
app.use("/api/v1/analysis", requireAuth, fileRoutes);
app.use("/api/v1/analysis", requireAuth, jobRoutes);
app.use("/admin/queues", requireAuth, requireAdmin, queueAdminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
export default app;