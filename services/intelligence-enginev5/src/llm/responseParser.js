/**
 * responseParser.js
 *
 * Parses and validates the LLM JSON response for analysis findings.
 * Handles:
 *   - Markdown code fence stripping
 *   - Brace-scanning extraction when JSON is embedded in prose
 *   - Shape validation (findings array, required fields)
 *   - Field normalisation (severity casing, line clamping)
 */

const ALLOWED_SEVERITIES = new Set(["HIGH", "MEDIUM", "LOW"]);

// ─── JSON extraction helpers ───────────────────────────────────────────────────

function stripMarkdownFences(text) {
    const raw = String(text ?? "").trim();
    const match = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return match ? match[1].trim() : raw;
}

function extractFirstJSON(text) {
    const cleaned = stripMarkdownFences(text);

    // Fast path: direct parse
    try {
        return JSON.parse(cleaned);
    } catch {
        /* fall through to brace scan */
    }

    const start = cleaned.indexOf("{");
    if (start === -1) throw new Error("No JSON object found in LLM output.");

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];

        if (inString) {
            if (escaped) { escaped = false; continue; }
            if (ch === "\\") { escaped = true; continue; }
            if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') { inString = true; continue; }
        if (ch === "{") { depth++; continue; }
        if (ch === "}") {
            depth--;
            if (depth === 0) {
                return JSON.parse(cleaned.slice(start, i + 1));
            }
        }
    }

    throw new Error("Unterminated JSON object in LLM output.");
}

// ─── Field normalisers ─────────────────────────────────────────────────────────

function normaliseSeverity(raw) {
    const s = String(raw ?? "").toUpperCase().trim();
    if (ALLOWED_SEVERITIES.has(s)) return s;
    // Map IE4-style names gracefully
    if (s === "CRITICAL" || s === "MAJOR") return "HIGH";
    if (s === "MINOR") return "LOW";
    return "MEDIUM"; // safe default
}

function normaliseId(raw, chunk, finding) {
    // If the LLM supplied a meaningful id, keep it; otherwise generate one
    const supplied = String(raw ?? "").trim();
    if (supplied.length >= 6 && supplied.length <= 32) return supplied;
    // Fallback deterministic id
    const input = `${chunk?.name ?? ""}:${finding.line}:${finding.issue ?? ""}`;
    return Buffer.from(input).toString("base64").slice(0, 12);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse raw LLM text into a validated findings array.
 *
 * @param {string} rawText - LLM response text
 * @param {object} [chunk] - chunk context for fallback id generation
 * @returns {object[]} validated finding objects
 */
export function parseFindings(rawText, chunk = null) {
    let parsed;
    try {
        parsed = extractFirstJSON(rawText);
    } catch (err) {
        // LLM returned garbage — return empty rather than crash the analysis
        console.warn(`[responseParser] Failed to parse LLM output: ${err.message}`);
        return [];
    }

    if (!Array.isArray(parsed?.findings)) {
        return [];
    }

    const results = [];

    for (const raw of parsed.findings) {
        if (!raw || typeof raw !== "object") continue;

        const line = Number.isInteger(Number(raw.line)) ? Math.max(1, Number(raw.line)) : 1;
        const issue = String(raw.issue ?? "").trim();
        const why = String(raw.why ?? "").trim();
        const hint = String(raw.hint ?? "").trim();

        // Skip obvious junk
        if (issue.length < 5) continue;

        results.push({
            id: normaliseId(raw.id, chunk, { line, issue }),
            line,
            issue,
            why,
            hint,
            severity: normaliseSeverity(raw.severity),
        });
    }

    return results;
}
