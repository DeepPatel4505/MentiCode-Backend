import dotenv from "dotenv";

// Load environment variables once at startup.
// In production, variables should come from the environment;
// .env is mainly for local development.
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";

// Backwards compatibility: in local development, also try loading from ./src/.env
// if the primary configuration did not provide the API key.
if (!process.env.GEMINI_API_KEY && NODE_ENV === "development") {
    dotenv.config({ path: "./src/.env" });
}

const parseNumber = (value, fallback) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const PORT = parseNumber(process.env.PORT, 3000);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    // Fail fast on misconfiguration in all non-test environments
    if (NODE_ENV !== "test") {
        throw new Error("Missing required environment variable: GEMINI_API_KEY");
    }
}

const LLM_MODEL = process.env.LLM_MODEL || "deepseek-coder:6.7b-instruct";
const LLM_TIMEOUT_MS = parseNumber(process.env.LLM_TIMEOUT_MS, 30_000);

const config = {
    env: NODE_ENV,
    port: PORT,
    llm: {
        apiKey: GEMINI_API_KEY,
        model: LLM_MODEL,
        timeoutMs: LLM_TIMEOUT_MS,
    },
};

export default config;

