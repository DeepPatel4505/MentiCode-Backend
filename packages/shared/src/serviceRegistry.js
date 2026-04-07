const DEFAULT_HOST = process.env.SERVICE_HOST || "localhost";

const toEnvKey = (serviceName) =>
	`MENTICODE_SERVICE_${String(serviceName).toUpperCase().replace(/[^A-Z0-9]/g, "_")}_PORT`;

const portFromEnv = (serviceName, fallbackPort) => {
	const raw = process.env[toEnvKey(serviceName)];
	if (!raw) return fallbackPort;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : fallbackPort;
};

/**
 * Central place to define where each service lives.
 * - Ports can be overridden per-service via env:
 *   - MENTICODE_SERVICE_AUTH_PORT=4000
 *   - MENTICODE_SERVICE_ANALYZER_PORT=4001
 */
export const serviceRegistry = Object.freeze({
	auth: Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("auth", 4000),
	}),
	analyzer: Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("analyzer", 3000),
	}),
	"intelligence-enginev2": Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("intelligence-enginev2", 4002),
	}),
	"intelligence-enginev3": Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("intelligence-enginev3", 4003),
	}),
	"intelligence-enginev4": Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("intelligence-enginev4", 4004),
	}),
	notification: Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("notification", 4005),
	}),
	github: Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("github", 4006),
	}),
	course: Object.freeze({
		host: DEFAULT_HOST,
		port: portFromEnv("course", 4007),
	}),
});

export function getServiceTarget(serviceName) {
	const key = String(serviceName || "").trim();
	const svc = serviceRegistry[key];
	if (!svc) {
		const known = Object.keys(serviceRegistry).sort().join(", ");
		throw new Error(`Unknown service '${key}'. Known services: ${known}`);
	}

	return `http://${svc.host}:${svc.port}`;
}

