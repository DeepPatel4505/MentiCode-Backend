import { buildReviewPrompt } from "../llm/buildReviewPrompt.js";
import { llmRouter } from "../llm/router.js";
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

    const chunks = chunkCode(processedCode);
    const chunkResponses = [];
    const providers = new Set();
    let totalLatencyMs = 0;

    for (const chunk of chunks) {
        const numberedChunkCode = addLineNumbers(chunk.code);
        const prompt = buildReviewPrompt({
            language,
            code: numberedChunkCode,
            mode,
            chunk: {
                index: chunk.index,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                totalChunks: chunks.length,
            },
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
        const lineOffset = chunk.startLine - 1;

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
        chunks: chunks.length,
        findings: merged.findings.length,
        latency_ms: totalLatencyMs,
    });

    const response = {
        ...merged,
        meta: {
            cached: false,
            provider: providerLabel || "unknown",
            latency_ms: totalLatencyMs,
        },
    };

    return response;
}
