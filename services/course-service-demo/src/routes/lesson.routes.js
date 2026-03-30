import { Router } from "express";
import {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "../controllers/lesson.controller.js";
import { createLessonValidator, updateLessonValidator } from "../validators/content.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { guardLesson } from "../middlewares/access-guard.middleware.js";

// Mounted at /api/v1/sections/:sectionId/lessons
const sectionLessonRouter = Router({ mergeParams: true });

sectionLessonRouter.route("/").get(getLessons);
sectionLessonRouter.route("/reorder").patch(verifyJWT, reorderLessons);
sectionLessonRouter.route("/").post(verifyJWT, createLessonValidator(), validate, createLesson);

// Standalone lesson routes — mounted at /api/v1/lessons
const lessonRouter = Router();

lessonRouter.route("/:lessonId").get(verifyJWT, guardLesson, getLessonById);
lessonRouter.route("/:lessonId").patch(verifyJWT, updateLesson);
lessonRouter.route("/:lessonId").delete(verifyJWT, deleteLesson);

export { sectionLessonRouter, lessonRouter };
