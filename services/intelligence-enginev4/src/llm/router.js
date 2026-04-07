const DEFAULT_TIMEOUT_MS = 20_000;

import env from "../config/env.js";
import { createGeminiProvider } from "./providers/gemini.js";
import { createGroqProvider } from "./providers/groq.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createOllamaProvider } from "./providers/ollama.js";

export class LLMRouterError extends Error {
    constructor(message, attempts = []) {
        super(message);
        this.name = "LLMRouterError";
        this.attempts = attempts;
    }
}

class ProviderTimeoutError extends Error {
    constructor(providerName, timeoutMs) {
        super(`Provider '${providerName}' timed out after ${timeoutMs}ms.`);
        this.name = "ProviderTimeoutError";
        this.provider = providerName;
        this.timeoutMs = timeoutMs;
    }
}

class InvalidProviderResponseError extends Error {
    constructor(providerName, message) {
        super(`Provider '${providerName}' returned invalid JSON: ${message}`);
        this.name = "InvalidProviderResponseError";
        this.provider = providerName;
    }
}

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stripMarkdownCodeFences(text) {
    const raw = String(text || "").trim();
    const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced ? fenced[1].trim() : raw;
}

function extractFirstJSONObject(text) {
    const input = stripMarkdownCodeFences(text);

    try {
        return JSON.parse(input);
    } catch {
        // Continue to best-effort extraction below.
    }

    const start = input.indexOf("{");
    if (start === -1) {
        throw new Error("no JSON object found in provider output");
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < input.length; i++) {
        const ch = input[i];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (ch === "\\") {
                escaped = true;
                continue;
            }

            if (ch === '"') {
                inString = false;
            }

            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === "{") {
            depth++;
            continue;
        }

        if (ch === "}") {
            depth--;

            if (depth === 0) {
                const candidate = input.slice(start, i + 1);
                return JSON.parse(candidate);
            }
        }
    }

    throw new Error("unterminated JSON object in provider output");
}

function parseProviderResult(result, providerName) {
    if (typeof result === "string") {
        try {
            const parsed = extractFirstJSONObject(result);
            if (!isObject(parsed)) {
                throw new InvalidProviderResponseError(providerName, "root must be an object");
            }
            return parsed;
        } catch (error) {
            if (error instanceof InvalidProviderResponseError) {
                throw error;
            }
            const preview = String(result || "")
                .replace(/\s+/g, " ")
                .slice(0, 180);
            throw new InvalidProviderResponseError(
                providerName,
                `unable to parse JSON string (${error.message}). preview='${preview}'`,
            );
        }
    }

    if (!isObject(result)) {
        throw new InvalidProviderResponseError(providerName, "result must be an object or JSON string");
    }

    return result;
}

function validateReviewShape(result, providerName) {
    if (!isObject(result.summary)) {
        throw new InvalidProviderResponseError(providerName, "missing 'summary' object");
    }

    if (!Array.isArray(result.findings)) {
        throw new InvalidProviderResponseError(providerName, "missing 'findings' array");
    }

    return result;
}

function withTimeout(taskFactory, timeoutMs, providerName) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        let done = false;

        const timeout = setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            controller.abort();
            reject(new ProviderTimeoutError(providerName, timeoutMs));
        }, timeoutMs);

        Promise.resolve()
            .then(() => taskFactory({ signal: controller.signal }))
            .then((value) => {
                if (done) {
                    return;
                }
                done = true;
                clearTimeout(timeout);
                resolve(value);
            })
            .catch((error) => {
                if (done) {
                    return;
                }
                done = true;
                clearTimeout(timeout);
                reject(error);
            });
    });
}

function buildRealProviders() {
    const providers = [];

    for (const providerName of env.llmProviders) {
        try {
            let provider;
            if (providerName === "gemini") {
                if (!env.geminiApiKey) {
                    console.warn(`[LLMRouter] Skipping gemini: missing GEMINI_API_KEY`);
                    continue;
                }
                provider = createGeminiProvider({
                    apiKey: env.geminiApiKey,
                    model: env.geminiModel,
                });
            } else if (providerName === "groq") {
                if (!env.groqApiKey) {
                    console.warn(`[LLMRouter] Skipping groq: missing GROQ_API_KEY`);
                    continue;
                }
                provider = createGroqProvider({
                    apiKey: env.groqApiKey,
                    model: env.groqModel,
                });
            } else if (providerName === "openai") {
                if (!env.openaiApiKey) {
                    console.warn(`[LLMRouter] Skipping openai: missing OPENAI_API_KEY`);
                    continue;
                }
                provider = createOpenAIProvider({
                    apiKey: env.openaiApiKey,
                    model: env.openaiModel,
                });
            } else if (providerName === "ollama") {
                provider = createOllamaProvider({
                    baseUrl: env.ollamaBaseUrl,
                    model: env.ollamaModel,
                });
            } else {
                console.warn(`[LLMRouter] Unknown provider: ${providerName}`);
                continue;
            }

            if (provider) {
                providers.push(provider);
                console.log(`[LLMRouter] Initialized provider: ${providerName}`);
            }
        } catch (error) {
            console.error(`[LLMRouter] Failed to initialize ${providerName}:`, error.message);
        }
    }

        if (providers.length === 0) {
        throw new Error("[LLMRouter] No valid LLM providers initialized. Service cannot start.");
    }

    return providers;
}

export function createLLMRouter({
    providers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    validateResult = validateReviewShape,
} = {}) {
    if (!Array.isArray(providers) || providers.length === 0) {
        throw new Error("LLM router requires at least one provider.");
    }

    const normalizedProviders = providers.map((provider) => {
        if (!provider || typeof provider.name !== "string" || typeof provider.generate !== "function") {
            throw new Error("Each provider must have 'name' and async 'generate' function.");
        }

        return provider;
    });

    return {
        async generateReview(payload, options = {}) {
            const effectiveTimeout = options.timeoutMs ?? timeoutMs;
            const attempts = [];

            for (const provider of normalizedProviders) {
                const startedAt = process.hrtime.bigint();

                try {
                    const raw = await withTimeout(
                        ({ signal }) => provider.generate({ ...payload, signal }),
                        effectiveTimeout,
                        provider.name,
                    );

                    const parsed = parseProviderResult(raw, provider.name);
                    const validated = validateResult(parsed, provider.name);
                    const latencyMs = Number(
                        ((process.hrtime.bigint() - startedAt) / 1_000_000n).toString(),
                    );

                    return {
                        result: validated,
                        provider: provider.name,
                        latency_ms: latencyMs,
                    };
                } catch (error) {
                    const latencyMs = Number(
                        ((process.hrtime.bigint() - startedAt) / 1_000_000n).toString(),
                    );

                    attempts.push({
                        provider: provider.name,
                        error: error?.message || "Unknown provider error",
                        type: error?.name || "Error",
                        latency_ms: latencyMs,
                    });
                }
            }

            throw new LLMRouterError("All configured LLM providers failed.", attempts);
        },
    };
}

const realProviders = buildRealProviders();
export const llmRouter = createLLMRouter({
    providers: realProviders,
});
