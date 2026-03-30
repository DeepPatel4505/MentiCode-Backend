export function createOpenAIProvider({ apiKey, model = "gpt-4o-mini" } = {}) {
    if (!apiKey) {
        throw new Error("OpenAI provider requires OPENAI_API_KEY environment variable.");
    }

    return {
        name: "openai",
        async generate({ language, code, mode, prompt, signal }) {
            if (signal?.aborted) {
                throw new Error("Request aborted");
            }

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                        `OpenAI API error: ${response.status} - ${error.error?.message || response.statusText}`,
                    );
                }

                const data = await response.json();
                const textContent = data.choices?.[0]?.message?.content;

                if (!textContent) {
                    throw new Error("OpenAI returned no content");
                }

                return textContent;
            } catch (error) {
                if (error.name === "AbortError") {
                    throw error;
                }
                throw new Error(`OpenAI provider failed: ${error.message}`);
            }
        },
    };
}
