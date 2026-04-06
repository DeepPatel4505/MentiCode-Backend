import { Router } from "express";
import { projectSummaryController } from "../controllers/project.controller.js";

const router = Router();

router.post("/", projectSummaryController);

export default router;
