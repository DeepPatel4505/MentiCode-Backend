// Adapter: wraps @menticode/shared logger to expose the same
// logger.info(event, meta) call signature used throughout IE5.
import { logger as sharedLogger } from "@menticode/shared";

const base = sharedLogger.base;

const logger = {
    debug: (event, meta = {}) => base.debug(meta, event),
    info:  (event, meta = {}) => base.info(meta, event),
    warn:  (event, meta = {}) => base.warn(meta, event),
    error: (event, meta = {}) => base.error(meta, event),
    fatal: (event, meta = {}) => base.fatal(meta, event),
};

export default logger;
