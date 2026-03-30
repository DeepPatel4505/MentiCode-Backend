import { body, query } from "express-validator";

export const createCourseValidator = () => [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description must be under 2000 characters"),

  body("thumbnail")
    .optional()
    .trim()
    .isURL().withMessage("Thumbnail must be a valid URL"),

  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),

  body("language")
    .optional()
    .trim()
    .isLength({ min: 2, max: 5 }).withMessage("Language must be a valid code"),

  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Difficulty must be beginner, intermediate, or advanced"),

  body("freeUpToLesson")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("freeUpToLesson must be a non-negative integer"),

  body("freeUpToLevel")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("freeUpToLevel must be a non-negative integer"),
];

export const updateCourseValidator = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description must be under 2000 characters"),

  body("thumbnail")
    .optional()
    .trim()
    .isURL().withMessage("Thumbnail must be a valid URL"),

  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),

  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Difficulty must be beginner, intermediate, or advanced"),

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),

  body("freeUpToLesson")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("freeUpToLesson must be a non-negative integer"),

  body("freeUpToLevel")
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage("freeUpToLevel must be a non-negative integer"),
];

export const courseQueryValidator = () => [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),

  query("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status filter"),

  query("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty filter"),
];
