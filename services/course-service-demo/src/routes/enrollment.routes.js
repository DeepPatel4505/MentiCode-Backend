import { Router } from "express";
import {
  enrollInCourse,
  getMyEnrollment,
  getCourseEnrollments,
  submitPlacementQuiz,
  skipSection,
} from "../controllers/enrollment.controller.js";
import {
  getMyCourseProgress,
  updateLessonProgress,
  submitLevelAttempt,
  getLevelAttempts,
} from "../controllers/progress.controller.js";
import {
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import {
  enrollValidator,
  placementSubmitValidator,
  skipSectionValidator,
  updateLessonProgressValidator,
  submitLevelAttemptValidator,
  createReviewValidator,
  updateTrackValidator,
} from "../validators/enrollment.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// Mounted at /api/v1/courses/:courseId
const router = Router({ mergeParams: true });

// ── Enrollment ────────────────────────────────────────────────
router.route("/enroll").post(verifyJWT, enrollValidator(), validate, enrollInCourse);
router.route("/enrollment").get(verifyJWT, getMyEnrollment);
router.route("/enrollments").get(verifyJWT, authorizeRoles("admin"), getCourseEnrollments);

// ── Placement quiz ────────────────────────────────────────────
router.route("/placement").post(verifyJWT, placementSubmitValidator(), validate, submitPlacementQuiz);

// ── Skip section ──────────────────────────────────────────────
router.route("/sections/skip").post(verifyJWT, skipSectionValidator(), validate, skipSection);

// ── Progress ──────────────────────────────────────────────────
router.route("/progress").get(verifyJWT, getMyCourseProgress);

// ── Reviews ───────────────────────────────────────────────────
router.route("/reviews").get(getCourseReviews);
router.route("/reviews").post(verifyJWT, createReviewValidator(), validate, createReview);
router.route("/reviews/:reviewId").patch(verifyJWT, updateReview);
router.route("/reviews/:reviewId").delete(verifyJWT, deleteReview);

export default router;
