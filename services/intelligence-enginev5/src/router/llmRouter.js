import env from "../config/env.js";
import { createGeminiProvider } from "../llm/providers/gemini.js";
import { createGroqProvider } from "../llm/providers/groq.js";
import { createOllamaProvider } from "../llm/providers/ollama.js";

const DEFAULT_TIMEOUT_MS = env.llmTimeoutMs;

// ─── Complexity → preferred provider mapping ───────────────────────────────────
const COMPLEXITY_PRIORITY = {
    high:   ["gemini", "groq", "ollama"],  // hardest: use best model first
    medium: ["groq", "gemini", "ollama"],  // fast+capable
    low:    ["ollama", "groq", "gemini"],  // low cost: try local first
};

// ─── Provider pool ─────────────────────────────────────────────────────────────

function buildProviderPool() {
    const pool = {};

    if (env.geminiApiKey) {
        try {
            pool.gemini = createGeminiProvider({ apiKey: env.geminiApiKey, model: env.geminiModel });
            console.log("[LLMRouter] Gemini provider ready.");
        } catch (e) {
            console.warn(`[LLMRouter] Gemini init failed: ${e.message}`);
        }
    }

    if (env.groqApiKey) {
        try {
            pool.groq = createGroqProvider({ apiKey: env.groqApiKey, model: env.groqModel });
            console.log("[LLMRouter] Groq provider ready.");
        } catch (e) {
            console.warn(`[LLMRouter] Groq init failed: ${e.message}`);
        }
    }

    // Ollama is always attempted (no key needed)
    pool.ollama = createOllamaProvider({ baseUrl: env.ollamaBaseUrl, model: env.ollamaModel });

    if (Object.keys(pool).length === 0) {
        throw new Error("[LLMRouter] No LLM providers could be initialized.");
    }

    return pool;
}

let providerPool = null;

function getPool() {
    if (!providerPool) providerPool = buildProviderPool();
    return providerPool;
}

// ─── Timeout wrapper ───────────────────────────────────────────────────────────

function withTimeout(taskFn, ms, providerName) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            controller.abort();
            reject(new Error(`Provider '${providerName}' timed out after ${ms}ms.`));
        }, ms);

        Promise.resolve()
            .then(() => taskFn({ signal: controller.signal }))
            .then((v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } })
            .catch((e) => { if (!settled) { settled = true; clearTimeout(timer); reject(e); } });
    });
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Route an LLM call based on complexity, falling back through the priority chain.
 *
 * @param {string} prompt - full prompt string
 * @param {"high"|"medium"|"low"} complexity - from complexityClassifier
 * @param {object} budget - BudgetTracker instance to check/record calls
 * @returns {Promise<{ text: string, provider: string, latency_ms: number }>}
 */
export async function routeLLM(prompt, complexity, budget) {
    const pool = getPool();
    const order = COMPLEXITY_PRIORITY[complexity] ?? COMPLEXITY_PRIORITY.medium;

    // Filter to providers that are configured AND within budget
    const candidates = order.filter((name) => pool[name] && budget.canCall(name));

    if (candidates.length === 0) {
        // Budget exhausted or no matching providers — fall back to any available
        const fallback = Object.keys(pool)[0];
        if (!fallback) throw new Error("No LLM providers available.");
        candidates.push(fallback);
    }

    const attempts = [];

    for (const name of candidates) {
        const provider = pool[name];
        const start = process.hrtime.bigint();

        try {
            const text = await withTimeout(
                ({ signal }) => provider.generate({ prompt, signal }),
                DEFAULT_TIMEOUT_MS,
                name,
            );

            const latency_ms = Number((process.hrtime.bigint() - start) / 1_000_000n);
            budget.increment(name);

            return { text, provider: name, latency_ms };
        } catch (err) {
            const latency_ms = Number((process.hrtime.bigint() - start) / 1_000_000n);
            attempts.push({ provider: name, error: err.message, latency_ms });
            // Try next provider
        }
    }

    const detail = attempts.map((a) => `${a.provider}: ${a.error}`).join("; ");
    throw new Error(`All LLM providers failed. Attempts: [${detail}]`);
}
