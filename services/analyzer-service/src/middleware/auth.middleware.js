import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = authHeader.slice(7).trim();

	try {
		const payload = jwt.verify(token, JWT_SECRET);

		if (!payload?.sub) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		req.user = {
			id: payload.sub,
			role: payload.role,
			plan: payload.plan,
		};

		return next();
	} catch {
		return res.status(401).json({ error: "Unauthorized" });
	}
}

export function requireAdmin(req, res, next) {
	if (!req.user) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (req.user.role !== "admin") {
		return res.status(403).json({ error: "Forbidden" });
	}

	return next();
}
