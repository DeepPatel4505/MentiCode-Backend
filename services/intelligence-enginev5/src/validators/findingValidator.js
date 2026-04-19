/**
 * findingValidator.js
 *
 * Post-LLM sanity checks before persisting findings to the database.
 *
 * Checks:
 *   1. Line number is within the chunk's declared line range
 *   2. At least one meaningful token from the finding's issue text
 *      appears in the chunk's source code (hallucination filter)
 */

// Minimum token length to avoid filtering on stop-words like "is", "the"
const MIN_TOKEN_LENGTH = 4;

/**
 * Extract meaningful tokens from a string (identifiers, keywords).
 * @param {string} text
 * @returns {string[]}
 */
function extractTokens(text) {
    return (text.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) ?? []).filter(
        (t) => t.length >= MIN_TOKEN_LENGTH,
    );
}

/**
 * Validate and filter findings against the actual source chunk.
 *
 * @param {object[]} findings - parsed finding objects from responseParser
 * @param {string[]} sourceLines - all source lines (1-indexed via sourceLines[line-1])
 * @param {number} chunkStartLine - 1-indexed start line of this chunk in the full file
 * @param {number} chunkEndLine - 1-indexed end line of this chunk
 * @param {string} chunkCode - raw source code of the chunk
 * @returns {object[]} filtered findings that pass validation
 */
export function validateFindings(findings, sourceLines, chunkStartLine, chunkEndLine, chunkCode) {
    if (!Array.isArray(findings)) return [];

    const valid = [];

    for (let f of findings) {
        // ── 1. Line range check ───────────────────────────────────────────────
        const line = Number(f.line);
        if (!Number.isInteger(line) || line < chunkStartLine || line > chunkEndLine) {
            // Clamp to chunk bounds rather than discard — LLM sometimes uses relative lines
            const clamped = Math.max(chunkStartLine, Math.min(chunkEndLine, line || chunkStartLine));
            f = { ...f, line: clamped };
        }

        // ── 2. Token overlap check ────────────────────────────────────────────
        const issueTokens = extractTokens(f.issue ?? "");
        const hasOverlap = issueTokens.some((token) => chunkCode.includes(token));

        if (!hasOverlap && issueTokens.length > 0) {
            // Finding mentions identifiers that don't exist in this chunk — likely hallucination
            continue;
        }

        valid.push(f);
    }

    return valid;
}
