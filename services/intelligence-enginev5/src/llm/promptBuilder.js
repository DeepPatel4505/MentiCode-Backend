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

    return `You are an expert code analyzer and security auditor. Your job is to find REAL bugs and security issues.

${langHint ? `Language hint: ${langHint}` : ""}
${priorBlock}${wontfixBlock}${depBlock}

SCOPE:
- Review ONLY the function shown below (lines ${chunk.startLine}–${chunk.endLine}).
- Report REAL bugs that will cause runtime errors, logic failures, or security vulnerabilities.
- Do NOT report style, formatting, naming conventions, or missing comments.

WHAT TO LOOK FOR (Common bugs):
1. Null/undefined dereferences (accessing properties on potentially null values)
2. Type mismatches or incorrect operators (= instead of ==, string * number, etc.)
3. Logic errors (unreachable code, missing returns, incorrect conditions)
4. Resource leaks (files/connections not closed, memory not freed)
5. Security vulnerabilities (SQL injection, command injection, prototype pollution, auth bypass)
6. Race conditions and async issues (missing await, out-of-order operations)
7. Infinite loops or missing loop counters
8. Missing error handling (unhandled exceptions, uncaught promises)
9. Incorrect array/object access (out of bounds, undefined indices)
10. Memory inefficiency (unbounded growth, large copies, circular references)

EXAMPLES OF ISSUES TO REPORT:
- "Accessing user.email without null check" → Line 5: HIGH severity
- "SQL injection vulnerability via string interpolation" → Line 12: HIGH severity
- "Unreachable code after return statement" → Line 8: LOW severity
- "Potential null pointer dereference" → Line 3: MEDIUM severity

TONE: Be pragmatic and realistic. Report issues that a code reviewer would catch.

FUNCTION TO REVIEW: ${chunk.name} (lines ${chunk.startLine}–${chunk.endLine})
\`\`\`
${chunk.code}
\`\`\`

Return ONLY valid JSON with no prose or markdown fences:
{"findings":[{"id":"<unique_short_id>","line":<line_number>,"issue":"<bug_title>","why":"<explain_the_problem>","hint":"<suggest_fix>","severity":"HIGH|MEDIUM|LOW"}]}

If you find bugs, report them. If you find NO real bugs in this code, return: {"findings":[]}`;
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
