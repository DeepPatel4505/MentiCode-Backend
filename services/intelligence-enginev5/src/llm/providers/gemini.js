/**
 * gemini.js — Gemini provider for IE5
 *
 * Uses the Gemini REST API directly (no SDK dependency) with JSON response mode.
 * Ported from IE4 and adapted to IE5's plain-text prompt interface.
 */

export function createGeminiProvider({ apiKey, model = "gemini-2.5-flash" } = {}) {
    if (!apiKey) {
        throw new Error("Gemini provider requires GEMINI_API_KEY.");
    }

    return {
        name: "gemini",

        async generate({ prompt, signal }) {
            if (signal?.aborted) throw new Error("Request aborted before Gemini call.");

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,        // low temp for analytical tasks
                            maxOutputTokens: 4096,
                            responseMimeType: "application/json",
                        },
                    }),
                    signal,
                },
            );

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(
                    `Gemini API error ${response.status}: ${errBody.error?.message ?? response.statusText}`,
                );
            }

            const data = await response.json();
            const text =
                data.candidates?.[0]?.content?.parts?.[0]?.text ??
                data.content?.parts?.[0]?.text;

            if (!text) throw new Error("Gemini returned no content.");
            return text;
        },
    };
}
