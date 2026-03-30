import { generateProjectSummary } from "../services/project.service.js";
import { recordRequest } from "../utils/metrics.js";

const MAX_FILES = 50;
const MAX_CODE_LENGTH = 50_000;

export async function projectSummaryController(req, res, next) {
    try {
        const { files } = req.body ?? {};

        if (!Array.isArray(files)) {
            const err = new Error(
                "Field 'files' is required and must be a non-empty array.",
            );
            err.statusCode = 400;
            throw err;
        }

        if (files.length === 0) {
            const err = new Error("At least one file is required for project summary.");
            err.statusCode = 400;
            throw err;
        }

        if (files.length > MAX_FILES) {
            const err = new Error(`Maximum ${MAX_FILES} files allowed per request.`);
            err.statusCode = 400;
            throw err;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (typeof file !== "object" || file === null) {
                const err = new Error(`File ${i}: must be an object.`);
                err.statusCode = 400;
                throw err;
            }

            if (typeof file.language !== "string" || file.language.trim().length === 0) {
                const err = new Error(
                    `File ${i}: language is required and must be a non-empty string.`,
                );
                err.statusCode = 400;
                throw err;
            }

            if (typeof file.code !== "string" || file.code.trim().length === 0) {
                const err = new Error(
                    `File ${i}: code is required and must be a non-empty string.`,
                );
                err.statusCode = 400;
                throw err;
            }

            if (file.code.length > MAX_CODE_LENGTH) {
                const err = new Error(
                    `File ${i}: code exceeds max length of ${MAX_CODE_LENGTH} characters.`,
                );
                err.statusCode = 400;
                throw err;
            }
        }

        const summary = await generateProjectSummary({
            files,
            mode: "guided",
            requestId: req.requestId,
        });

        recordRequest({
            cached: false,
            latencyMs: 0,
        });

        return res.status(200).json(summary);
    } catch (error) {
        return next(error);
    }
}
