import { getParser, getLanguage } from "./parser.js";
import logger from "../utils/logger.js";

const LOOPS = new Set(["for_statement", "while_statement", "do_statement", "for_in_statement"]);
const CONDITIONS = new Set(["if_statement", "switch_statement", "ternary_expression", "match_statement"]);
const FUNCTION_TYPES = new Set([
    "function_declaration", "method_definition", "arrow_function", 
    "function_definition", "class_definition"
]);

function walkAST(node, depth, metrics) {
    if (LOOPS.has(node.type)) metrics.loops++;
    if (CONDITIONS.has(node.type)) metrics.conditions++;
    
    if (depth > metrics.maxDepth) {
        metrics.maxDepth = depth;
    }

    let isFunc = FUNCTION_TYPES.has(node.type);
    
    let nextDepth = depth;
    // rough block increment
    if (node.type === "block" || node.type === "statement_block") {
        nextDepth = depth + 1;
    }

    // Collect functions
    if (isFunc) {
        metrics.functions.push({
            type: node.type,
            startLine: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            // substring body:
            code: node.text
        });
    }

    for (let i = 0; i < node.childCount; i++) {
        walkAST(node.child(i), nextDepth, metrics);
    }
}

export async function parseAndExtractAST(code, languageName) {
    try {
        const parser = await getParser();
        const Language = await getLanguage(languageName);
        
        if (!Language) {
            logger.warn(`[AST] Unsupported or missing language: ${languageName}. Falling back.`);
            return null;
        }

        parser.setLanguage(Language);
        const tree = parser.parse(code);

        const metrics = {
            loops: 0,
            conditions: 0,
            maxDepth: 0,
            functions: [] 
        };

        walkAST(tree.rootNode, 0, metrics);

        const complexityScore = (metrics.loops * 2) + metrics.conditions + (metrics.maxDepth * 1.5);

        // If no functions found, wrap entire code as a single chunk
        if (metrics.functions.length === 0) {
            metrics.functions.push({
                type: "global_script",
                startLine: 1,
                endLine: code.split(/\r?\n/).length,
                code: code
            });
        }

        return {
            isAst: true,
            complexityScore: parseFloat(complexityScore.toFixed(2)),
            metrics: {
                loops: metrics.loops,
                conditions: metrics.conditions,
                maxDepth: metrics.maxDepth
            },
            functions: metrics.functions
        };

    } catch (err) {
        logger.error(`[AST] Failed parsing code for ${languageName}: ${err.message}`);
        return null; // fallback
    }
}
