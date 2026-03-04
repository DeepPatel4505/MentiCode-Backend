import { Router } from "express";
import { getJobResult, getJobStatus, startAnalysis } from "./job.controller.js";

const router = Router();

router.post("/playgrounds/:playgroundId/files/:fileId/analyze", startAnalysis);
router.get("/jobs/:jobId", getJobStatus);
router.get("/jobs/:jobId/result", getJobResult);

export default router;
