import { getHealthStatus } from "../services/health.service.js";

export function healthController(req, res) {
    return res.status(200).json(getHealthStatus());
}
