import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const webTreeSitter = require("web-tree-sitter");
const Parser = webTreeSitter.Parser || webTreeSitter;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WASM_DIR = path.resolve(__dirname, "../../../../node_modules/tree-sitter-wasms/out");

let parser = null;
const languageCache = new Map();

export async function getParser() {
    if (!parser) {
        await Parser.init(); 
        parser = new Parser();
    }
    return parser;
}

export async function getLanguage(langName) {
    let internalName = String(langName || "").toLowerCase();
    
    if (internalName === "js" || internalName === "javascript") internalName = "javascript";
    else if (internalName === "py" || internalName === "python") internalName = "python";
    else if (internalName === "cpp" || internalName === "c++") internalName = "cpp";
    else if (internalName === "ts" || internalName === "typescript") internalName = "typescript";
    else return null; // Unsupported for AST

    if (languageCache.has(internalName)) {
        return languageCache.get(internalName);
    }

    const wasmPath = path.join(WASM_DIR, `tree-sitter-${internalName}.wasm`);
    
    if (!fs.existsSync(wasmPath)) {
        console.warn(`[AST] WASM grammar not found at: ${wasmPath}`);
        return null;
    }

    try {
        const Lang = await Parser.Language.load(wasmPath);
        languageCache.set(internalName, Lang);
        return Lang;
    } catch (err) {
        console.error(`[AST] Failed to load ${internalName} language:`, err);
        return null;
    }
}
