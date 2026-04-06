import { Router } from "express";
import { getMyEnrollments } from "../controllers/enrollment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/v1/enrollments/my
router.get("/my", verifyJWT, getMyEnrollments);

export default router;
