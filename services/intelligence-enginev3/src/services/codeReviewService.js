import config from "../config/config.js";
import { myLLMClient } from "../utils/myLLMClient.js";
import prompt from "../utils/prompt.js";
import cleanResponse from "../utils/cleanResponse.js";
import logger from "../utils/logger.js";

export const reviewCode = async ({ language, code }) => {
    const elapsed = logger.startTimer();

    const llmRequest = {
        model: config.llm.model,
        prompt: prompt({ language, code }),
        temperature: 0,
        timeoutMs: config.llm.timeoutMs,
    };

    logger.info("llm_request_start", {
        model: config.llm.model,
        language,
        codeLength: code.length,
        timeoutMs: config.llm.timeoutMs,
    });

    const llmResponse = await myLLMClient(llmRequest);
    const result = cleanResponse(llmResponse);

    const { durationNs, durationMs, durationSec } = elapsed();

    logger.info("llm_request_complete", {
        model: config.llm.model,
        language,
        codeLength: code.length,
        responseLength: llmResponse.length,
        findingsCount: result.findings?.length ?? 0,
        riskLevel: result.summary?.risk_level ?? "unknown",
        durationNs,
        durationMs,
        durationSec,
    });

    return result;
};
