import { Router } from "express";
import {
  updateLessonProgress,
  submitLevelAttempt,
  getLevelAttempts,
} from "../controllers/progress.controller.js";
import {
  updateLessonProgressValidator,
  submitLevelAttemptValidator,
} from "../validators/enrollment.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Lesson progress ───────────────────────────────────────────
// PATCH /api/v1/lessons/:lessonId/progress
router.route("/lessons/:lessonId/progress").patch(
  verifyJWT,
  updateLessonProgressValidator(),
  validate,
  updateLessonProgress
);

// ── Level attempts ────────────────────────────────────────────
// POST /api/v1/levels/:levelId/attempt
router.route("/levels/:levelId/attempt").post(
  verifyJWT,
  submitLevelAttemptValidator(),
  validate,
  submitLevelAttempt
);

// GET /api/v1/levels/:levelId/attempts
router.route("/levels/:levelId/attempts").get(verifyJWT, getLevelAttempts);

export default router;
