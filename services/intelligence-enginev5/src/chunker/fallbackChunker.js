const CHUNK_SIZE = 80;   // lines per chunk
const OVERLAP = 10;      // overlap lines between adjacent chunks

/**
 * Split source into overlapping line-based chunks.
 * Used as fallback when AST parsing is unavailable for a language.
 *
 * @param {string} source
 * @returns {object[]} array of chunk objects
 */
export function fallbackChunk(source) {
    const lines = source.split(/\r?\n/);
    const chunks = [];

    if (lines.length === 0) return [];

    // Single chunk if code fits within one window
    if (lines.length <= CHUNK_SIZE) {
        return [
            {
                chunkType: "block",
                name: "module",
                startLine: 1,
                endLine: lines.length,
                code: source,
            },
        ];
    }

    let start = 0;
    let chunkIndex = 0;

    while (start < lines.length) {
        const end = Math.min(start + CHUNK_SIZE, lines.length);
        const chunkLines = lines.slice(start, end);

        chunks.push({
            chunkType: "block",
            name: `block_${chunkIndex + 1}`,
            startLine: start + 1,      // 1-indexed
            endLine: end,
            code: chunkLines.join("\n"),
        });

        chunkIndex++;

        if (end >= lines.length) break;
        start = end - OVERLAP; // slide window with overlap
    }

    return chunks;
}
