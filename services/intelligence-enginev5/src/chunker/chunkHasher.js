import crypto from "crypto";

/**
 * Compute a short, stable SHA-256 hash of a code chunk.
 *
 * Normalisation rules (making the hash robust to irrelevant changes):
 *   - Strip trailing whitespace from every line
 *   - Trim leading/trailing blank lines from the whole block
 *
 * @param {string} code - raw chunk source
 * @returns {string} 16-character hex string (first 16 of SHA-256)
 */
export function hashChunk(code) {
    const normalised = code
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .join("\n")
        .trim();

    return crypto.createHash("sha256").update(normalised).digest("hex").slice(0, 16);
}
