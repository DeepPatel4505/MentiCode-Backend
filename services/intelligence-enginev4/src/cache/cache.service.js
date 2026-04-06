import crypto from "crypto";

function normalizeCode(code) {
    return String(code || "").trim().replace(/\s+/g, " ");
}

export function createAnalysisCacheKey({ language, code }) {
    const normalizedLanguage = String(language || "").trim().toLowerCase();
    const normalizedCode = normalizeCode(code);
    const keyMaterial = `${normalizedLanguage}${normalizedCode}`;

    return crypto.createHash("sha256").update(keyMaterial).digest("hex");
}

export function createInMemoryLRUStore({ maxEntries = 500, defaultTtlMs = 300_000 } = {}) {
    const cache = new Map();

    function isExpired(entry) {
        return Number.isFinite(entry.expiresAt) && entry.expiresAt <= Date.now();
    }

    function touchKey(key, entry) {
        cache.delete(key);
        cache.set(key, entry);
    }

    return {
        get(key) {
            const entry = cache.get(key);

            if (!entry) {
                return null;
            }

            if (isExpired(entry)) {
                cache.delete(key);
                return null;
            }

            touchKey(key, entry);
            return entry.value;
        },

        set(key, value, ttlMs = defaultTtlMs) {
            const safeTtlMs = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : defaultTtlMs;
            const expiresAt = Date.now() + safeTtlMs;

            cache.set(key, { value, expiresAt });

            if (cache.size > maxEntries) {
                const oldestKey = cache.keys().next().value;
                if (oldestKey !== undefined) {
                    cache.delete(oldestKey);
                }
            }
        },

        delete(key) {
            cache.delete(key);
        },

        clear() {
            cache.clear();
        },
    };
}

export function createCacheService({
    store,
    defaultTtlMs = 300_000,
} = {}) {
    const backingStore =
        store ||
        createInMemoryLRUStore({
            defaultTtlMs,
        });

    // The store adapter can be swapped with Redis later if it supports get/set/delete/clear.
    return {
        buildKey: createAnalysisCacheKey,

        getByAnalysisInput(input) {
            const key = createAnalysisCacheKey(input);
            return {
                key,
                value: backingStore.get(key),
            };
        },

        setByAnalysisInput(input, value, ttlMs = defaultTtlMs) {
            const key = createAnalysisCacheKey(input);
            backingStore.set(key, value, ttlMs);
            return key;
        },

        deleteByAnalysisInput(input) {
            const key = createAnalysisCacheKey(input);
            backingStore.delete(key);
            return key;
        },

        clear() {
            backingStore.clear();
        },
    };
}
