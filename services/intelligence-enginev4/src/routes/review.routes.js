import { Router } from "express";
import { codeReviewController } from "../controllers/review.controller.js";

const router = Router();

router.post("/", codeReviewController);

export default router;
