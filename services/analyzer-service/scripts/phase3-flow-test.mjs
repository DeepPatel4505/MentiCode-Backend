import "dotenv/config";
import { spawn } from "node:child_process";
import jwt from "jsonwebtoken";
import prisma from "../src/config/prisma.js";

const BASE_URL = process.env.ANALYSIS_SERVICE_URL || `http://localhost:${process.env.PORT || 4000}`;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const START_LOCAL_WORKER = process.env.START_LOCAL_WORKER !== "false";
const POLL_INTERVAL_MS = Number(process.env.PHASE3_POLL_INTERVAL_MS || 2000);
const POLL_TIMEOUT_MS = Number(process.env.PHASE3_POLL_TIMEOUT_MS || 120000);

let workerProcess = null;

function logStep(title, payload) {
	console.log(`\n=== ${title} ===`);
	console.log(JSON.stringify(payload, null, 2));
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

async function pollJobStatus(token, jobId) {
	const startedAt = Date.now();
	let lastStatus = null;

	while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
		const status = await requestJson(`/api/v1/analysis/jobs/${jobId}`, "GET", token);
		lastStatus = status;
		logStep("Job status poll", status);

		if (status.status === "completed" || status.status === "failed") {
			return status;
		}

		await wait(POLL_INTERVAL_MS);
	}

	throw new Error(`Polling timed out after ${POLL_TIMEOUT_MS}ms. Last status: ${JSON.stringify(lastStatus)}`);
}

async function run() {
	console.log(`Using analyzer service: ${BASE_URL}`);
	console.log(`Start local worker: ${START_LOCAL_WORKER}`);

	if (START_LOCAL_WORKER) {
		workerProcess = startLocalWorker();
		await wait(1500);
	}

	const userId = "55555555-5555-5555-5555-555555555555";
	const token = jwt.sign(
		{
			sub: userId,
			role: "student",
			plan: "free",
		},
		JWT_SECRET,
		{ expiresIn: "1h" }
	);

	const code = "function add(a,b){return a+b;}\nconsole.error(add(3,4));";
	const createPayload = {
		name: "Phase3 Queue Flow Playground",
		sourceType: "upload",
		files: [
			{
				name: "app.js",
				language: "javascript",
				storagePath: `inline://${encodeURIComponent(code)}`,
			},
		],
	};

	const createdPlayground = await requestJson("/api/v1/analysis/playgrounds", "POST", token, createPayload);
	logStep("Create playground", createdPlayground);

	const listedFiles = await requestJson(`/api/v1/analysis/playgrounds/${createdPlayground.id}/files`, "GET", token);
	logStep("Upload file (verified by list files)", listedFiles);

	if (!Array.isArray(listedFiles) || listedFiles.length === 0) {
		throw new Error("No files created for playground");
	}

	const fileId = listedFiles[0].id;
	const analyzeResponse = await requestJson(
		`/api/v1/analysis/playgrounds/${createdPlayground.id}/files/${fileId}/analyze`,
		"POST",
		token
	);
	logStep("Analyze file (enqueue response)", analyzeResponse);

	if (analyzeResponse.status !== "pending" && analyzeResponse.status !== "running") {
		throw new Error(`Expected pending/running status after enqueue, got ${analyzeResponse.status}`);
	}

	const finalStatus = await pollJobStatus(token, analyzeResponse.jobId);

	if (finalStatus.status !== "completed") {
		throw new Error(`Expected completed job, got ${finalStatus.status}`);
	}

	const resultResponse = await requestJson(`/api/v1/analysis/jobs/${analyzeResponse.jobId}/result`, "GET", token);
	logStep("Result endpoint response", resultResponse);

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

	logStep("DB verification (result stored + job completed)", {
		job: jobInDb,
		result: resultInDb,
	});

	if (!resultInDb) {
		throw new Error("Result was not stored in DB");
	}

	console.log("\n✅ Phase 3 queue flow test passed");
}

run()
	.catch((error) => {
		console.error("\n❌ Phase 3 queue flow test failed");
		console.error(error.message);
		process.exitCode = 1;
	})
	.finally(async () => {
		if (workerProcess) {
			workerProcess.kill("SIGTERM");
		}
		await prisma.$disconnect();
	});
