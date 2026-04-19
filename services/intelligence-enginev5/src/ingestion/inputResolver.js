import fs from "fs/promises";
import path from "path";
import { detectLanguageFromPath, detectLanguageFromName } from "./languageMap.js";

const MAX_FILE_BYTES = 500_000; // 500 KB hard limit

/**
 * Resolve the input to a canonical { source, language, langConfig, filename } object.
 *
 * Accepts either:
 *   - { filePath }               — reads file from disk, auto-detects language
 *   - { code, language }         — uses provided raw code + explicit language name
 *
 * @param {{ filePath?: string, code?: string, language?: string }} input
 * @returns {Promise<{ source: string, language: string, langConfig: object|null, filename: string|null }>}
 */
export async function resolveInput({ filePath, code, language }) {
    // ── Case 1: file path provided ─────────────────────────────────────────────
    if (filePath) {
        let stat;
        try {
            stat = await fs.stat(filePath);
        } catch {
            throw new Error(`File not found or inaccessible: ${filePath}`);
        }

        if (stat.size > MAX_FILE_BYTES) {
            throw new Error(
                `File too large: ${stat.size} bytes. Maximum allowed is ${MAX_FILE_BYTES} bytes (500 KB).`,
            );
        }

        const source = await fs.readFile(filePath, "utf8");
        const langConfig = detectLanguageFromPath(filePath);
        const ext = path.extname(filePath).slice(1).toLowerCase();

        return {
            source,
            language: langConfig?.lang ?? language ?? ext ?? "unknown",
            langConfig: langConfig ?? null,
            filename: path.basename(filePath),
        };
    }

    // ── Case 2: raw code + explicit language ───────────────────────────────────
    if (code && language) {
        const langConfig = detectLanguageFromName(language);
        return {
            source: code,
            language: langConfig?.lang ?? language,
            langConfig: langConfig ?? null,
            filename: null,
        };
    }

    throw new Error(
        "Invalid input: provide either 'filePath' to read from disk, or both 'code' and 'language' for inline analysis.",
    );
}
