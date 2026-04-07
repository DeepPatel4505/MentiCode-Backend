// Adapter: wraps @menticode/shared logger to expose the same
// logger.info(msg, meta) / logger.error(msg, meta) call signature
// used throughout intelligence-enginev3.
import { logger as sharedLogger } from "@menticode/shared";

const base = sharedLogger.base;

function startTimer() {
    const startNs = process.hrtime.bigint();
    const NS_PER_MS = 1_000_000n;
    const NS_PER_SEC = 1_000_000_000n;

    return () => {
        const elapsedNs = process.hrtime.bigint() - startNs;
        const durationMs = Number(elapsedNs) / Number(NS_PER_MS);
        const durationSec = Number(elapsedNs) / Number(NS_PER_SEC);
        return {
            durationNs: elapsedNs.toString(),
            durationMs: parseFloat(durationMs.toFixed(6)),
            durationSec: parseFloat(durationSec.toFixed(9)),
        };
    };
}

const logger = {
    debug: (msg, meta = {}) => base.debug(meta, msg),
    info:  (msg, meta = {}) => base.info(meta, msg),
    warn:  (msg, meta = {}) => base.warn(meta, msg),
    error: (msg, meta = {}) => base.error(meta, msg),
    fatal: (msg, meta = {}) => base.fatal(meta, msg),
    startTimer,
};

export default logger;
