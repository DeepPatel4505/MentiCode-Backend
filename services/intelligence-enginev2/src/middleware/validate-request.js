/**
 * Validates the request body for POST /analyze.
 */
export function validateAnalyzeRequest(req, res, next) {
    const { code, language } = req.body;

    const errors = [];

    if (code === undefined || code === null) {
        errors.push("'code' is required.");
    } else if (typeof code !== "string") {
        errors.push("'code' must be a string.");
    } else if (code.trim().length === 0) {
        errors.push("'code' must not be empty.");
    }

    if (language !== undefined && typeof language !== "string") {
        errors.push("'language' must be a string when provided.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: true,
            statusCode: 400,
            message: "Invalid request body.",
            details: errors,
        });
    }

    next();
}
