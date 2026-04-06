import { Router } from "express";
import {
  getAllRoadmaps,
  getRoadmapBySlug,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  addCourseToRoadmap,
  removeCourseFromRoadmap,
  enrollInRoadmap,
  getMyRoadmaps,
  getMyRoadmapEnrollment,
  skipTrackNode,
} from "../controllers/roadmap.controller.js";
import {
  createRoadmapValidator,
  updateRoadmapValidator,
  addCourseToRoadmapValidator,
} from "../validators/enrollment.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT, authorizeRoles, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Static paths first (must come before /:id) ────────────────
router.route("/").get(optionalAuth, getAllRoadmaps);
router.route("/").post(verifyJWT, authorizeRoles("admin"), createRoadmapValidator(), validate, createRoadmap);
router.route("/my").get(verifyJWT, getMyRoadmaps);
router.route("/slug/:slug").get(optionalAuth, getRoadmapBySlug);

// ── Parameterized roadmap routes ──────────────────────────────
router.route("/:id").get(verifyJWT, authorizeRoles("admin"), getRoadmapById);
router.route("/:id").patch(verifyJWT, authorizeRoles("admin"), updateRoadmapValidator(), validate, updateRoadmap);
router.route("/:id").delete(verifyJWT, authorizeRoles("admin"), deleteRoadmap);

// ── Course management (trackless) ─────────────────────────────
router.route("/:id/courses").post(verifyJWT, authorizeRoles("admin"), addCourseToRoadmapValidator(), validate, addCourseToRoadmap);
router.route("/:id/courses/:nodeId").delete(verifyJWT, authorizeRoles("admin"), removeCourseFromRoadmap);

// ── Enrollment ────────────────────────────────────────────────
router.route("/:roadmapId/enroll").post(verifyJWT, enrollInRoadmap);
router.route("/:roadmapId/enrollment").get(verifyJWT, getMyRoadmapEnrollment);
router.route("/:roadmapId/nodes/:nodeId/skip").patch(verifyJWT, skipTrackNode);

export default router;
