import dotenv from "dotenv";

dotenv.config({ quiet: true });

const port = Number(process.env.PORT ?? 3000);
const cacheTtlMs = Number(process.env.CACHE_TTL_MS ?? 300000);
const cacheMaxEntries = Number(process.env.CACHE_MAX_ENTRIES ?? 500);

const llmTimeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 20000);
const providersEnv = String(process.env.LLM_PROVIDERS ?? "gemini,groq,openai,ollama").toLowerCase();
const llmProviders = providersEnv.split(",").map((p) => p.trim()).filter((p) => p.length > 0);

if (llmProviders.length === 0) {
    throw new Error("LLM_PROVIDERS must contain at least one provider (gemini, groq, openai, ollama).");
}

const validProviders = new Set(["gemini", "groq", "openai", "ollama"]);
for (const provider of llmProviders) {
    if (!validProviders.has(provider)) {
        throw new Error(`Invalid LLM provider '${provider}'. Valid providers: gemini, groq, openai, ollama.`);
    }
}

if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid PORT value. PORT must be a positive integer.");
}

if (!Number.isInteger(cacheTtlMs) || cacheTtlMs <= 0) {
    throw new Error("Invalid CACHE_TTL_MS value. CACHE_TTL_MS must be a positive integer.");
}

if (!Number.isInteger(cacheMaxEntries) || cacheMaxEntries <= 0) {
    throw new Error(
        "Invalid CACHE_MAX_ENTRIES value. CACHE_MAX_ENTRIES must be a positive integer.",
    );
}

if (!Number.isInteger(llmTimeoutMs) || llmTimeoutMs <= 0) {
    throw new Error("Invalid LLM_TIMEOUT_MS value. LLM_TIMEOUT_MS must be a positive integer.");
}

const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port,
    serviceVersion: "ie4",
    cacheTtlMs,
    cacheMaxEntries,
    llmTimeoutMs,
    llmProviders,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL ?? "mistral",
};

export default Object.freeze(env);
