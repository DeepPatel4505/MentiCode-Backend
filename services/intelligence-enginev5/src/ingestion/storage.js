import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = path.resolve(__dirname, "../../storage/sessions");

/**
 * Persists inline code to the server's local storage.
 * @param {string} sessionId
 * @param {string} code 
 * @param {string} language 
 * @returns {Promise<string>} The absolute path to the saved file
 */
export async function persistSessionFile(sessionId, code, language) {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    let ext = "source";
    if (language) {
        const norm = language.toLowerCase();
        if (norm === "javascript") ext = "js";
        else if (norm === "typescript") ext = "ts";
        else if (norm === "python") ext = "py";
        else if (norm === "cpp") ext = "cpp";
        else if (norm === "java") ext = "java";
        else if (norm === "go") ext = "go";
        else if (norm === "c") ext = "c";
        else ext = norm;
    }
    
    const filename = `${sessionId}.${ext}`;
    const filePath = path.join(STORAGE_DIR, filename);
    
    await fs.writeFile(filePath, code, "utf8");
    return filePath;
}
