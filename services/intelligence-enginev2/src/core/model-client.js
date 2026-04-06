import config from "../config.js";
import logger from "../utils/logger.js";

/**
 * Send a prompt to the Ollama LLM and return the raw text response.
 *
 * @param {string} prompt — the full prompt string
 * @returns {Promise<string>} raw LLM response text
 * @throws {Error} on network failure, timeout, or non-OK HTTP status
 */
export async function runModel(prompt) {
    logger.debug("Sending prompt to model", {
        model: config.OLLAMA_MODEL,
        endpoint: config.OLLAMA_URL,
    });

    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        config.MODEL_TIMEOUT_MS,
    );

    try {
        const response = await fetch(config.OLLAMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                model: config.OLLAMA_MODEL,
                prompt,
                temperature: config.MODEL_TEMPERATURE,
                top_p: config.MODEL_TOP_P,
                top_k: config.MODEL_TOP_K,
                stream: false,
                num_predict: config.MODEL_MAX_TOKENS,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Ollama returned HTTP ${response.status}: ${response.statusText}`,
            );
        }

        const data = await response.json();
        return data.response;
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error(
                `Ollama request timed out after ${config.MODEL_TIMEOUT_MS} ms`,
            );
        }
        throw new Error(`Ollama request failed: ${err.message}`);
    } finally {
        clearTimeout(timeout);
    }
}
