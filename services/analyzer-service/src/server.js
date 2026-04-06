import "dotenv/config";
import http from "http";
import app from "./app.js";
import { logger } from "@menticode/shared";
import { initWebSocket, closeWebSocket } from "./websocket/server.js";

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

let shuttingDown = false;

process.on("unhandledRejection", (reason) => {
	logger.base.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
	logger.base.fatal({ err }, "UNCAUGHT EXCEPTION - Server crashed");
	process.exit(1);
});

async function startServer() {
	const server = http.createServer(app);

	await initWebSocket(server);

	server.listen(PORT, () => {
		logger.base.info({ port: PORT, env: NODE_ENV }, "analyzer-api.started");
		logger.base.info({ apiUrl: `http://localhost:${PORT}/api/v1/`, wsUrl: `ws://localhost:${PORT}/ws` }, "analyzer-api.endpoints");
	});

	const shutdown = async (signal) => {
		if (shuttingDown) {
			return;
		}

		shuttingDown = true;
		logger.base.warn({ signal }, "analyzer-api.shutdown.start");

		await closeWebSocket();

		await new Promise((resolve) => {
			server.close(() => resolve());
		});

		logger.base.info("analyzer-api.shutdown.complete");
		process.exit(0);
	};

	process.on("SIGINT", () => {
		shutdown("SIGINT").catch((error) => {
			logger.base.error({ error }, "analyzer-api.shutdown.error");
			process.exit(1);
		});
	});

	process.on("SIGTERM", () => {
		shutdown("SIGTERM").catch((error) => {
			logger.base.error({ error }, "analyzer-api.shutdown.error");
			process.exit(1);
		});
	});

	return server;
}

if (process.env.NODE_ENV !== "test") {
	startServer().catch((error) => {
		logger.base.fatal({ error }, "analyzer-api.start.failed");
		process.exit(1);
	});
}

export default startServer;