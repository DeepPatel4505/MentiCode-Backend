import { Router } from "express";
import {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from "../controllers/section.controller.js";
import { createSectionValidator, updateSectionValidator } from "../validators/content.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Mounted at /api/v1/courses/:courseId/sections
const router = Router({ mergeParams: true });

router.route("/").get(getSections);
router.route("/reorder").patch(verifyJWT, reorderSections);
router.route("/").post(verifyJWT, createSectionValidator(), validate, createSection);
router.route("/:sectionId").get(getSectionById);
router.route("/:sectionId").patch(verifyJWT, updateSectionValidator(), validate, updateSection);
router.route("/:sectionId").delete(verifyJWT, deleteSection);

export default router;
