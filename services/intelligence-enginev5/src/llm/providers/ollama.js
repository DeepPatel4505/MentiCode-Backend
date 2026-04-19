/**
 * ollama.js — Local Ollama provider for IE5
 *
 * Used for low-complexity chunks (zero API cost) and fix verification.
 * Defaults to qwen3:8b but any Ollama-served model works.
 */

export function createOllamaProvider({
    baseUrl = "http://localhost:11434",
    model = "qwen3:8b",
} = {}) {
    return {
        name: "ollama",

        async generate({ prompt, signal }) {
            if (signal?.aborted) throw new Error("Request aborted before Ollama call.");

            let response;
            try {
                response = await fetch(`${baseUrl}/api/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, prompt, stream: false }),
                    signal,
                });
            } catch (err) {
                throw new Error(`Ollama unreachable at ${baseUrl}: ${err.message}`);
            }

            if (!response.ok) {
                throw new Error(`Ollama error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.response) throw new Error("Ollama returned empty response.");
            return data.response;
        },
    };
}
