import "./app.js"; // ensures dotenv/config is loaded first via app.js import chain
import app from "./app.js";
import { logger } from "@menticode/shared";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            logger.base.info({ port: PORT, env: process.env.NODE_ENV || "development" }, "auth-service.started");
        });
    } catch (error) {
        logger.base.fatal({ err: error }, "auth-service.start.failed");
        process.exit(1);
    }
};

process.on("unhandledRejection", (reason) => {
    logger.base.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
    logger.base.fatal({ err }, "UNCAUGHT EXCEPTION - Server crashed");
    process.exit(1);
});

startServer();