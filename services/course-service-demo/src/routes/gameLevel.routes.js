import { Router } from "express";
import {
  getLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
  publishLevel,
} from "../controllers/gameLevel.controller.js";
import { createGameLevelValidator, updateGameLevelValidator } from "../validators/content.validator.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { guardLevel } from "../middlewares/access-guard.middleware.js";

// Mounted at /api/v1/sections/:sectionId/levels
const sectionLevelRouter = Router({ mergeParams: true });

sectionLevelRouter.route("/").get(verifyJWT, getLevels);
sectionLevelRouter.route("/").post(verifyJWT, createGameLevelValidator(), validate, createLevel);

// Standalone level routes — mounted at /api/v1/levels
const levelRouter = Router();

levelRouter.route("/:levelId").get(verifyJWT, guardLevel, getLevelById);
levelRouter.route("/:levelId").patch(verifyJWT, updateLevel);
levelRouter.route("/:levelId").delete(verifyJWT, deleteLevel);
levelRouter.route("/:levelId/publish").patch(verifyJWT, publishLevel);

export { sectionLevelRouter, levelRouter };
