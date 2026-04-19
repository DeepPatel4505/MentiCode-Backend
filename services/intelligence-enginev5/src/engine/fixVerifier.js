import { createOllamaProvider } from "../llm/providers/ollama.js";
import { buildVerifyPrompt } from "../llm/promptBuilder.js";
import env from "../config/env.js";

const ollamaProvider = createOllamaProvider({
    baseUrl: env.ollamaBaseUrl,
    model: env.ollamaModel,
});

/**
 * verifyFix — cheap YES/NO check to confirm whether a reported issue is fixed.
 *
 * Uses local Ollama for zero API cost. Returns true if the issue no longer exists.
 * Returns null if Ollama is unavailable (caller should default to trusting the user).
 *
 * @param {string} issue - the finding's issue description
 * @param {string} currentChunkCode - current source code of the chunk
 * @returns {Promise<boolean|null>} true = issue gone (fixed), false = still present, null = unavailable
 */
export async function verifyFix(issue, currentChunkCode) {
    const prompt = buildVerifyPrompt(issue, currentChunkCode);

    try {
        const response = await ollamaProvider.generate({ prompt, signal: null });
        const answer = String(response).trim().toUpperCase();

        if (answer.startsWith("NO")) return false;   // issue still present
        if (answer.startsWith("YES")) return true;   // issue is gone

        // Ambiguous answer — default to trusting the user's claim
        return null;
    } catch {
        return null; // Ollama unavailable — non-blocking
    }
}
