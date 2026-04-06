import { Router } from "express";
import { codeReviewController } from "../controllers/codeReviewController.js";

const router = Router();

// POST /code_review
router.post("/", codeReviewController);

export default router;

