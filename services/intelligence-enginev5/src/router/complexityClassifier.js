import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const webTreeSitter = require("web-tree-sitter");
const Parser = webTreeSitter.Parser || webTreeSitter;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WASM_DIR = path.resolve(__dirname, "../../../node_modules/tree-sitter-wasms/out");

// ─── Complexity node sets ─────────────────────────────────────────────────────

const LOOP_TYPES = new Set([
    "for_statement", "while_statement", "do_statement",
    "for_in_statement", "for_of_statement",
]);

const CONDITION_TYPES = new Set([
    "if_statement", "switch_statement", "ternary_expression",
    "conditional_expression", "match_statement",
]);

/**
 * Walk an AST node recursively, accumulating complexity metrics.
 * @param {object} node
 * @param {number} depth
 * @param {object} metrics
 */
function walk(node, depth, metrics) {
    if (LOOP_TYPES.has(node.type)) metrics.loops++;
    if (CONDITION_TYPES.has(node.type)) metrics.conditions++;
    if (depth > metrics.maxDepth) metrics.maxDepth = depth;

    const nextDepth =
        node.type === "block" || node.type === "statement_block" ? depth + 1 : depth;

    for (let i = 0; i < node.childCount; i++) {
        walk(node.child(i), nextDepth, metrics);
    }
}

// ─── Parser singleton (reuse from ast chunker if possible) ────────────────────

let sharedParser = null;
const langCache = new Map();

async function initParser() {
    if (!sharedParser) {
        await Parser.init();
        sharedParser = new Parser();
    }
    return sharedParser;
}

async function getLang(wasmName) {
    if (langCache.has(wasmName)) return langCache.get(wasmName);
    const wasmPath = path.join(WASM_DIR, `${wasmName}.wasm`);
    if (!fs.existsSync(wasmPath)) return null;
    try {
        const lang = await Parser.Language.load(wasmPath);
        langCache.set(wasmName, lang);
        return lang;
    } catch {
        return null;
    }
}

/**
 * Classify the complexity of a code chunk.
 *
 * Uses AST-based metrics when possible; falls back to regex heuristics
 * when the grammar WASM is unavailable.
 *
 * @param {string} code - chunk source code
 * @param {object} [langConfig] - { wasm } — optional, speeds up AST parse
 * @returns {Promise<"high"|"medium"|"low">}
 */
export async function classifyComplexity(code, langConfig = null) {
    const metrics = { loops: 0, conditions: 0, maxDepth: 0 };

    if (langConfig?.wasm) {
        try {
            const parser = await initParser();
            const lang = await getLang(langConfig.wasm);
            if (lang) {
                parser.setLanguage(lang);
                const tree = parser.parse(code);
                walk(tree.rootNode, 0, metrics);
                const score = metrics.loops * 2 + metrics.conditions + metrics.maxDepth * 1.5;
                return score >= 8 ? "high" : score >= 3 ? "medium" : "low";
            }
        } catch {
            /* fall through to regex */
        }
    }

    // Regex fallback — fast but less accurate
    const loopMatches = (code.match(/\b(for|while|do)\b/g) ?? []).length;
    const condMatches = (code.match(/\b(if|switch|case|\?)\b/g) ?? []).length;
    const score = loopMatches * 2 + condMatches;
    return score >= 8 ? "high" : score >= 3 ? "medium" : "low";
}
