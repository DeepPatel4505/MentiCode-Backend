let metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    latencies: [],
};

const LATENCY_WINDOW = 100;

export function recordRequest({
    cached = false,
    latencyMs = 0,
} = {}) {
    metrics.totalRequests++;

    if (cached) {
        metrics.cacheHits++;
    } else {
        metrics.cacheMisses++;
    }

    metrics.latencies.push(latencyMs);

    if (metrics.latencies.length > LATENCY_WINDOW) {
        metrics.latencies.shift();
    }
}

export function getMetrics() {
    const totalHits = metrics.cacheHits + metrics.cacheMisses;
    const hitRate = totalHits === 0 ? 0 : Math.round((metrics.cacheHits / totalHits) * 100);
    const avgLatency =
        metrics.latencies.length === 0
            ? 0
            : Math.round(
                  metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length,
              );

    return {
        total_requests: metrics.totalRequests,
        cache_hits: metrics.cacheHits,
        cache_misses: metrics.cacheMisses,
        cache_hit_rate: hitRate,
        avg_latency_ms: avgLatency,
    };
}

export function resetMetrics() {
    metrics = {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        latencies: [],
    };
}
