// Enterprise structured JSON logger with nanosecond-precision timing.
// Uses process.hrtime.bigint() — the highest precision timer available in Node.js.

const LOG_LEVELS = Object.freeze({
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
});

const CURRENT_ENV = process.env.NODE_ENV || "development";
const MIN_LEVEL = CURRENT_ENV === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug;

const NS_PER_MS = 1_000_000n;
const NS_PER_SEC = 1_000_000_000n;

/**
 * Emit a structured JSON log line to stdout/stderr.
 * @param {"debug"|"info"|"warn"|"error"|"fatal"} level
 * @param {string} msg   — short, machine-friendly event name (e.g. "http_request")
 * @param {object} [meta] — arbitrary key/value pairs merged into the log entry
 */
function log(level, msg, meta = {}) {
    const numericLevel = LOG_LEVELS[level];
    if (numericLevel === undefined) return;
    if (numericLevel < MIN_LEVEL) return;

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        msg,
        ...meta,
    };

    const line = JSON.stringify(entry);

    if (numericLevel >= LOG_LEVELS.error) {
        process.stderr.write(line + "\n");
    } else {
        process.stdout.write(line + "\n");
    }
}

/**
 * Start a high-resolution timer.
 * Returns a function that, when called, returns elapsed durations:
 *   - durationNs  — raw nanoseconds as string (BigInt-safe for JSON)
 *   - durationMs  — milliseconds as float
 *   - durationSec — seconds as float with nanosecond precision (up to 9 decimal places)
 *
 * @returns {() => { durationNs: string, durationMs: number, durationSec: number }}
 */
function startTimer() {
    const startNs = process.hrtime.bigint();

    return () => {
        const elapsedNs = process.hrtime.bigint() - startNs;
        const durationMs = Number(elapsedNs) / Number(NS_PER_MS);
        const durationSec = Number(elapsedNs) / Number(NS_PER_SEC);

        return {
            durationNs: elapsedNs.toString(),  // string to survive JSON serialisation
            durationMs: parseFloat(durationMs.toFixed(6)),
            durationSec: parseFloat(durationSec.toFixed(9)),
        };
    };
}

const logger = {
    debug: (msg, meta) => log("debug", msg, meta),
    info: (msg, meta) => log("info", msg, meta),
    warn: (msg, meta) => log("warn", msg, meta),
    error: (msg, meta) => log("error", msg, meta),
    fatal: (msg, meta) => log("fatal", msg, meta),
    startTimer,
};

export default logger;
