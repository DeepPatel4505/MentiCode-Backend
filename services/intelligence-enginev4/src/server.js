import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";

function startServer() {
    const server = http.createServer(app);

    server.listen(env.port, () => {
        logger.info("server_started", {
            port: env.port,
            env: env.nodeEnv,
            service: env.serviceVersion,
            pid: process.pid,
        });
    });

    const shutdown = (signal) => {
        logger.info("server_stopping", { signal });

        server.close((error) => {
            if (error) {
                logger.error("server_stop_failed", {
                    signal,
                    error: error.message,
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
}

if (process.env.NODE_ENV !== "test") {
    startServer();
}

export { startServer };
