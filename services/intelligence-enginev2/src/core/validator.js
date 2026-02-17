import { DetectOutputSchema } from "./schema/index.js";

export function validateModelOutput(rawOutput, options) {
    const { totalLines, maxFindings = 8, minConfidence = 0.6 } = options;

    let parsed;

    // 1️⃣ Safe JSON parse
    try {
        parsed = JSON.parse(rawOutput);
    } catch {
        return { findings: [] };
    }

    // 2️⃣ Schema validation (Zod)
    const result = DetectOutputSchema.safeParse(parsed);
    if (!result.success) {
        return { findings: [] };
    }

    let findings = result.data.findings;

    // 3️⃣ Remove invalid line ranges
    findings = findings.filter((f) => {
        const [start, end] = f.line_range;
        return start >= 1 && end <= totalLines && start <= end;
    });

    // 4️⃣ Remove low confidence
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

    return { findings };
}
