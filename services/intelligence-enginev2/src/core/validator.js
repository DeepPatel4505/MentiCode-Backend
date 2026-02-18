import { DetectOutputSchema } from "./schema/detect.schema.js";
import config from "../config.js";
import logger from "../utils/logger.js";

/**
 * Validate and sanitize raw LLM JSON output.
 *
 * Steps:
 *  1. Safe JSON parse
 *  2. Zod schema validation
 *  3. Line range enforcement
 *  4. Confidence threshold filtering
 *  5. Duplicate removal
 *  6. Result capping
 *
 * @param {string} rawOutput — raw string from the LLM
 * @param {object} options
 * @param {number} options.totalLines — total lines in the analysed code
 * @param {number} [options.maxFindings]
 * @param {number} [options.minConfidence]
 * @returns {{ findings: Array }}
 */
export function validateModelOutput(rawOutput, options) {
    const {
        totalLines,
        maxFindings = config.MAX_FINDINGS,
        minConfidence = config.MIN_CONFIDENCE,
    } = options;

    // 1️⃣ Safe JSON parse
    let parsed;
    try {
        parsed = JSON.parse(rawOutput);
    } catch {
        logger.warn("Validator — failed to parse JSON from model output");
        return { findings: [] };
    }

    // 2️⃣ Schema validation (Zod)
    const result = DetectOutputSchema.safeParse(parsed);
    if (!result.success) {
        logger.warn("Validator — Zod schema validation failed", {
            issues: result.error?.issues?.length,
        });
        return { findings: [] };
    }

    let findings = result.data.findings;

    // 3️⃣ Remove invalid line ranges
    findings = findings.filter((f) => {
        const [start, end] = f.line_range;
        return start >= 1 && end <= totalLines && start <= end;
    });

    // 4️⃣ Remove low confidence findings
    findings = findings.filter((f) => {
        if (f.confidence === undefined) return true;
        return f.confidence >= minConfidence;
    });

    // 5️⃣ Remove duplicates
    const seen = new Set();
    findings = findings.filter((f) => {
        const key = `${f.category}-${f.line_range.join("-")}-${f.issue}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // 6️⃣ Cap number of findings
    if (findings.length > maxFindings) {
        findings = findings.slice(0, maxFindings);
    }

    logger.debug("Validator — output sanitized", { count: findings.length });
    return { findings };
}
