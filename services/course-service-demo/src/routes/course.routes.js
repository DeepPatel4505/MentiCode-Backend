import { Router } from "express";
import {
  getAllCourses,
  getCourseBySlug,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  getMyCourses,
} from "../controllers/course.controller.js";
import { createCourseValidator, updateCourseValidator, courseQueryValidator } from "../validators/course.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Public
router.route("/").get(courseQueryValidator(), validate, getAllCourses);
router.route("/slug/:slug").get(getCourseBySlug);

// Protected
router.route("/my").get(verifyJWT, getMyCourses);
router.route("/").post(verifyJWT, authorizeRoles("admin"), createCourseValidator(), validate, createCourse);
router.route("/:id").get(verifyJWT, getCourseById);
router.route("/:id").patch(verifyJWT, updateCourseValidator(), validate, updateCourse);
router.route("/:id").delete(verifyJWT, deleteCourse);
router.route("/:id/publish").patch(verifyJWT, publishCourse);

export default router;
