import { spawn } from "node:child_process";

const defaultServices = [
	{ id: "gateway", workspace: "./services/gateway" },
	{ id: "auth", workspace: "./auth" },
	{ id: "analyzer", workspace: "./services/analyzer-service" },
	{
		id: "intelligence-enginev3",
		workspace: "./services/intelligence-enginev3",
		env: {
			PORT:
				process.env.MENTICODE_SERVICE_INTELLIGENCE_ENGINEV3_PORT ||
				process.env.IEV3_PORT ||
				"4003",
		},
	},
];

const serviceArg = process.env.SERVICES || process.env.SERVICE || "";
const command = (process.env.CMD || process.argv[2] || "dev").trim(); // dev | start | any script name

if (command === "--help" || command === "-h") {
	console.log(`[run-all] usage:
  npm run dev:all
  npm run start:all

  # Run only some services (comma-separated ids)
  SERVICES=gateway,auth node scripts/run-all.mjs dev

  # Run a different script name (any workspace script)
  node scripts/run-all.mjs start

Known service ids: ${defaultServices.map((s) => s.id).join(", ")}
`);
	process.exit(0);
}

const selected =
	serviceArg.trim().length === 0
		? defaultServices
		: serviceArg
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
				.map((id) => {
					const svc = defaultServices.find((x) => x.id === id);
					if (!svc) {
						const known = defaultServices.map((x) => x.id).join(", ");
						throw new Error(`Unknown service '${id}'. Known: ${known}`);
					}
					return svc;
				});

const children = [];
let shuttingDown = false;

const prefixLines = (prefix, chunk) => {
	const text = chunk.toString("utf8");
	const lines = text.split(/\r?\n/);
	// Keep trailing newline behavior stable
	return lines.map((l, i) => (i === lines.length - 1 && l === "" ? "" : `[${prefix}] ${l}`)).join("\n");
};

function runService({ id, workspace, env: serviceEnv = {} }) {
	// Use npm workspaces by path so names don't matter.
	const childEnv = { ...process.env, ...serviceEnv };
	const child =
		process.platform === "win32"
			? spawn("cmd.exe", ["/d", "/s", "/c", `npm run -w ${workspace} ${command}`], {
					stdio: ["ignore", "pipe", "pipe"],
					env: childEnv,
			  })
			: spawn("npm", ["run", "-w", workspace, command], {
					stdio: ["ignore", "pipe", "pipe"],
					env: childEnv,
			  });

	child.stdout.on("data", (d) => process.stdout.write(prefixLines(id, d)));
	child.stderr.on("data", (d) => process.stderr.write(prefixLines(id, d)));

	child.on("exit", (code, signal) => {
		if (shuttingDown) return;
		// If any service exits unexpectedly, stop everything (helps in dev).
		const label = signal ? `signal ${signal}` : `code ${code}`;
		console.error(`[run-all] '${id}' exited (${label}). Stopping others...`);
		shutdown(code ?? 1);
	});

	children.push({ id, child });
}

function shutdown(exitCode = 0) {
	if (shuttingDown) return;
	shuttingDown = true;

	for (const { child } of children) {
		// Try graceful first
		try {
			child.kill("SIGINT");
		} catch {
			// ignore
		}
	}

	// Hard kill after a short grace period
	setTimeout(() => {
		for (const { child } of children) {
			try {
				// SIGKILL isn't supported on Windows; fallback to default kill there.
				child.kill(process.platform === "win32" ? undefined : "SIGKILL");
			} catch {
				// ignore
			}
		}
		process.exit(exitCode);
	}, Number(process.env.KILL_AFTER_MS || 2500));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(
	`[run-all] starting: ${selected.map((s) => s.id).join(", ")} (script='${command}')`
);
console.log(
	`[run-all] tip: set SERVICES=auth,gateway or run "node scripts/run-all.mjs start"`
);

for (const svc of selected) runService(svc);

