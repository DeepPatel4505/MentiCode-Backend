/**
 * callGraphBuilder.js
 *
 * Lightweight call-graph construction via string scanning.
 *
 * For each chunk, we check which other chunk names appear in its body text.
 * This avoids full symbol resolution while still giving useful cross-chunk context.
 *
 * @param {object[]} chunks - array of { name, code } objects
 * @returns {Object.<string, string[]>} map of chunkName → [calledChunkNames]
 */
export function buildCallGraph(chunks) {
    // Build a set of all known chunk "leaf" names (last segment after dot)
    // so "UserService.getUser" matches if "getUser" appears in another chunk's body.
    const nameSet = new Set(chunks.map((c) => c.name));

    const graph = {};

    for (const chunk of chunks) {
        graph[chunk.name] = [];

        for (const otherName of nameSet) {
            if (otherName === chunk.name) continue;

            // Match on the leaf name (most specific identifier)
            const leafName = otherName.split(".").pop();

            // Use word-boundary check to avoid partial matches (e.g. "get" in "getUser")
            if (leafName && leafName.length > 2) {
                const pattern = new RegExp(`\\b${escapeRegex(leafName)}\\b`);
                if (pattern.test(chunk.code)) {
                    graph[chunk.name].push(otherName);
                }
            }
        }
    }

    return graph;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
