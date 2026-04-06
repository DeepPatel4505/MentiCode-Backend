export function createOllamaProvider({ baseUrl = "http://localhost:11434", model = "mistral" } = {}) {
    return {
        name: "ollama",
        async generate({ language, code, mode, prompt, signal }) {
            if (signal?.aborted) {
                throw new Error("Request aborted");
            }

            try {
                const response = await fetch(`${baseUrl}/api/generate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model,
                        prompt,
                        stream: false,
                        format: "json",
                    }),
                    signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Ollama API error: ${response.status} - ${response.statusText}`,
                    );
                }

                const data = await response.json();
                const textContent = data.response;

                if (!textContent) {
                    throw new Error("Ollama returned no content");
                }

                return textContent;
            } catch (error) {
                if (error.name === "AbortError") {
                    throw error;
                }
                throw new Error(`Ollama provider failed: ${error.message}`);
            }
        },
    };
}
