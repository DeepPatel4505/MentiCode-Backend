/**
 * compat.routes.js
 *
 * Backward-compatibility layer: exposes the legacy IE4 /code_review endpoint.
 *
 * This lets the existing MentiCode frontend continue working unchanged while
 * IE5's stateful engine runs underneath. It creates a full analysis session,
 * waits for it to complete (synchronously, with a poll loop), then maps the
 * session findings back into IE4's response shape.
 *
 * IE4 response shape:
 * {
 *   summary: { risk_level, overall_quality },
 *   findings: [{ category, severity, line_range, abstract_issue, issue, why_it_matters, hint, guided_fix }],
 *   final_solution: null,
 *   meta: { cached, provider, latency_ms, complexity_score }
 * }
 */

import { Router } from "express";
import { resolveInput } from "../../ingestion/inputResolver.js";
import { runAnalysis } from "../../engine/analyser.js";
import { BudgetTracker } from "../../budget/budgetTracker.js";
import { persistSessionFile } from "../../ingestion/storage.js";
import { prisma } from "../../db.js";

const router = Router();

const MAX_POLL_MS = 120_000;  // 2-minute max wait
const POLL_INTERVAL_MS = 800;

async function waitForSession(sessionId) {
    const deadline = Date.now() + MAX_POLL_MS;
    while (Date.now() < deadline) {
        const session = await prisma.reviewSession.findUnique({
            where: { id: sessionId },
            select: { status: true },
        });
        if (session?.status === "DONE" || session?.status === "FAILED") {
            return session.status;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    return "TIMEOUT";
}

function mapSeverityToIE4(severity) {
    const map = { HIGH: "critical", MEDIUM: "major", LOW: "minor" };
    return map[severity] ?? "minor";
}

function mapFindingsToIE4(findings) {
    return findings.map((f) => ({
        category: "bug",
        severity: mapSeverityToIE4(f.severity),
        line_range: [f.line, f.line],
        abstract_issue: f.issue,
        issue: f.issue,
        why_it_matters: f.why,
        hint: f.hint,
        guided_fix: f.hint,
        full_fix: null,
    }));
}

function computeRiskLevel(findings) {
    if (findings.some((f) => f.severity === "HIGH")) return "high";
    if (findings.some((f) => f.severity === "MEDIUM")) return "medium";
    return "low";
}

// POST /code_review — legacy IE4-compatible endpoint
router.post("/", async (req, res, next) => {
    const startTime = Date.now();

    try {
        const { language, code, mode: _mode } = req.body ?? {};

        if (!language || !code) {
            const err = new Error("Fields 'language' and 'code' are required.");
            err.statusCode = 400;
            return next(err);
        }

        if (code.length > 50_000) {
            const err = new Error("Field 'code' exceeds max length of 50000 characters.");
            err.statusCode = 400;
            return next(err);
        }

        const resolved = await resolveInput({ code, language });

        // Create session + run analysis synchronously (compat endpoint must block)
        const session = await prisma.reviewSession.create({
            data: {
                language: resolved.language,
                filePath: null,
                status: "PENDING",
            },
        });

        if (code) {
            const savedPath = await persistSessionFile(session.id, resolved.source, resolved.language);
            await prisma.reviewSession.update({
                where: { id: session.id },
                data: { filePath: savedPath },
            });
        }

        const budget = new BudgetTracker();
        runAnalysis(
            session.id,
            resolved.source,
            resolved.langConfig,
            resolved.language,
            budget,
        ).catch(console.error);

        const finalStatus = await waitForSession(session.id);

        if (finalStatus === "FAILED") {
            throw new Error("Analysis failed internally. Try again.");
        }

        if (finalStatus === "TIMEOUT") {
            throw new Error("Analysis timed out. Use /review with async polling for large files.");
        }

        // Fetch all open findings
        const chunks = await prisma.chunk.findMany({
            where: { sessionId: session.id },
            include: {
                findings: { where: { status: "OPEN" } },
            },
        });

        const allFindings = chunks.flatMap((c) =>
            c.findings.map((f) => ({ ...f, chunkName: c.name })),
        );

        const ie4Findings = mapFindingsToIE4(allFindings);

        const riskLevel = computeRiskLevel(allFindings);
        const providers = budget.summary();
        const latencyMs = Date.now() - startTime;

        return res.status(200).json({
            summary: {
                risk_level: riskLevel,
                overall_quality: ie4Findings.length === 0 ? 100 : Math.max(0, 100 - ie4Findings.length * 10),
            },
            findings: ie4Findings.slice(0, 8), // cap at 8, same as IE4
            final_solution: null,
            meta: {
                cached: false,
                provider: `ie5:${Object.entries(providers).filter(([, v]) => v > 0).map(([k]) => k).join(",")}`,
                latency_ms: latencyMs,
                complexity_score: null,
                session_id: session.id,  // bonus: let frontend link to full session
            },
        });
    } catch (err) {
        return next(err);
    }
});

export default router;
