import { buildReviewPrompt } from "../llm/buildReviewPrompt.js";
import { llmRouter } from "../llm/router.js";
import { parseAndExtractAST } from "../ast/analyzer.js";
import { cleanResponse } from "../utils/cleanResponse.js";
import { addLineNumbers, chunkCode, normalizeCode } from "../utils/codeProcessor.js";
import { mergeFindings } from "../utils/mergeFindings.js";
import logger from "../utils/logger.js";

export async function runCodeReview({ language, code, mode, requestId }) {
    const processedCode = normalizeCode(code);
    logger.info("code_review_llm_start", {
        requestId,
        language,
        codeLength: code.length,
    });

    const astResult = await parseAndExtractAST(processedCode, language);
    let blocks = [];
    let isAst = false;
    let complexityScore = 0;

    if (astResult && astResult.functions) {
        isAst = true;
        complexityScore = astResult.complexityScore;
        blocks = astResult.functions.map((func, index) => ({
            index,
            startLine: func.startLine,
            endLine: func.endLine,
            code: func.code
        }));
    } else {
        blocks = chunkCode(processedCode);
    }

    const chunkResponses = [];
    const providers = new Set();
    let totalLatencyMs = 0;

    for (const block of blocks) {
        const numberedChunkCode = addLineNumbers(block.code);
        const prompt = buildReviewPrompt({
            language,
            code: numberedChunkCode,
            mode,
            chunk: {
                index: block.index,
                startLine: block.startLine,
                endLine: block.endLine,
                totalChunks: blocks.length,
            },
            astContext: isAst ? astResult : null
        });

        const { result, provider, latency_ms } = await llmRouter.generateReview({
            language,
            code: numberedChunkCode,
            mode,
            prompt,
        });

        providers.add(provider);
        totalLatencyMs += latency_ms;

        const cleaned = cleanResponse(result);
        const lineOffset = block.startLine - 1;

        chunkResponses.push({
            summary: cleaned.summary,
            findings: cleaned.findings.map((finding) => ({
                ...finding,
                line_range: [
                    finding.line_range[0] + lineOffset,
                    finding.line_range[1] + lineOffset,
                ],
            })),
            final_solution: cleaned.final_solution,
        });
    }

    const merged = mergeFindings(chunkResponses, { maxFindings: 8 });
    const providerLabel = Array.from(providers).join(",");

    logger.info("code_review_llm_complete", {
        requestId,
        language,
        providers: providerLabel,
        chunks: blocks.length,
        findings: merged.findings.length,
        latency_ms: totalLatencyMs,
    });

    const response = {
        ...merged,
        meta: {
            cached: false,
            provider: providerLabel || "unknown",
            latency_ms: totalLatencyMs,
            complexity_score: isAst ? complexityScore : null
        },
    };

    return response;
}
