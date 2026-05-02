import { Router } from "express";
import { getJobResult, getJobStatus, startAnalysis } from "./job.controller.js";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

router.post("/playgrounds/:playgroundId/files/:fileId/analyze", startAnalysis);
router.get("/jobs/:jobId", getJobStatus);
router.get("/jobs/:jobId/result", getJobResult);
router.get("/dashboard", getDashboard);

export default router;
