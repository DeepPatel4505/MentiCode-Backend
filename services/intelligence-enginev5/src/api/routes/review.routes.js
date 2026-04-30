import { Router } from "express";
import { resolveInput } from "../../ingestion/inputResolver.js";
import { runAnalysis } from "../../engine/analyser.js";
import { runIncrementalAnalysis } from "../../engine/incrementalAnalyser.js";
import { BudgetTracker } from "../../budget/budgetTracker.js";
import { persistSessionFile } from "../../ingestion/storage.js";
import { prisma } from "../../db.js";

const router = Router();

// ─── POST /review ─────────────────────────────────────────────────────────────
// Start a new analysis session. Returns sessionId immediately; analysis runs async.
// Body: { filePath?: string } | { code: string, language: string }
router.post("/", async (req, res, next) => {
    try {
        const { filePath, code, language } = req.body ?? {};
        const resolved = await resolveInput({ filePath, code, language });

        const session = await prisma.reviewSession.create({
            data: {
                language: resolved.language,
                filePath: filePath ?? null,
                status: "PENDING",
            },
        });

        if (!filePath && code) {
            const savedPath = await persistSessionFile(session.id, resolved.source, resolved.language);
            await prisma.reviewSession.update({
                where: { id: session.id },
                data: { filePath: savedPath },
            });
        }

        const budget = new BudgetTracker();

        // Fire-and-forget — client polls GET /review/:id for status
        runAnalysis(
            session.id,
            resolved.source,
            resolved.langConfig,
            resolved.language,
            budget,
        ).catch(console.error);

        return res.status(202).json({
            sessionId: session.id,
            status: "ANALYSING",
            language: resolved.language,
        });
    } catch (err) {
        err.statusCode = 400;
        return next(err);
    }
});

// ─── GET /review/:id ──────────────────────────────────────────────────────────
// Poll session status and retrieve open/regressed findings.
router.get("/:id", async (req, res, next) => {
    try {
        const session = await prisma.reviewSession.findUnique({
            where: { id: req.params.id },
            include: {
                chunks: {
                    include: {
                        findings: {
                            where: {
                                status: { in: ["OPEN", "REGRESSED", "ACKNOWLEDGED"] },
                            },
                            orderBy: [{ severity: "asc" }, { line: "asc" }],
                        },
                    },
                    orderBy: { startLine: "asc" },
                },
            },
        });

        if (!session) {
            const err = new Error("Session not found.");
            err.statusCode = 404;
            return next(err);
        }

        // Flatten findings with chunk context for easier client consumption
        const findings = [];
        for (const chunk of session.chunks) {
            for (const f of chunk.findings) {
                findings.push({
                    ...f,
                    chunkName: chunk.name,
                    chunkStartLine: chunk.startLine,
                    chunkEndLine: chunk.endLine,
                });
            }
        }

        return res.json({
            id: session.id,
            language: session.language,
            filePath: session.filePath,
            status: session.status,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            stats: {
                totalChunks: session.chunks.length,
                analysedChunks: session.chunks.filter((c) => c.analysedAt).length,
                openFindings: findings.filter((f) => f.status === "OPEN").length,
                regressedFindings: findings.filter((f) => f.status === "REGRESSED").length,
            },
            findings,
        });
    } catch (err) {
        return next(err);
    }
});

// ─── POST /review/:id/reanalyse ───────────────────────────────────────────────
// Incremental re-run with updated code. Only changed chunks hit the LLM.
// Body: same as POST /review
router.post("/:id/reanalyse", async (req, res, next) => {
    try {
        const session = await prisma.reviewSession.findUnique({
            where: { id: req.params.id },
        });

        if (!session) {
            const err = new Error("Session not found.");
            err.statusCode = 404;
            return next(err);
        }

        if (session.status === "ANALYSING") {
            const err = new Error("Session is already being analysed. Wait for it to complete.");
            err.statusCode = 409;
            return next(err);
        }

        const { filePath, code, language } = req.body ?? {};
        const resolved = await resolveInput({ filePath, code, language });

        if (code) {
            const savedPath = await persistSessionFile(session.id, resolved.source, resolved.language);
            if (session.filePath !== savedPath) {
                await prisma.reviewSession.update({
                    where: { id: session.id },
                    data: { filePath: savedPath },
                });
            }
        }

        const budget = new BudgetTracker();

        runIncrementalAnalysis(
            req.params.id,
            resolved.source,
            resolved.langConfig,
            resolved.language,
            budget,
        ).catch(console.error);

        return res.status(202).json({ status: "REANALYSING", sessionId: req.params.id });
    } catch (err) {
        err.statusCode = err.statusCode ?? 400;
        return next(err);
    }
});

export default router;
