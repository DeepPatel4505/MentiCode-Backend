import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { getServiceTarget, serviceRegistry, logger } from "@menticode/shared";

const app = express();

const PORT = Number(process.env.GATEWAY_PORT || process.env.PORT || 8080);
const NODE_ENV = process.env.NODE_ENV || "development";

app.disable("x-powered-by");
app.use(express.json({ limit: process.env.BODY_LIMIT || "2mb" }));

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || true,
		credentials: true,
	})
);

app.get("/health", (_req, res) => {
	res.json({
		ok: true,
		service: "gateway",
		env: NODE_ENV,
		services: Object.fromEntries(
			Object.entries(serviceRegistry).map(([name, cfg]) => [name, { host: cfg.host, port: cfg.port }])
		),
	});
});

const proxyFor = (serviceName, { wsPathRewriteTo } = {}) => {
	const target = getServiceTarget(serviceName);

	return createProxyMiddleware({
		target,
		changeOrigin: true,
		ws: true,
		logLevel: "silent",
		onProxyReq: (proxyReq, req) => {
			logger.http?.info?.({ serviceName, method: req.method, url: req.url, target }, "gateway.proxy");
			proxyReq.setHeader("x-forwarded-host", req.headers.host || "");
			proxyReq.setHeader("x-forwarded-proto", req.protocol);
		},
		onError: (err, req, res) => {
			logger.base.error({ err, serviceName, target, url: req.url }, "gateway.proxy.error");
			if (!res.headersSent) {
				res.status(502).json({ ok: false, error: "Bad Gateway", service: serviceName });
			}
		},
		pathRewrite: (path, req) => {
			if (req.baseUrl?.startsWith("/api/")) {
				const prefix = `/api/${serviceName}`;
				return path.startsWith(prefix) ? path.slice(prefix.length) || "/" : path;
			}
			if (req.baseUrl?.startsWith("/ws/")) {
				return wsPathRewriteTo || "/ws";
			}
			return path;
		},
	});
};

app.use("/api/:service", (req, res, next) => {
	const { service } = req.params;
	try {
		return proxyFor(service)(req, res, next);
	} catch (error) {
		return res.status(404).json({ ok: false, error: String(error.message || error) });
	}
});

app.use("/ws/:service", (req, res, next) => {
	const { service } = req.params;
	try {
		return proxyFor(service, { wsPathRewriteTo: "/ws" })(req, res, next);
	} catch (error) {
		return res.status(404).json({ ok: false, error: String(error.message || error) });
	}
});

app.listen(PORT, () => {
	logger.base.info({ port: PORT, env: NODE_ENV }, "gateway.started");
	logger.base.info({ health: `http://localhost:${PORT}/health` }, "gateway.endpoints");
	logger.base.info(
		{
			examples: {
				auth: `http://localhost:${PORT}/api/auth/`,
				analyzer: `http://localhost:${PORT}/api/analyzer/`,
				analyzerWs: `ws://localhost:${PORT}/ws/analyzer`,
			},
		},
		"gateway.routes"
	);
});

