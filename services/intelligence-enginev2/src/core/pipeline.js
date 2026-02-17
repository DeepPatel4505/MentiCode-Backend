import { safeRun } from "../utils/retry.js";
import { numberLines } from "../utils/code-preproccess.js";
import { buildDetectPrompt } from "../prompts/detect.js";
import { buildValidatePrompt } from "../prompts/validate.js";
import { buildExplainPrompt } from "../prompts/explain.js";
import { DetectOutputSchema } from "./schema/detect.schema.js";
import { ValidateOutputSchema } from "./schema/validate.schema.js";
import { ExplainOutputSchema } from "./schema/explain.schema.js";
import { performance } from "node:perf_hooks";

export async function analyze(code) {
    const analysisStart = performance.now();

    const numbered = numberLines(code);

    // ---------------- DETECT ----------------
    const detectStart = performance.now();

    const detection = await safeRun(
        buildDetectPrompt(numbered),
        DetectOutputSchema,
    );

    const detectEnd = performance.now();

    console.log("Detection Results:", detection);
    console.log(
        `Detect Stage Time: ${(detectEnd - detectStart).toFixed(2)} ms`,
    );

    // ---------------- VALIDATE ----------------
    const validateStart = performance.now();

    const validated = await safeRun(
        buildValidatePrompt(numbered, detection),
        ValidateOutputSchema,
    );

    const validateEnd = performance.now();

    console.log("Validation Results:", validated);
    console.log(
        `Validate Stage Time: ${(validateEnd - validateStart).toFixed(2)} ms`,
    );

    // ---------------- EXPLAIN ----------------
    const explainStart = performance.now();

    const final = await safeRun(
        buildExplainPrompt(numbered, validated),
        ExplainOutputSchema,
    );

    const explainEnd = performance.now();

    console.log("Explanation Results:", final);
    console.log(
        `Explain Stage Time: ${(explainEnd - explainStart).toFixed(2)} ms`,
    );

    // ---------------- TOTAL ----------------
    const analysisEnd = performance.now();

    console.log(
        `Total Analysis Time: ${(analysisEnd - analysisStart).toFixed(2)} ms`,
    );

    return final;
}
