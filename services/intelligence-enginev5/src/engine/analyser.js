import { chunkByAST } from "../chunker/astChunker.js";
import { fallbackChunk } from "../chunker/fallbackChunker.js";
import { hashChunk } from "../chunker/chunkHasher.js";
import { buildCallGraph } from "../callGraph/callGraphBuilder.js";
import { classifyComplexity } from "../router/complexityClassifier.js";
import { routeLLM } from "../router/llmRouter.js";
import { buildAnalysisPrompt } from "../llm/promptBuilder.js";
import { parseFindings } from "../llm/responseParser.js";
import { validateFindings } from "../validators/findingValidator.js";
import { detectStaticBugs } from "./staticBugDetector.js";
import { prisma } from "../db.js";
import logger from "../utils/logger.js";

/**
 * runAnalysis — orchestrates a full first-time analysis run for a session.
 *
 * Steps:
 *   1. Chunk the source via AST or fallback
 *   2. Build call graph for cross-chunk context
 *   3. For each chunk:
 *      a. Classify complexity
 *      b. Route to appropriate LLM
 *      c. Parse + validate findings
 *      d. Persist chunk + findings to DB
 *   4. Mark session DONE (or FAILED on error)
 *
 * Runs async — caller starts it without awaiting, polls session status via GET /review/:id.
 *
 * @param {string} sessionId
 * @param {string} source - full source code
 * @param {object|null} langConfig - from languageMap, or null for fallback chunking
 * @param {string} language - language label for prompt context
 * @param {BudgetTracker} budget
 */
export async function runAnalysis(sessionId, source, langConfig, language, budget) {
    try {
        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { status: "ANALYSING" },
        });

        // ── 1. Chunk ──────────────────────────────────────────────────────────
        let rawChunks = null;
        if (langConfig) {
            rawChunks = await chunkByAST(source, langConfig);
        }
        if (!rawChunks || rawChunks.length === 0) {
            rawChunks = fallbackChunk(source);
        }

        // ── 2. Call graph ─────────────────────────────────────────────────────
        const callGraph = buildCallGraph(rawChunks);

        logger.info("analysis_started", {
            sessionId,
            language,
            chunks: rawChunks.length,
            usingAST: !!langConfig,
        });

        // ── 3. Process each chunk ─────────────────────────────────────────────
        for (const raw of rawChunks) {
            const hash = hashChunk(raw.code);

            const chunk = await prisma.chunk.create({
                data: {
                    sessionId,
                    chunkType: raw.chunkType,
                    name: raw.name,
                    startLine: raw.startLine,
                    endLine: raw.endLine,
                    hash,
                },
            });

            const complexity = await classifyComplexity(raw.code, langConfig);

            const prompt = buildAnalysisPrompt({
                chunk: { ...raw, language },
                priorFindings: [],
                wontfixFindings: [],
                depFindings: [],
            });

            let llmResult;
            try {
                llmResult = await routeLLM(prompt, complexity, budget);
            } catch (err) {
                logger.warn("chunk_llm_failed", {
                    sessionId,
                    chunkName: raw.name,
                    error: err.message,
                });
                await prisma.chunk.update({
                    where: { id: chunk.id },
                    data: { analysedAt: new Date() },
                });
                continue; // Skip this chunk — don't fail the whole session
            }

            const parsed = parseFindings(llmResult.text, raw);
            const valid = validateFindings(
                parsed,
                source.split("\n"),
                raw.startLine,
                raw.endLine,
                raw.code,
            );

            // Run static bug detection in parallel
            const staticFindings = detectStaticBugs(raw.code, language, raw.startLine);

            // Merge findings, deduplicating by line + issue
            const allFindings = [...valid, ...staticFindings];
            const mergedFindings = [];
            const seen = new Set();

            for (const f of allFindings) {
                const key = `${f.line}:${f.issue}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    mergedFindings.push(f);
                }
            }

            await prisma.chunk.update({
                where: { id: chunk.id },
                data: { analysedAt: new Date() },
            });

            for (const f of mergedFindings) {
                await prisma.finding.create({
                    data: {
                        chunkId: chunk.id,
                        line: f.line,
                        issue: f.issue,
                        why: f.why,
                        hint: f.hint,
                        severity: f.severity.toUpperCase(),
                        status: "OPEN",
                        chunkHashAtDetection: hash,
                    },
                });
            }

            logger.info("chunk_analysed", {
                sessionId,
                chunkName: raw.name,
                provider: llmResult.provider,
                latency_ms: llmResult.latency_ms,
                findings: mergedFindings.length,
                llmFindings: valid.length,
                staticFindings: staticFindings.length,
            });
        }

        // ── 4. Mark session DONE ──────────────────────────────────────────────
        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { status: "DONE" },
        });

        logger.info("analysis_complete", {
            sessionId,
            budget: budget.summary(),
        });
    } catch (err) {
        logger.error("analysis_failed", { sessionId, error: err.message });

        await prisma.reviewSession.update({
            where: { id: sessionId },
            data: { status: "FAILED" },
        });
    }
}
