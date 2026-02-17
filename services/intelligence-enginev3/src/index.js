import http from "http";
import app from "./app.js";
import config from "./config/config.js";

function startServer() {
    try {
        const server = http.createServer(app);

        server.listen(config.port, () => {
            // Keep startup log minimal but structured for production.
            // In a real logging system, this would use a logger utility.
            console.log(
                JSON.stringify({
                    level: "info",
                    msg: "HTTP server started",
                    port: config.port,
                    env: config.env,
                }),
            );
        });

        const shutdown = (signal) => {
            console.log(
                JSON.stringify({
                    level: "info",
                    msg: "Shutting down HTTP server",
                    signal,
                }),
            );
            server.close((err) => {
                if (err) {
                    console.error(
                        JSON.stringify({
                            level: "error",
                            msg: "Error during HTTP server shutdown",
                            error: err.message,
                        }),
                    );
                    process.exit(1);
                }
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        return server;
    } catch (err) {
        console.error(
            JSON.stringify({
                level: "fatal",
                msg: "FATAL STARTUP ERROR — Server crashed before boot",
                error: err.message,
            }),
        );
        process.exit(1);
    }
}

// Allow tests to import and start/stop the server manually.
if (process.env.NODE_ENV !== "test") {
    startServer();
}

export { startServer };
