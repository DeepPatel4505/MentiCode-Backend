import { buildReviewPrompt } from "../llm/buildReviewPrompt.js";
import { llmRouter } from "../llm/router.js";
import { cleanResponse } from "../utils/cleanResponse.js";
import env from "../config/env.js";
import { createCacheService, createInMemoryLRUStore } from "../cache/cache.service.js";
import { addLineNumbers, chunkCode, normalizeCode } from "../utils/codeProcessor.js";
import { mergeFindings } from "../utils/mergeFindings.js";
import logger from "../utils/logger.js";

const analysisCache = createCacheService({
    store: createInMemoryLRUStore({
        maxEntries: env.cacheMaxEntries,
        defaultTtlMs: env.cacheTtlMs,
    }),
    defaultTtlMs: env.cacheTtlMs,
});

export async function runCodeReview({ language, code, mode, requestId }) {
    const processedCode = normalizeCode(code);
    const cacheLookup = analysisCache.getByAnalysisInput({
        language,
        code: processedCode,
    });

    if (cacheLookup.value) {
        logger.info("code_review_cache_hit", {
            requestId,
            language,
            codeLength: code.length,
        });

        return {
            ...cacheLookup.value,
            meta: {
                cached: true,
                provider: cacheLookup.value.meta?.provider || "unknown",
                latency_ms: 0,
            },
        };
    }

    logger.info("code_review_cache_miss", {
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
                line: finding.line + lineOffset,
            })),
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

    analysisCache.setByAnalysisInput(
        { language, code: processedCode },
        response,
        env.cacheTtlMs,
    );

    return response;
}
