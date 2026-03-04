import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import IORedis from "ioredis";
import prisma from "../config/prisma.js";
import { getRedisConfig } from "../config/redis.js";
import { JOB_EVENTS_CHANNEL } from "./events.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const jobSubscribers = new Map();
const socketSubscriptions = new Map();

let subscriberClient = null;
let webSocketServer = null;

function parseTokenFromRequest(request) {
	const authHeader = request.headers?.authorization;
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice(7).trim();
	}

	if (!request.url) {
		return null;
	}

	const url = new URL(request.url, "http://localhost");
	return url.searchParams.get("token");
}

async function validateOwnership(userId, jobId) {
	if (!userId || !jobId) {
		return false;
	}

	const ownedJob = await prisma.analysisJob.findFirst({
		where: {
			id: jobId,
			file: {
				playground: {
					userId,
				},
			},
		},
		select: { id: true },
	});

	return Boolean(ownedJob);
}

function cleanupSocketSubscriptions(ws) {
	const jobs = socketSubscriptions.get(ws);
	if (!jobs) {
		return;
	}

	for (const jobId of jobs) {
		const sockets = jobSubscribers.get(jobId);
		if (!sockets) {
			continue;
		}

		sockets.delete(ws);
		if (sockets.size === 0) {
			jobSubscribers.delete(jobId);
		}
	}

	socketSubscriptions.delete(ws);
}

function subscribeSocketToJob(ws, jobId) {
	if (!jobSubscribers.has(jobId)) {
		jobSubscribers.set(jobId, new Set());
	}

	jobSubscribers.get(jobId).add(ws);

	if (!socketSubscriptions.has(ws)) {
		socketSubscriptions.set(ws, new Set());
	}

	socketSubscriptions.get(ws).add(jobId);
}

function unsubscribeSocketFromJob(ws, jobId) {
	const sockets = jobSubscribers.get(jobId);
	if (sockets) {
		sockets.delete(ws);
		if (sockets.size === 0) {
			jobSubscribers.delete(jobId);
		}
	}

	const jobs = socketSubscriptions.get(ws);
	if (jobs) {
		jobs.delete(jobId);
		if (jobs.size === 0) {
			socketSubscriptions.delete(ws);
		}
	}
}

function sendJson(ws, payload) {
	if (ws.readyState !== ws.OPEN) {
		return;
	}

	ws.send(JSON.stringify(payload));
}

export function emitToUserJob(jobId, payload) {
	const sockets = jobSubscribers.get(jobId);
	if (!sockets || sockets.size === 0) {
		return;
	}

	for (const ws of sockets) {
		sendJson(ws, payload);
	}
}

export async function initWebSocket(server) {
	const wss = new WebSocketServer({ noServer: true });
	webSocketServer = wss;

	subscriberClient = new IORedis(getRedisConfig());
	await subscriberClient.subscribe(JOB_EVENTS_CHANNEL);

	subscriberClient.on("message", (channel, rawMessage) => {
		if (channel !== JOB_EVENTS_CHANNEL) {
			return;
		}

		try {
			const parsed = JSON.parse(rawMessage);
			emitToUserJob(parsed.jobId, parsed.payload);
		} catch {
			return;
		}
	});

	server.on("upgrade", (request, socket, head) => {
		const pathname = request.url ? new URL(request.url, "http://localhost").pathname : "";
		if (pathname !== "/ws") {
			socket.destroy();
			return;
		}

		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, request);
		});
	});

	wss.on("connection", (ws, request) => {
		let payload;
		try {
			const token = parseTokenFromRequest(request);
			if (!token) {
				ws.close(1008, "Unauthorized");
				return;
			}

			payload = jwt.verify(token, JWT_SECRET);
			if (!payload?.sub) {
				ws.close(1008, "Unauthorized");
				return;
			}
		} catch {
			ws.close(1008, "Unauthorized");
			return;
		}

		ws.userId = payload.sub;
		sendJson(ws, { type: "connection.ready" });

		ws.on("message", async (rawMessage) => {
			let message;
			try {
				message = JSON.parse(rawMessage.toString());
			} catch {
				sendJson(ws, { type: "error", message: "Invalid message format" });
				return;
			}

			if (message?.type === "ping") {
				sendJson(ws, { type: "pong" });
				return;
			}

			if (message?.type === "unsubscribe") {
				if (typeof message.jobId === "string") {
					unsubscribeSocketFromJob(ws, message.jobId);
					sendJson(ws, { type: "unsubscribed", jobId: message.jobId });
				}
				return;
			}

			if (message?.type !== "subscribe") {
				sendJson(ws, { type: "error", message: "Unsupported message type" });
				return;
			}

			const { jobId } = message;
			if (typeof jobId !== "string" || !jobId.trim()) {
				sendJson(ws, { type: "error", message: "jobId is required" });
				return;
			}

			const ownsJob = await validateOwnership(ws.userId, jobId);
			if (!ownsJob) {
				sendJson(ws, { type: "error", message: "Forbidden" });
				return;
			}

			subscribeSocketToJob(ws, jobId);
			sendJson(ws, { type: "subscribed", jobId });
		});

		ws.on("close", () => {
			cleanupSocketSubscriptions(ws);
		});
	});

	return wss;
}

export async function closeWebSocket() {
	if (subscriberClient && subscriberClient.status !== "end") {
		await subscriberClient.quit();
	}

	if (!webSocketServer) {
		return;
	}

	await new Promise((resolve) => {
		webSocketServer.close(() => resolve());
	});

	jobSubscribers.clear();
	socketSubscriptions.clear();
}