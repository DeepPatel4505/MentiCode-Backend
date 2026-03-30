import env from "../config/env.js";
import { getMetrics } from "../utils/metrics.js";

const PROVIDER_NAMES = ["gemini", "groq", "openai", "ollama"];

function getProviderStatus() {
    const providers = {};

    for (const provider of PROVIDER_NAMES) {
        providers[provider] = "up";
    }

    providers.gemini = "primary";

    return providers;
}

export function getHealthStatus() {
    const metrics = getMetrics();

    return {
        status: "ok",
        version: env.serviceVersion,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        providers: getProviderStatus(),
        cache: {
            hit_rate: metrics.cache_hit_rate,
            hits: metrics.cache_hits,
            misses: metrics.cache_misses,
        },
        performance: {
            avg_latency_ms: metrics.avg_latency_ms,
            total_requests: metrics.total_requests,
        },
    };
}
