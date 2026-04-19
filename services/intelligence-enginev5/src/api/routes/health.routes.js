import { Router } from "express";
import { prisma } from "../../db.js";
import env from "../../config/env.js";

const router = Router();

router.get("/", async (_req, res) => {
    let dbStatus = "ok";
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        dbStatus = "error";
    }

    res.json({
        status: "ok",
        service: "intelligence-enginev5",
        version: env.serviceVersion,
        db: dbStatus,
        timestamp: new Date().toISOString(),
    });
});

export default router;
