import "dotenv/config";
import { spawn } from "node:child_process";
import jwt from "jsonwebtoken";
import WebSocket from "ws";
import prisma from "../src/config/prisma.js";

const BASE_URL = process.env.ANALYSIS_SERVICE_URL || `http://localhost:${process.env.PORT || 4000}`;
const WS_URL = (process.env.ANALYSIS_WS_URL || BASE_URL).replace(/^http/i, "ws");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const START_LOCAL_WORKER = process.env.START_LOCAL_WORKER !== "false";

const POLL_INTERVAL_MS = Number(process.env.FLOW_POLL_INTERVAL_MS || 2000);
const POLL_TIMEOUT_MS = Number(process.env.FLOW_POLL_TIMEOUT_MS || 120000);
const WS_EVENT_TIMEOUT_MS = Number(process.env.FLOW_WS_TIMEOUT_MS || 120000);

const stepResults = [];

let workerProcess = null;
let ws = null;
let wsReady = false;
const wsMessages = [];

function nowIso() {
	return new Date().toISOString();
}

function stepLog(phase, title, details) {
	const prefix = `[${nowIso()}] [${phase}] ${title}`;
	if (details === undefined) {
		console.log(prefix);
		return;
	}

	console.log(prefix);
	console.log(JSON.stringify(details, null, 2));
}

async function runStep(title, fn) {
	const startedAt = Date.now();
	stepLog("STARTED", title);

	try {
		const data = await fn();
		const durationMs = Date.now() - startedAt;
		stepResults.push({ title, status: "PASSED", durationMs });
		stepLog("PASSED", `${title} (${durationMs}ms)`, data);
		return data;
	} catch (error) {
		const durationMs = Date.now() - startedAt;
		stepResults.push({ title, status: "FAILED", durationMs, error: error.message });
		stepLog("FAILED", `${title} (${durationMs}ms)`, { error: error.message });
		throw error;
	}
}

function printSummary() {
	console.log("\n========== FLOW SUMMARY ==========");
	for (const result of stepResults) {
		const base = `${result.status.padEnd(6)} | ${result.title} | ${result.durationMs}ms`;
		if (result.error) {
			console.log(`${base} | error=${result.error}`);
		} else {
			console.log(base);
		}
	}

	const failed = stepResults.filter((item) => item.status === "FAILED");
	if (failed.length === 0) {
		console.log("ALL STEPS PASSED ✅");
	} else {
		console.log(`FAILED STEPS: ${failed.length} ❌`);
	}
}

