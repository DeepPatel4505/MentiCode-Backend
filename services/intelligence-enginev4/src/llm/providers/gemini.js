export function createGeminiProvider({ apiKey, model = "gemini-2.0-flash" } = {}) {
    if (!apiKey) {
        throw new Error("Gemini provider requires GEMINI_API_KEY environment variable.");
    }

    return {
        name: "gemini",
        async generate({ language, code, mode, prompt, signal }) {
            if (signal?.aborted) {
                throw new Error("Request aborted");
            }

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: prompt,
                                        },
                                    ],
                                },
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 4096,
                                responseMimeType: "application/json",
                            },
                        }),
                        signal,
                    },
                );

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(
                        `Gemini API error: ${response.status} - ${error.error?.message || response.statusText}`,
                    );
                }

                const data = await response.json();
                const textContent =
                    data.candidates?.[0]?.content?.parts?.[0]?.text ||
                    data.content?.parts?.[0]?.text;

                if (!textContent) {
                    throw new Error("Gemini returned no content");
                }

                return textContent;
            } catch (error) {
                if (error.name === "AbortError") {
                    throw error;
                }
                throw new Error(`Gemini provider failed: ${error.message}`);
            }
        },
    };
}
