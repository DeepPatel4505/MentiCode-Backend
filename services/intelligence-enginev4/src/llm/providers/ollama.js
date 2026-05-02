import { Ollama } from "ollama";

export function createOllamaProvider({
    model = process.env.OLLAMA_MODEL || "mistral",
    apiKey = process.env.OLLAMA_API_KEY,
} = {}) {
    if (!apiKey) {
        throw new Error("OLLAMA_API_KEY is required");
    }

    const client = new Ollama({
        host: "https://ollama.com",
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });

    return {
        name: "ollama",

        async generate({ language, code, mode, prompt, signal }) {
            if (signal?.aborted) {
                throw new Error("Request aborted");
            }

            try {
                const res = await client.chat({
                    model,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    stream: false, // IMPORTANT: disable streaming for clean return
                });

                if (!res?.message?.content) {
                    throw new Error("Empty response from Ollama");
                }

                return res.message.content;
            } catch (error) {
                if (error.name === "AbortError") throw error;

                throw new Error(`Ollama provider failed: ${error.message}`);
            }
        },
    };
}
