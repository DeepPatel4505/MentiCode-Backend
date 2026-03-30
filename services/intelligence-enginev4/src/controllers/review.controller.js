import { runCodeReview } from "../services/review.service.js";
import { recordRequest } from "../utils/metrics.js";

const MAX_CODE_LENGTH = 50_000;
const ALLOWED_MODES = new Set(["guided", "full"]);

export async function codeReviewController(req, res, next) {
    try {
        const { language, code, mode } = req.body ?? {};

        if (typeof language !== "string" || language.trim().length === 0) {
            const err = new Error("Field 'language' is required and must be a non-empty string.");
            err.statusCode = 400;
            throw err;
        }

        if (typeof code !== "string" || code.trim().length === 0) {
            const err = new Error("Field 'code' is required and must be a non-empty string.");
            err.statusCode = 400;
            throw err;
        }

        if (code.length > MAX_CODE_LENGTH) {
            const err = new Error("Field 'code' exceeds max length of 50000 characters.");
            err.statusCode = 400;
            throw err;
        }

        if (mode !== undefined && !ALLOWED_MODES.has(mode)) {
            const err = new Error("Field 'mode' must be either 'guided' or 'full'.");
            err.statusCode = 400;
            throw err;
        }

        const review = await runCodeReview({
            language: language.trim(),
            code,
            mode: mode ?? "guided",
            requestId: req.requestId,
        });

        recordRequest({
            cached: review.meta?.cached ?? false,
            latencyMs: review.meta?.latency_ms ?? 0,
        });

        return res.status(200).json(review);
    } catch (error) {
        return next(error);
    }
}
