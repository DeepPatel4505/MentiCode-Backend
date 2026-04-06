function write(level, event, meta = {}) {
    const payload = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...meta,
    };

    const line = JSON.stringify(payload);

    if (level === "error" || level === "fatal") {
        console.error(line);
        return;
    }

    console.log(line);
}

export default {
    info: (event, meta) => write("info", event, meta),
    warn: (event, meta) => write("warn", event, meta),
    error: (event, meta) => write("error", event, meta),
    fatal: (event, meta) => write("fatal", event, meta),
};
