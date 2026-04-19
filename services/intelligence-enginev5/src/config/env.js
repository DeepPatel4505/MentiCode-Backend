import dotenv from "dotenv";

dotenv.config({ quiet: true });

// ─── Port ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 5001);
if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid PORT value. Must be a positive integer.");
}

// ─── LLM Providers ────────────────────────────────────────────────────────────
const llmTimeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 30000);
if (!Number.isInteger(llmTimeoutMs) || llmTimeoutMs <= 0) {
    throw new Error("Invalid LLM_TIMEOUT_MS. Must be a positive integer.");
}

const providersEnv = String(process.env.LLM_PROVIDERS ?? "gemini,groq").toLowerCase();
const llmProviders = providersEnv
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

if (llmProviders.length === 0) {
    throw new Error("LLM_PROVIDERS must contain at least one provider (gemini, groq, ollama).");
}

const validProviders = new Set(["gemini", "groq", "ollama"]);
for (const provider of llmProviders) {
    if (!validProviders.has(provider)) {
        throw new Error(`Invalid LLM provider '${provider}'. Valid: gemini, groq, ollama.`);
    }
}

// ─── Budget ───────────────────────────────────────────────────────────────────
const maxCloudCallsPerSession = Number(process.env.MAX_CLOUD_CALLS_PER_SESSION ?? 20);

// ─── Database ─────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required.");
}

const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port,
    serviceVersion: "ie5",

    // LLM
    llmTimeoutMs,
    llmProviders,
    maxCloudCallsPerSession,

    // Providers
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",

    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL ?? "qwen3:8b",
};

export default Object.freeze(env);
