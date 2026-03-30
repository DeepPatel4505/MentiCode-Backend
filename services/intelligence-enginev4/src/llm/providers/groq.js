export function createGroqProvider({ apiKey, model = "mixtral-8x7b-32768" } = {}) {
    if (!apiKey) {
        throw new Error("Groq provider requires GROQ_API_KEY environment variable.");
    }

    return {
        name: "groq",
        async generate({ language, code, mode, prompt, signal }) {
            if (signal?.aborted) {
                throw new Error("Request aborted");
            }

            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            {
                                role: "user",
                                content: prompt,
                            },
                        ],
                        temperature: 0.7,
                        max_tokens: 2048,
                        response_format: { type: "json_object" },
                    }),
                    signal,
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(
                        `Groq API error: ${response.status} - ${error.error?.message || response.statusText}`,
                    );
                }

                const data = await response.json();
                const textContent = data.choices?.[0]?.message?.content;

                if (!textContent) {
                    throw new Error("Groq returned no content");
                }

                return textContent;
            } catch (error) {
                if (error.name === "AbortError") {
                    throw error;
                }
                throw new Error(`Groq provider failed: ${error.message}`);
            }
        },
    };
}
