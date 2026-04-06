import { Router } from "express";
import { getLeaderboard, getMyStreak } from "../controllers/gamification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/leaderboard", getLeaderboard);
router.get("/streak",      verifyJWT, getMyStreak);

export default router;
