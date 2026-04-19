/**
 * languageMap.js
 *
 * Maps file extensions to:
 *   - `wasm`: the tree-sitter-wasms filename (used by the web-tree-sitter parser)
 *   - `nodeTypes`: AST node type names to extract as top-level chunks
 *   - `lang`: canonical language name
 */

export const LANGUAGE_MAP = {
    ".js": {
        lang: "javascript",
        wasm: "tree-sitter-javascript",
        nodeTypes: ["function_declaration", "arrow_function", "class_declaration"],
    },
    ".mjs": {
        lang: "javascript",
        wasm: "tree-sitter-javascript",
        nodeTypes: ["function_declaration", "arrow_function", "class_declaration"],
    },
    ".cjs": {
        lang: "javascript",
        wasm: "tree-sitter-javascript",
        nodeTypes: ["function_declaration", "arrow_function", "class_declaration"],
    },
    ".ts": {
        lang: "typescript",
        wasm: "tree-sitter-typescript",
        nodeTypes: ["function_declaration", "arrow_function", "class_declaration"],
    },
    ".tsx": {
        lang: "typescript",
        wasm: "tree-sitter-typescript",
        nodeTypes: ["function_declaration", "arrow_function", "class_declaration"],
    },
    ".py": {
        lang: "python",
        wasm: "tree-sitter-python",
        nodeTypes: ["function_definition", "class_definition"],
    },
    ".java": {
        lang: "java",
        wasm: "tree-sitter-java",
        nodeTypes: ["method_declaration", "class_declaration"],
    },
    ".go": {
        lang: "go",
        wasm: "tree-sitter-go",
        nodeTypes: ["function_declaration", "method_declaration"],
    },
    ".cpp": {
        lang: "cpp",
        wasm: "tree-sitter-cpp",
        nodeTypes: ["function_definition", "class_specifier"],
    },
    ".cc": {
        lang: "cpp",
        wasm: "tree-sitter-cpp",
        nodeTypes: ["function_definition", "class_specifier"],
    },
    ".c": {
        lang: "c",
        wasm: "tree-sitter-c",
        nodeTypes: ["function_definition"],
    },
};

// Map lang name → extension (for raw code + language hint)
const LANG_NAME_MAP = {};
for (const [ext, config] of Object.entries(LANGUAGE_MAP)) {
    if (!LANG_NAME_MAP[config.lang]) {
        LANG_NAME_MAP[config.lang] = config;
    }
}

/**
 * Detect language config from a file path (by extension).
 * @param {string} filePath
 * @returns {{ lang, wasm, nodeTypes } | null}
 */
export function detectLanguageFromPath(filePath) {
    const lastDot = filePath.lastIndexOf(".");
    if (lastDot === -1) return null;
    const ext = filePath.slice(lastDot).toLowerCase();
    return LANGUAGE_MAP[ext] ?? null;
}

/**
 * Get language config from a language name string (e.g. "javascript", "py", "python").
 * @param {string} langName
 * @returns {{ lang, wasm, nodeTypes } | null}
 */
export function detectLanguageFromName(langName) {
    const normalized = String(langName || "").toLowerCase().trim();
    // Direct name match
    if (LANG_NAME_MAP[normalized]) return LANG_NAME_MAP[normalized];
    // Common aliases
    const aliases = {
        js: "javascript",
        ts: "typescript",
        py: "python",
        "c++": "cpp",
    };
    const resolved = aliases[normalized];
    return resolved ? LANG_NAME_MAP[resolved] ?? null : null;
}
