import { runModel } from "../core/model-client.js";
import config from "../config.js";
import logger from "./logger.js";

/**
 * Run a prompt through the LLM with automatic retries and schema validation.
 *
 * @param {string}  prompt — full prompt to send
 * @param {import("zod").ZodType} schema — Zod schema to validate the parsed output
 * @returns {Promise<object>} validated output or `{ findings: [] }` on failure
 */
export async function safeRun(prompt, schema) {
    for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
        try {
            const raw = await runModel(prompt);
            logger.debug(`Attempt ${attempt}/${config.MAX_RETRIES} — raw model output received`);

            const parsed = JSON.parse(raw);
            return schema.parse(parsed);
        } catch (err) {
            logger.warn(
                `Attempt ${attempt}/${config.MAX_RETRIES} failed`,
                { error: err.message },
            );
        }
    }

    logger.error("All retry attempts exhausted — returning empty findings");
    return { findings: [] };
}
