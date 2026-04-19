import { chunkByAST } from "../chunker/astChunker.js";
import { fallbackChunk } from "../chunker/fallbackChunker.js";
import { hashChunk } from "../chunker/chunkHasher.js";
import { buildCallGraph } from "../callGraph/callGraphBuilder.js";
import { classifyComplexity } from "../router/complexityClassifier.js";
import { routeLLM } from "../router/llmRouter.js";
import { buildAnalysisPrompt } from "../llm/promptBuilder.js";
import { parseFindings } from "../llm/responseParser.js";
import { validateFindings } from "../validators/findingValidator.js";
import { reconcileFindings } from "./findingReconciler.js";
import { prisma } from "../db.js";
import logger from "../utils/logger.js";

/**
 * runIncrementalAnalysis — re-analysis of an existing session with updated code.
 *
 * Key behaviour:
 *   - Unchanged chunks (hash match) → SKIPPED, zero LLM calls
 *   - Changed chunks → re-sent to LLM with full prior/wontfix/dep context
 *   - New chunks (not in previous session) → analysed fresh
 *   - Deleted chunks → their findings are automatically not updated
 *
 * @param {string} sessionId - must already exist in DB with status DONE
 * @param {string} newSource - updated source code
 * @param {object|null} langConfig
 * @param {string} language
 * @param {BudgetTracker} budget
 */
export async function runIncrementalAnalysis(sessionId, newSource, langConfig, language, budget) {
    try {
        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { status: "ANALYSING" },
        });

        // ── 1. Re-chunk new source ────────────────────────────────────────────
        let rawChunks = null;
        if (langConfig) {
            rawChunks = await chunkByAST(newSource, langConfig);
        }
        if (!rawChunks || rawChunks.length === 0) {
            rawChunks = fallbackChunk(newSource);
        }

        const callGraph = buildCallGraph(rawChunks);
        const sourceLines = newSource.split("\n");

        // ── 2. Load existing chunk+finding state from DB ───────────────────────
        const existingChunks = await prisma.chunk.findMany({
            where: { sessionId },
            include: { findings: true },
        });

        const chunkByName = Object.fromEntries(existingChunks.map((c) => [c.name, c]));

        let skipped = 0;
        let reanalysed = 0;

        // ── 3. Process each chunk in new source ───────────────────────────────
        for (const raw of rawChunks) {
            const newHash = hashChunk(raw.code);
            const existing = chunkByName[raw.name];

            // ── UNCHANGED: skip entirely ──────────────────────────────────────
            if (existing && existing.hash === newHash) {
                skipped++;
                continue;
            }

            reanalysed++;

            // ── Build context for changed chunk ───────────────────────────────
            const priorFindings = existing?.findings.filter(
                (f) => f.status === "OPEN" || f.status === "ACKNOWLEDGED",
            ) ?? [];

            const wontfixFindings = existing?.findings.filter(
                (f) => f.status === "WONTFIX",
            ) ?? [];

            // Dep findings: open issues from functions this chunk calls
            const calledNames = callGraph[raw.name] ?? [];
            const depFindings = [];
            for (const calledName of calledNames) {
                const depChunk = chunkByName[calledName];
                if (depChunk) {
                    const open = depChunk.findings.filter((f) => f.status === "OPEN");
                    depFindings.push(...open.map((f) => ({ ...f, chunkName: calledName })));
                }
            }

            const complexity = await classifyComplexity(raw.code, langConfig);

            const prompt = buildAnalysisPrompt({
                chunk: { ...raw, language },
                priorFindings,
                wontfixFindings,
                depFindings,
            });

            let llmResult;
            try {
                llmResult = await routeLLM(prompt, complexity, budget);
            } catch (err) {
                logger.warn("incremental_chunk_llm_failed", {
                    sessionId,
                    chunkName: raw.name,
                    error: err.message,
                });
                continue;
            }

            const parsed = parseFindings(llmResult.text, raw);
            const valid = validateFindings(
                parsed,
                sourceLines,
                raw.startLine,
                raw.endLine,
                raw.code,
            );

            // ── Upsert chunk record ───────────────────────────────────────────
            let chunk;
            if (existing) {
                chunk = await prisma.chunk.update({
                    where: { id: existing.id },
                    data: {
                        hash: newHash,
                        startLine: raw.startLine,
                        endLine: raw.endLine,
                        analysedAt: new Date(),
                    },
                });
            } else {
                chunk = await prisma.chunk.create({
                    data: {
                        sessionId,
                        chunkType: raw.chunkType,
                        name: raw.name,
                        startLine: raw.startLine,
                        endLine: raw.endLine,
                        hash: newHash,
                        analysedAt: new Date(),
                    },
                });
            }

            await reconcileFindings(
                chunk.id,
                existing?.findings ?? [],
                valid,
                newHash,
            );

            logger.info("incremental_chunk_analysed", {
                sessionId,
                chunkName: raw.name,
                provider: llmResult.provider,
                latency_ms: llmResult.latency_ms,
                findings: valid.length,
            });
        }

        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { status: "DONE" },
        });

        logger.info("incremental_analysis_complete", {
            sessionId,
            skipped,
            reanalysed,
            budget: budget.summary(),
        });
    } catch (err) {
        logger.error("incremental_analysis_failed", { sessionId, error: err.message });

        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { status: "FAILED" },
        });
    }
}
