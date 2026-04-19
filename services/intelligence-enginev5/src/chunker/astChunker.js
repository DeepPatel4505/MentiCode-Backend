import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const webTreeSitter = require("web-tree-sitter");
const Parser = webTreeSitter.Parser || webTreeSitter;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point to the tree-sitter-wasms package in the IE5 node_modules
const WASM_DIR = path.resolve(__dirname, "../../../node_modules/tree-sitter-wasms/out");

let parserInstance = null;
const languageCache = new Map();

async function getParser() {
    if (!parserInstance) {
        await Parser.init();
        parserInstance = new Parser();
    }
    return parserInstance;
}

async function getLanguage(wasmName) {
    if (languageCache.has(wasmName)) {
        return languageCache.get(wasmName);
    }

    const wasmPath = path.join(WASM_DIR, `${wasmName}.wasm`);

    if (!fs.existsSync(wasmPath)) {
        return null; // Grammar WASM not available — fall back to line chunker
    }

    try {
        const lang = await Parser.Language.load(wasmPath);
        languageCache.set(wasmName, lang);
        return lang;
    } catch {
        return null;
    }
}

/**
 * Extract the best name for an AST node.
 * Tries field "name", then first named child whose type is "identifier".
 */
function extractName(node) {
    const nameNode =
        node.childForFieldName?.("name") ??
        node.children?.find((c) => c.type === "identifier" && c.isNamed);
    return nameNode?.text ?? "anonymous";
}

/**
 * Walk the AST and collect chunks for nodes matching langConfig.nodeTypes.
 *
 * @param {object} node - tree-sitter AST node
 * @param {string[]} targetTypes - node types to capture
 * @param {string} source - full source code string
 * @param {string} parentName - name of the enclosing scope
 * @param {object[]} results - accumulator
 */
function walkTree(node, targetTypes, source, parentName, results) {
    if (targetTypes.includes(node.type)) {
        const selfName = extractName(node);
        const fullName = parentName ? `${parentName}.${selfName}` : selfName;

        results.push({
            chunkType: node.type,
            name: fullName,
            startLine: node.startPosition.row + 1, // 1-indexed
            endLine: node.endPosition.row + 1,
            code: source.slice(node.startIndex, node.endIndex),
        });

        // Continue walking into children with updated scope name
        for (const child of node.children ?? []) {
            walkTree(child, targetTypes, source, fullName, results);
        }
    } else {
        for (const child of node.children ?? []) {
            walkTree(child, targetTypes, source, parentName, results);
        }
    }
}

/**
 * Parse source using web-tree-sitter and extract function/class chunks.
 *
 * @param {string} source - source code to parse
 * @param {{ wasm: string, nodeTypes: string[] }} langConfig - language configuration
 * @returns {Promise<object[]>} array of chunk objects, or null if parsing fails
 */
export async function chunkByAST(source, langConfig) {
    const parser = await getParser();
    const lang = await getLanguage(langConfig.wasm);

    if (!lang) {
        return null; // Signal to caller: fall through to line-based chunker
    }

    try {
        parser.setLanguage(lang);
        const tree = parser.parse(source);
        const results = [];

        walkTree(tree.rootNode, langConfig.nodeTypes, source, "", results);

        return results;
    } catch {
        return null;
    }
}
