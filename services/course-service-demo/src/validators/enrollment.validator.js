import { body } from "express-validator";

// ── Enrollment ────────────────────────────────────────────────

export const enrollValidator = () => [
  body("takePlacementQuiz")
    .optional()
    .isBoolean().withMessage("takePlacementQuiz must be a boolean"),
];

export const placementSubmitValidator = () => [
  body("answers")
    .notEmpty().withMessage("Answers are required")
    .isArray({ min: 1 }).withMessage("Answers must be a non-empty array"),

  body("answers.*.questionId")
    .notEmpty().withMessage("Each answer must have a questionId"),

  body("answers.*.answer")
    .notEmpty().withMessage("Each answer must have an answer value"),
];

// ── Progress ──────────────────────────────────────────────────

export const updateLessonProgressValidator = () => [
  body("watchedUpTo")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("watchedUpTo must be a non-negative integer (seconds)"),

  body("isCompleted")
    .optional()
    .isBoolean().withMessage("isCompleted must be a boolean"),
];

// ── Level Attempt ─────────────────────────────────────────────

export const submitLevelAttemptValidator = () => [
  body("answers")
    .notEmpty().withMessage("Answers are required")
    .isArray({ min: 1 }).withMessage("Answers must be a non-empty array"),

  body("answers.*.questionId")
    .notEmpty().withMessage("Each answer must have a questionId"),

  body("answers.*.answer")
    .exists().withMessage("Each answer must have an answer value"),
];

// ── Section Skip ──────────────────────────────────────────────

export const skipSectionValidator = () => [
  body("sectionId")
    .notEmpty().withMessage("sectionId is required")
    .isUUID().withMessage("sectionId must be a valid UUID"),
];

// ── Review ────────────────────────────────────────────────────

export const createReviewValidator = () => [
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Comment cannot exceed 1000 characters"),
];

// ── Roadmap ───────────────────────────────────────────────────

export const createRoadmapValidator = () => [  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  body("thumbnail")
    .optional()
    .isURL().withMessage("Thumbnail must be a valid URL"),

  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),
];

export const updateRoadmapValidator = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),

  body("thumbnail")
    .optional()
    .isURL().withMessage("Thumbnail must be a valid URL"),
];

export const addCourseToRoadmapValidator = () => [
  body("courseId")
    .notEmpty().withMessage("courseId is required")
    .isUUID().withMessage("courseId must be a valid UUID"),

  body("order")
    .optional()
    .isInt({ min: 1 }).withMessage("order must be a positive integer"),
];

// ── Track ─────────────────────────────────────────────────────

export const createTrackValidator = () => [
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

  body("freeUpToNode")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("freeUpToNode must be a non-negative integer"),
];

export const updateTrackValidator = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage("Title must be 2–150 characters"),

  body("order")
    .optional()
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("freeUpToNode")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("freeUpToNode must be a non-negative integer"),
];

// ── TrackNode ─────────────────────────────────────────────────

export const createTrackNodeValidator = () => [
  body("courseId")
    .notEmpty().withMessage("courseId is required")
    .isUUID().withMessage("courseId must be a valid UUID"),

  body("order")
    .notEmpty().withMessage("Order is required")
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("isSkippable")
    .optional()
    .isBoolean().withMessage("isSkippable must be a boolean"),

  body("prerequisiteIds")
    .optional()
    .isArray().withMessage("prerequisiteIds must be an array"),

  body("prerequisiteIds.*")
    .optional()
    .isUUID().withMessage("Each prerequisiteId must be a valid UUID"),
];

export const updateTrackNodeValidator = () => [
  body("order")
    .optional()
    .isInt({ min: 1 }).withMessage("Order must be a positive integer"),

  body("isSkippable")
    .optional()
    .isBoolean().withMessage("isSkippable must be a boolean"),

  body("prerequisiteIds")
    .optional()
    .isArray().withMessage("prerequisiteIds must be an array"),
];

// ── Roadmap Enrollment ────────────────────────────────────────

export const roadmapEnrollValidator = () => [
  body("trackId")
    .notEmpty().withMessage("trackId is required")
    .isUUID().withMessage("trackId must be a valid UUID"),
];
