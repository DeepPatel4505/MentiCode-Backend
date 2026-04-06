/**
 * Structured logger with nanosecond-precision timing.
 *
 * Uses `process.hrtime.bigint()` for the highest-resolution monotonic clock
 * available in Node.js (nanosecond precision).
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL =
    LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.DEBUG;

// ── Formatting helpers ──────────────────────────────────────────────

function timestamp() {
    return new Date().toISOString();
}

function fmt(level, message, meta) {
    const base = `[${timestamp()}] [${level}] ${message}`;
    if (meta && Object.keys(meta).length > 0) {
        return `${base} ${JSON.stringify(meta)}`;
    }
    return base;
}

// ── Core log methods ────────────────────────────────────────────────

function debug(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) console.debug(fmt("DEBUG", message, meta));
}

function info(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) console.info(fmt("INFO", message, meta));
}

function warn(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) console.warn(fmt("WARN", message, meta));
}

function error(message, meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) console.error(fmt("ERROR", message, meta));
}

// ── High-resolution timer ───────────────────────────────────────────

/**
 * Start a high-resolution timer.
 * @returns {bigint} Start time in nanoseconds from `process.hrtime.bigint()`.
 */
function startTimer() {
    return process.hrtime.bigint();
}

/**
 * End a timer and return the elapsed duration as a formatted string.
 * @param {bigint} start — value returned by `startTimer()`.
 * @returns {{ elapsedNs: bigint, elapsedMs: string, elapsedSec: string }}
 */
function endTimer(start) {
    const elapsedNs = process.hrtime.bigint() - start;
    const elapsedMs = `${(Number(elapsedNs) / 1e6).toFixed(6)} ms`;
    const elapsedSec = `${(Number(elapsedNs) / 1e9).toFixed(9)} s`;
    return { elapsedNs, elapsedMs, elapsedSec };
}

/**
 * Log the elapsed time for a named stage.
 * @param {string} stageName
 * @param {bigint} start — value returned by `startTimer()`.
 */
function logStageTime(stageName, start) {
    const { elapsedSec } = endTimer(start);
    info(`⏱  ${stageName} completed`, { duration: elapsedSec });
}

const logger = Object.freeze({
    debug,
    info,
    warn,
    error,
    startTimer,
    endTimer,
    logStageTime,
});

export default logger;
