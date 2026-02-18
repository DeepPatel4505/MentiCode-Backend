import "dotenv/config";

/** Ensure the Ollama URL always points to the /api/generate endpoint. */
function resolveOllamaUrl(raw) {
    const base = (raw || "http://localhost:11434").replace(/\/+$/, "");
    return base.endsWith("/api/generate") ? base : `${base}/api/generate`;
}

const config = Object.freeze({
    // ── Server ──────────────────────────────────────────────
    PORT: parseInt(process.env.PORT, 10) || 4002,
    NODE_ENV: process.env.NODE_ENV || "development",

    // ── Ollama / LLM ────────────────────────────────────────
    OLLAMA_URL: resolveOllamaUrl(process.env.OLLAMA_URL),
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || "qwen3:8b",
    MODEL_TEMPERATURE: parseFloat(process.env.MODEL_TEMPERATURE) || 0,
    MODEL_TOP_P: parseFloat(process.env.MODEL_TOP_P) || 1,
    MODEL_TOP_K: parseInt(process.env.MODEL_TOP_K, 10) || 40,
    MODEL_MAX_TOKENS: parseInt(process.env.MODEL_MAX_TOKENS, 10) || 400,
    MODEL_TIMEOUT_MS:
        parseInt(process.env.MODEL_TIMEOUT_MS, 10) || 180_000,

    // ── Analysis ────────────────────────────────────────────
    MIN_CONFIDENCE: parseFloat(process.env.MIN_CONFIDENCE) || 0.6,
    MAX_FINDINGS: parseInt(process.env.MAX_FINDINGS, 10) || 8,
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES, 10) || 2,

    // ── Express ─────────────────────────────────────────────
    BODY_LIMIT: process.env.BODY_LIMIT || "1mb",
});

export default config;
