import config from "../config/config.js";
import { myLLMClient } from "../utils/myLLMClient.js";
import prompt from "../utils/prompt.js";
import cleanResponse from "../utils/cleanResponse.js";

export const reviewCode = async ({ language, code }) => {
    const llmRequest = {
        model: config.llm.model,
        prompt: prompt({ language, code }),
        temperature: 0,
        timeoutMs: config.llm.timeoutMs,
    };

    const llmResponse = await myLLMClient(llmRequest);
    return cleanResponse(llmResponse);
};

