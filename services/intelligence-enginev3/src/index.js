import http from "http";
import app from "./app.js";
import config from "./config/config.js";
import logger from "./utils/logger.js";

function startServer() {
    try {
        const server = http.createServer(app);

        server.listen(config.port, () => {
            logger.info("server_started", {
                port: config.port,
                env: config.env,
                pid: process.pid,
                nodeVersion: process.version,
            });
        });

        // ── Graceful shutdown ───────────────────────────────────────────
        const shutdown = (signal) => {
            logger.info("server_shutting_down", { signal });

            server.close((err) => {
                if (err) {
                    logger.error("server_shutdown_error", {
                        error: err.message,
                    });
                    process.exit(1);
                }
                logger.info("server_stopped", { signal });
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        return server;
    } catch (err) {
        logger.fatal("server_startup_crash", {
            error: err.message,
            stack: err.stack,
        });
        process.exit(1);
    }
}

// Allow tests to import and start/stop the server manually.
if (process.env.NODE_ENV !== "test") {
    startServer();
}

export { startServer };
