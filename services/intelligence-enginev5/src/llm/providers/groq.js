/**
 * groq.js — Groq provider for IE5
 *
 * Uses the Groq REST API directly (no SDK) for speed and zero extra deps.
 */

export function createGroqProvider({ apiKey, model = "llama-3.3-70b-versatile" } = {}) {
    if (!apiKey) {
        throw new Error("Groq provider requires GROQ_API_KEY.");
    }

    return {
        name: "groq",

        async generate({ prompt, signal }) {
            if (signal?.aborted) throw new Error("Request aborted before Groq call.");

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
                            role: "system",
                            content:
                                "You are an expert code reviewer. You return ONLY valid JSON with no prose or markdown fences.",
                        },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.2,
                    max_tokens: 2048,
                }),
                signal,
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(
                    `Groq API error ${response.status}: ${errBody.error?.message ?? response.statusText}`,
                );
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (!text) throw new Error("Groq returned no content.");
            return text;
        },
    };
}
