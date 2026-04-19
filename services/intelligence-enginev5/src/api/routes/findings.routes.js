import { Router } from "express";
import { prisma } from "../../db.js";

const router = Router();

const USER_ALLOWED_STATUSES = new Set(["WONTFIX", "ACKNOWLEDGED"]);

// ─── PATCH /findings/:id/status ───────────────────────────────────────────────
// User marks a finding as WONTFIX or ACKNOWLEDGED.
router.patch("/:id/status", async (req, res, next) => {
    try {
        const { status } = req.body ?? {};

        if (!USER_ALLOWED_STATUSES.has(status)) {
            const err = new Error(
                `Invalid status '${status}'. Allowed values: WONTFIX, ACKNOWLEDGED.`,
            );
            err.statusCode = 400;
            return next(err);
        }

        const finding = await prisma.finding.findUnique({ where: { id: req.params.id } });

        if (!finding) {
            const err = new Error("Finding not found.");
            err.statusCode = 404;
            return next(err);
        }

        const updated = await prisma.finding.update({
            where: { id: req.params.id },
            data: {
                status,
                resolvedAt: status === "WONTFIX" ? new Date() : undefined,
            },
        });

        return res.json(updated);
    } catch (err) {
        return next(err);
    }
});

// ─── GET /findings/:id ────────────────────────────────────────────────────────
// Get a single finding with its chunk context.
router.get("/:id", async (req, res, next) => {
    try {
        const finding = await prisma.finding.findUnique({
            where: { id: req.params.id },
            include: {
                chunk: {
                    include: { session: { select: { id: true, language: true, status: true } } },
                },
            },
        });

        if (!finding) {
            const err = new Error("Finding not found.");
            err.statusCode = 404;
            return next(err);
        }

        return res.json(finding);
    } catch (err) {
        return next(err);
    }
});

export default router;