async function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(path, method, token, body) {
	const response = await fetch(`${BASE_URL}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	let json = null;
	try {
		json = await response.json();
	} catch {
		json = null;
	}

	if (!response.ok) {
		throw new Error(`Request failed ${method} ${path}: ${response.status} ${JSON.stringify(json)}`);
	}

	return json;
}

function startLocalWorker() {
	const child = spawn(process.execPath, ["src/workers/analysis.worker.js"], {
		cwd: process.cwd(),
		env: process.env,
		stdio: ["ignore", "pipe", "pipe"],
	});

	child.stdout.on("data", (data) => {
		process.stdout.write(`[worker] ${data}`);
	});

	child.stderr.on("data", (data) => {
		process.stderr.write(`[worker] ${data}`);
	});

	child.on("exit", (code) => {
		console.log(`[worker] exited with code ${code}`);
	});

	return child;
}

async function connectWebSocket(token) {
	const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(token)}`;

	return new Promise((resolve, reject) => {
		const client = new WebSocket(wsUrl);
		let resolved = false;

		const timer = setTimeout(() => {
			if (!resolved) {
				client.terminate();
				reject(new Error(`WebSocket connection timeout after ${WS_EVENT_TIMEOUT_MS}ms`));
			}
		}, WS_EVENT_TIMEOUT_MS);

		client.on("message", (raw) => {
			let parsed;
			try {
				parsed = JSON.parse(raw.toString());
			} catch {
				return;
			}

			wsMessages.push(parsed);
			if (parsed.type === "connection.ready" && !resolved) {
				resolved = true;
				clearTimeout(timer);
				resolve(client);
			}
		});

		client.on("error", (error) => {
			if (!resolved) {
				clearTimeout(timer);
				reject(error);
			}
		});

		client.on("close", (code, reason) => {
			if (!resolved) {
				clearTimeout(timer);
				reject(new Error(`WebSocket closed before ready: code=${code} reason=${reason.toString()}`));
			}
		});
	});
}

async function waitForWsEvent(jobId, eventTypes) {
	const start = Date.now();

	while (Date.now() - start < WS_EVENT_TIMEOUT_MS) {
		const found = wsMessages.find((msg) => msg?.jobId === jobId && eventTypes.includes(msg?.type));
		if (found) {
			return found;
		}

		await wait(200);
	}

	throw new Error(`No websocket event received for job ${jobId} in ${WS_EVENT_TIMEOUT_MS}ms`);
}

async function pollJobStatus(token, jobId) {
	const startedAt = Date.now();
	const transitions = [];
	let lastStatus = null;

	while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
		const status = await requestJson(`/api/v1/analysis/jobs/${jobId}`, "GET", token);
		if (status.status !== lastStatus) {
			transitions.push({ at: nowIso(), status: status.status });
			lastStatus = status.status;
			stepLog("INFO", "Status transition", status);
		}

		if (status.status === "completed" || status.status === "failed") {
			return { finalStatus: status, transitions };
		}

		await wait(POLL_INTERVAL_MS);
	}

	throw new Error(`Polling timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function run() {
	console.log(`Using analyzer service: ${BASE_URL}`);
	console.log(`Using websocket endpoint: ${WS_URL}/ws`);
	console.log(`Start local worker: ${START_LOCAL_WORKER}`);

	const userId = "77777777-7777-7777-7777-777777777777";
	const token = jwt.sign(
		{
			sub: userId,
			role: "student",
			plan: "free",
		},
		JWT_SECRET,
		{ expiresIn: "1h" }
	);

	await runStep("Step 1 - API health check", async () => {
		const response = await fetch(`${BASE_URL}/api/v1/`);
		if (!response.ok) {
			throw new Error(`Health check failed with ${response.status}`);
		}

		return response.json();
	});

	await runStep("Step 2 - Start local worker process", async () => {
		if (!START_LOCAL_WORKER) {
			return { started: false, reason: "START_LOCAL_WORKER=false" };
		}

		workerProcess = startLocalWorker();
		await wait(1500);
		return { started: true };
	});

	await runStep("Step 3 - Connect websocket with JWT handshake", async () => {
		ws = await connectWebSocket(token);
		wsReady = true;
		return { ready: wsReady };
	});

	const code = "function add(a,b){return a+b;}\nconsole.log(add(3,4));";
	const createPayload = {
		name: "Complete Flow Playground",
		sourceType: "upload",
		files: [
			{
				name: "app.js",
				language: "javascript",
				storagePath: `inline://${encodeURIComponent(code)}`,
			},
		],
	};

	const createdPlayground = await runStep("Step 4 - Create playground", async () => {
		return requestJson("/api/v1/analysis/playgrounds", "POST", token, createPayload);
	});

	const listedFiles = await runStep("Step 5 - List files", async () => {
		return requestJson(`/api/v1/analysis/playgrounds/${createdPlayground.id}/files`, "GET", token);
	});

	if (!Array.isArray(listedFiles) || listedFiles.length === 0) {
		throw new Error("No files created for playground");
	}

	const fileId = listedFiles[0].id;

	const analyzeResponse = await runStep("Step 6 - Enqueue analysis job", async () => {
		return requestJson(`/api/v1/analysis/playgrounds/${createdPlayground.id}/files/${fileId}/analyze`, "POST", token);
	});

	if (!analyzeResponse?.jobId) {
		throw new Error("Analyze response missing jobId");
	}

	await runStep("Step 7 - Subscribe websocket to job", async () => {
		ws.send(JSON.stringify({ type: "subscribe", jobId: analyzeResponse.jobId }));
		const subscribedEvent = await waitForWsEvent(analyzeResponse.jobId, ["subscribed"]);
		return subscribedEvent;
	});

	const wsLifecycleEvent = await runStep("Step 8 - Receive websocket lifecycle event", async () => {
		return waitForWsEvent(analyzeResponse.jobId, ["job.running", "job.completed", "job.failed"]);
	});

	const { finalStatus, transitions } = await runStep("Step 9 - Poll job status until terminal", async () => {
		return pollJobStatus(token, analyzeResponse.jobId);
	});

	if (finalStatus.status !== "completed") {
		throw new Error(`Job finished as ${finalStatus.status}. Verify worker/engine logs.`);
	}

	const resultResponse = await runStep("Step 10 - Fetch result endpoint", async () => {
		return requestJson(`/api/v1/analysis/jobs/${analyzeResponse.jobId}/result`, "GET", token);
	});

	await runStep("Step 11 - Verify DB lifecycle state", async () => {
		const jobInDb = await prisma.analysisJob.findUnique({
			where: { id: analyzeResponse.jobId },
			select: {
				id: true,
				status: true,
				errorMessage: true,
				startedAt: true,
				completedAt: true,
			},
		});

		const resultInDb = await prisma.analysisResult.findUnique({
			where: { jobId: analyzeResponse.jobId },
			select: {
				jobId: true,
				summary: true,
				findings: true,
				createdAt: true,
			},
		});

		if (!jobInDb || jobInDb.status !== "completed") {
			throw new Error("DB job is not completed");
		}

		if (!resultInDb) {
			throw new Error("DB result record missing");
		}

		return { jobInDb, resultInDb };
	});

	await runStep("Step 12 - Print final verification payload", async () => {
		return {
			jobId: analyzeResponse.jobId,
			fileId,
			wsLifecycleEvent,
			transitions,
			resultPreview: {
				summary: resultResponse.summary,
				findingsCount: Array.isArray(resultResponse.findings) ? resultResponse.findings.length : 0,
			},
		};
	});

	console.log("\n✅ COMPLETE FLOW TEST PASSED");
}

run()
	.catch((error) => {
		console.error("\n❌ COMPLETE FLOW TEST FAILED");
		console.error(error.message);
		process.exitCode = 1;
	})
	.finally(async () => {
		printSummary();

		if (ws) {
			try {
				if (ws.readyState === WebSocket.OPEN) {
					ws.close();
				}
			} catch {
				// noop
			}
		}

		if (workerProcess) {
			workerProcess.kill("SIGTERM");
		}

		await prisma.$disconnect();
	});