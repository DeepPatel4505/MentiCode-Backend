import { body } from "express-validator";

// ── Section ──────────────────────────────────────────────────

export const createSectionValidator = () => [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 2, max: 150 }).withMessage("Title must be 2–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("order")
    .notEmpty().withMessage("Order is required")
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("type")
    .optional()
    .isIn(["video_section", "challenge_section"])
    .withMessage("Type must be video_section or challenge_section"),

  body("isSkippable")
    .optional()
    .isBoolean().withMessage("isSkippable must be a boolean"),
];

export const updateSectionValidator = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage("Title must be 2–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("order")
    .optional()
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("type")
    .optional()
    .isIn(["video_section", "challenge_section"])
    .withMessage("Type must be video_section or challenge_section"),

  body("isSkippable")
    .optional()
    .isBoolean().withMessage("isSkippable must be a boolean"),
];

// ── Lesson ───────────────────────────────────────────────────

export const createLessonValidator = () => [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters"),

  body("order")
    .notEmpty().withMessage("Order is required")
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("type")
    .optional()
    .isIn(["video", "article", "attachment"])
    .withMessage("Type must be video, article, or attachment"),

  body("videoUrl")
    .optional()
    .isURL().withMessage("videoUrl must be a valid URL"),

  body("duration")
    .optional()
    .isInt({ min: 0 }).withMessage("Duration must be a non-negative integer (seconds)"),

  body("body")
    .optional()
    .isString().withMessage("Body must be a string"),

  body("attachmentUrl")
    .optional()
    .isURL().withMessage("attachmentUrl must be a valid URL"),

  body("isPreview")
    .optional()
    .isBoolean().withMessage("isPreview must be a boolean"),
];

export const updateLessonValidator = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters"),

  body("order")
    .optional()
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("type")
    .optional()
    .isIn(["video", "article", "attachment"])
    .withMessage("Type must be video, article, or attachment"),

  body("videoUrl")
    .optional()
    .isURL().withMessage("videoUrl must be a valid URL"),

  body("duration")
    .optional()
    .isInt({ min: 0 }).withMessage("Duration must be a non-negative integer"),

  body("isPreview")
    .optional()
    .isBoolean().withMessage("isPreview must be a boolean"),
];

// ── GameLevel ─────────────────────────────────────────────────

export const createGameLevelValidator = () => [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters"),

  body("order")
    .notEmpty().withMessage("Order is required")
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("type")
    .optional()
    .isIn(["quiz", "drag_drop", "code_challenge", "fill_blank"])
    .withMessage("Type must be quiz, drag_drop, code_challenge, or fill_blank"),

  body("xpReward")
    .optional()
    .isInt({ min: 0 }).withMessage("xpReward must be a non-negative integer"),

  body("passingScore")
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage("passingScore must be between 0 and 100"),

  body("cooldownMinutes")
    .optional()
    .isInt({ min: 0 }).withMessage("cooldownMinutes must be a non-negative integer"),

  body("config")
    .optional()
    .isObject().withMessage("config must be a JSON object"),

  body("isPublished")
    .optional()
    .isBoolean().withMessage("isPublished must be a boolean"),
];

export const updateGameLevelValidator = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters"),

  body("order")
    .optional()
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("type")
    .optional()
    .isIn(["quiz", "drag_drop", "code_challenge", "fill_blank"])
    .withMessage("Invalid type"),

  body("xpReward")
    .optional()
    .isInt({ min: 0 }).withMessage("xpReward must be a non-negative integer"),

  body("passingScore")
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage("passingScore must be between 0 and 100"),

  body("cooldownMinutes")
    .optional()
    .isInt({ min: 0 }).withMessage("cooldownMinutes must be a non-negative integer"),

  body("config")
    .optional()
    .isObject().withMessage("config must be a JSON object"),

  body("isPublished")
    .optional()
    .isBoolean().withMessage("isPublished must be a boolean"),
];
