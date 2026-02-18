import { safeRun } from "../utils/retry.js";
import { numberLines } from "../utils/code-preproccess.js";
import { buildDetectPrompt } from "../prompts/detect.js";
import { buildValidatePrompt } from "../prompts/validate.js";
import { buildExplainPrompt } from "../prompts/explain.js";
import { DetectOutputSchema } from "./schema/detect.schema.js";
import { ValidateOutputSchema } from "./schema/validate.schema.js";
import { ExplainOutputSchema } from "./schema/explain.schema.js";
import logger from "../utils/logger.js";

/**
 * Run the full Detect → Validate → Explain analysis pipeline.
 *
 * Each stage is individually timed with `process.hrtime.bigint()` for
 * nanosecond-precision duration logging (displayed in seconds).
 *
 * @param {string} code — raw source code to analyse
 * @returns {Promise<object>} enriched findings from the Explain stage
 */
export async function analyze(code) {
    const totalStart = logger.startTimer();

    const numbered = numberLines(code);

    // ──────────────── DETECT ────────────────
    const detectStart = logger.startTimer();

    const detection = await safeRun(
        buildDetectPrompt(numbered),
        DetectOutputSchema,
    );

    logger.logStageTime("Detect", detectStart);
    logger.debug("Detection results", { findingCount: detection?.findings?.length ?? 0 });

    // ──────────────── VALIDATE ──────────────
    const validateStart = logger.startTimer();

    const validated = await safeRun(
        buildValidatePrompt(numbered, detection),
        ValidateOutputSchema,
    );

    logger.logStageTime("Validate", validateStart);
    logger.debug("Validation results", { findingCount: validated?.findings?.length ?? 0 });

    // ──────────────── EXPLAIN ───────────────
    const explainStart = logger.startTimer();

    const final = await safeRun(
        buildExplainPrompt(numbered, validated),
        ExplainOutputSchema,
    );

    logger.logStageTime("Explain", explainStart);
    logger.debug("Explanation results", { findingCount: final?.findings?.length ?? 0 });

    // ──────────────── TOTAL ─────────────────
    const { elapsedSec } = logger.endTimer(totalStart);
    logger.info(`✅ Analysis complete`, { totalDuration: elapsedSec, findings: final?.findings?.length ?? 0 });

    return final;
}
