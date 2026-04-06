import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization;
	console.log("Auth Header:", authHeader);

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = authHeader.slice(7).trim();
	console.log("Extracted Token:", token);

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		console.log("Decoded JWT Payload:", payload);
		if (!payload?.id) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		req.user = {
			id: payload.id,
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
