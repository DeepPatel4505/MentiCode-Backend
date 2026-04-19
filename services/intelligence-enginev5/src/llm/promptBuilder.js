/**
 * promptBuilder.js
 *
 * Builds stateful analysis prompts with rich context injection:
 *   - Prior findings  → LLM avoids re-reporting already-known issues
 *   - WONTFIX list    → LLM never re-reports dismissed issues
 *   - Dep findings    → cross-chunk awareness of upstream bugs
 *
 * Also builds a cheap YES/NO fix-verification prompt for fixVerifier.
 */

const LANG_HINTS = {
    javascript: "Focus on Node.js/browser JS pitfalls: async/await misuse, prototype traps, loose equality.",
    typescript: "Pay attention to unsafe `any`, type assertion abuse, and nullability gaps.",
    python: "Focus on mutable defaults, exception swallowing, and common CPython runtime traps.",
    java: "Watch for null dereferences, unchecked casts, and resource leaks.",
    go: "Check unhandled errors, goroutine leaks, nil pointer dereferences, and defer order.",
    cpp: "Focus on memory management, undefined behaviour, buffer overflows, and RAII violations.",
    c: "Focus on buffer overflows, use-after-free, uninitialized memory, and integer overflow.",
};

/**
 * Build the main analysis prompt for a single chunk.
 *
 * @param {object} params
 * @param {object} params.chunk           - { name, startLine, endLine, code, language? }
 * @param {object[]} params.priorFindings - OPEN/ACKNOWLEDGED findings from previous analysis
 * @param {object[]} params.wontfixFindings - WONTFIX findings (never report again)
 * @param {object[]} params.depFindings   - open findings in functions this chunk calls
 * @returns {string} full prompt text
 */
export function buildAnalysisPrompt({ chunk, priorFindings, wontfixFindings, depFindings }) {
    const langHint = LANG_HINTS[chunk.language] ?? "";

    // ── Prior findings block ───────────────────────────────────────────────────
    const priorBlock =
        priorFindings.length > 0
            ? `
PREVIOUSLY REPORTED FINDINGS FOR THIS FUNCTION (from last analysis):
${JSON.stringify(
    priorFindings.map((f) => ({ id: f.id, line: f.line, issue: f.issue })),
    null,
    2,
)}

RULES FOR PRIOR FINDINGS:
- If a prior finding is NO LONGER present in the code → do NOT include it (it was fixed).
- If it IS still present → include it with the exact same "id" field so state is preserved.
`
            : "";

    // ── WONTFIX block ─────────────────────────────────────────────────────────
    const wontfixBlock =
        wontfixFindings.length > 0
            ? `
USER HAS PERMANENTLY DISMISSED THESE — NEVER REPORT THEM AGAIN:
${JSON.stringify(wontfixFindings.map((f) => f.issue))}
`
            : "";

    // ── Dependency findings block ─────────────────────────────────────────────
    const depBlock =
        depFindings.length > 0
            ? `
KNOWN OPEN ISSUES IN FUNCTIONS THIS CODE CALLS (upstream context):
${JSON.stringify(
    depFindings.map((f) => ({ function: f.chunkName, issue: f.issue })),
    null,
    2,
)}
Consider whether these upstream bugs affect the correctness of the code below.
`
            : "";

    return `You are a senior software engineer conducting a focused, high-signal code review.
${langHint ? `Language note: ${langHint}` : ""}
${priorBlock}${wontfixBlock}${depBlock}
STRICT RULES:
- Review ONLY the function shown below. Do not invent issues outside its bounds.
- Do NOT report style, formatting, variable naming, or missing comments.
- Do NOT report hypothetical issues that cannot happen with realistic inputs.
- Focus on: logic bugs, null/undefined dereferences, edge cases, security flaws (injection, auth bypass), resource leaks, performance anti-patterns.
- Every finding must point to a REAL line number within ${chunk.startLine}–${chunk.endLine}.

FUNCTION TO REVIEW: ${chunk.name} (lines ${chunk.startLine}–${chunk.endLine})
\`\`\`
${chunk.code}
\`\`\`

Return ONLY valid JSON — no prose, no markdown fences, no trailing commas:
{"findings":[{"id":"<deterministic_id: sha8 of chunkName+line+issue>","line":<int>,"issue":"<concise title>","why":"<why this causes a real problem>","hint":"<concrete fix suggestion>","severity":"HIGH|MEDIUM|LOW"}]}
If no real issues exist, return: {"findings":[]}`;
}

/**
 * Build a cheap YES/NO verification prompt.
 * Used by fixVerifier to confirm whether a reported issue still exists after a code change.
 *
 * @param {string} issue - the finding's issue description
 * @param {string} chunkCode - current code of the chunk
 * @returns {string}
 */
export function buildVerifyPrompt(issue, chunkCode) {
    return `Does the following issue still exist in the code below?
Answer only YES or NO — nothing else.

Issue: "${issue}"

Code:
${chunkCode}`;
}
