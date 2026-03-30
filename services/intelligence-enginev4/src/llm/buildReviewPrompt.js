const LANG_HINTS = {
    javascript: "Focus on Node.js and browser JavaScript pitfalls.",
    typescript: "Pay attention to typing gaps and unsafe any usage.",
    python: "Focus on readability, runtime edge cases, and common Python anti-patterns.",
    java: "Watch for null safety, exceptions, and object-oriented design issues.",
    go: "Check error handling, goroutine safety, and idiomatic Go practices.",
};

export function buildReviewPrompt({ language, code, mode, chunk }) {
    const normalizedLanguage = String(language || "").trim().toLowerCase();
    const languageHint =
        LANG_HINTS[normalizedLanguage] ||
        `Focus on correctness, security, and maintainability in ${language}.`;

    const modeHint =
        mode === "full"
            ? "Include concrete and directly actionable fixes in guided_fix."
            : "Provide guided, incremental fixes that help learning step-by-step.";

    const chunkHint =
        chunk && Number.isInteger(chunk.index)
            ? `Chunk ${chunk.index + 1}/${chunk.totalChunks} covering original lines ${chunk.startLine}-${chunk.endLine}.`
            : "Single-pass full code review.";

    const overlapHint =
        chunk && Number.isInteger(chunk.index)
            ? "This chunk may overlap adjacent chunks. Do not invent duplicate findings for repeated overlap lines."
            : "";

    return [
        "You are a strict, execution-first programming mentor reviewing code.",
        `Language: ${language}`,
        `Mode: ${mode}`,
        chunkHint,
        overlapHint,
        languageHint,
        modeHint,
        "Prioritize real runtime/logical bugs first, then reliability/performance/design issues.",
        "Do not report purely cosmetic style issues unless no meaningful technical issues exist.",
        "Target 3-6 findings for this chunk when real issues exist; avoid generic or repeated observations.",
        "Each finding must map to a specific line number present in the numbered code.",
        "If the same root cause appears across nearby lines, report it once at the most representative line.",
        "Return strict JSON with keys: summary and findings.",
        "summary must include risk_level (low|medium|high) and overall_quality (0-100).",
        "Each finding must include: line, category, severity (low|medium|high|critical), issue, why_it_matters, hint, guided_fix.",
        "line must be a positive integer from this chunk's numbered lines (the number before ':').",
        "category should be one of: bug, design, security, performance, maintainability, reliability, testing.",
        "issue must be specific and technical, not generic.",
        "Keep each field concise: issue <= 180 chars, why_it_matters <= 180 chars, hint <= 120 chars, guided_fix <= 180 chars.",
        "why_it_matters must describe concrete impact (failure mode, data risk, crash, incorrect output, or scalability hit).",
        "hint should be a short directional clue, not full code.",
        "guided_fix should be concise and implementable; avoid dumping full-file rewrites.",
        "Do not include markdown or prose outside JSON.",
        "Never include code fences.",
        "Output must be valid JSON object only.",
        "Code:",
        code,
    ].join("\n");
}
