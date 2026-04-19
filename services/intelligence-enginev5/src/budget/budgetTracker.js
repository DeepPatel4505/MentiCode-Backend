import env from "../config/env.js";

/**
 * BudgetTracker — per-session API usage counter.
 *
 * Prevents runaway spend on cloud APIs for large files.
 * Cloud providers (gemini, groq) are capped; ollama is unlimited (local).
 */
export class BudgetTracker {
    constructor(maxCloudCalls = env.maxCloudCallsPerSession) {
        this.maxCloudCalls = maxCloudCalls;
        this.counts = { gemini: 0, groq: 0, ollama: 0 };
    }

    get cloudCallsUsed() {
        return this.counts.gemini + this.counts.groq;
    }

    /**
     * Check whether a given provider can still be called within budget.
     * Ollama (local) is always allowed.
     *
     * @param {string} providerName
     * @returns {boolean}
     */
    canCall(providerName) {
        if (providerName === "ollama") return true;
        return this.cloudCallsUsed < this.maxCloudCalls;
    }

    /**
     * Record one completed API call for a provider.
     * @param {string} providerName
     */
    increment(providerName) {
        if (providerName in this.counts) {
            this.counts[providerName]++;
        }
    }

    /**
     * Return usage summary for logging.
     */
    summary() {
        return {
            gemini: this.counts.gemini,
            groq: this.counts.groq,
            ollama: this.counts.ollama,
            cloudTotal: this.cloudCallsUsed,
            budget: this.maxCloudCalls,
        };
    }
}
