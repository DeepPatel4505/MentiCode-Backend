const MIN_CHUNK_LINES = 150;
const MAX_CHUNK_LINES = 300;
const DEFAULT_CHUNK_LINES = 200;
const DEFAULT_OVERLAP_LINES = 20;

export function normalizeCode(code) {
    return String(code || "")
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/\s+/g, " "))
        .join("\n")
        .trim();
}

export function addLineNumbers(code) {
    return String(code || "")
        .split(/\r?\n/)
        .map((line, index) => `${index + 1}: ${line}`)
        .join("\n");
}

export function chunkCode(
    code,
    {
        chunkSize = DEFAULT_CHUNK_LINES,
        overlap = DEFAULT_OVERLAP_LINES,
    } = {},
) {
    const normalizedChunkSize = Math.max(
        MIN_CHUNK_LINES,
        Math.min(MAX_CHUNK_LINES, Number(chunkSize) || DEFAULT_CHUNK_LINES),
    );

    const normalizedOverlap = Math.max(
        0,
        Math.min(normalizedChunkSize - 1, Number(overlap) || DEFAULT_OVERLAP_LINES),
    );

    const lines = String(code || "").split(/\r?\n/);

    if (lines.length === 0) {
        return [];
    }

    if (lines.length <= MAX_CHUNK_LINES) {
        return [
            {
                index: 0,
                startLine: 1,
                endLine: lines.length,
                code: lines.join("\n"),
            },
        ];
    }

    const step = normalizedChunkSize - normalizedOverlap;
    const chunks = [];

    for (let start = 0; start < lines.length; start += step) {
        const endExclusive = Math.min(start + normalizedChunkSize, lines.length);
        const chunkLines = lines.slice(start, endExclusive);

        chunks.push({
            index: chunks.length,
            startLine: start + 1,
            endLine: endExclusive,
            code: chunkLines.join("\n"),
        });

        if (endExclusive >= lines.length) {
            break;
        }
    }

    return chunks;
}
