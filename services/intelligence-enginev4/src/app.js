import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./routes/health.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import projectRoutes from "./routes/project.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(requestLogger);

app.use("/health", healthRoutes);
app.use("/code_review", reviewRoutes);
app.use("/project_summary", projectRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
