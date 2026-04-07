import jwt from "jsonwebtoken";
import { ApiError } from "@menticode/shared";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("Unauthorized"));
    }

    const token = authHeader.slice(7).trim();

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload?.id) {
            return next(ApiError.unauthorized("Unauthorized"));
        }

        req.user = {
            id: payload.id,
            role: payload.role,
            plan: payload.plan,
        };

        return next();
    } catch {
        return next(ApiError.unauthorized("Invalid or expired token"));
    }
}

export function requireAdmin(req, res, next) {
    if (!req.user) {
        return next(ApiError.unauthorized("Unauthorized"));
    }

    if (req.user.role !== "admin") {
        return next(ApiError.forbidden("Forbidden"));
    }

    return next();
}
