import { reviewCode } from "../services/codeReviewService.js";

const MAX_CODE_LENGTH = 50_000; // safety limit to avoid extremely large payloads

export const codeReviewController = async (req, res, next) => {
    try {
        const { language, code } = req.body || {};
        console.log("Received code review request:", { language, codeLength: code ? code.length : 0 });

        if (!language || !code) {
            return res.status(400).json({
                error: "Missing required fields: language and code",
            });
        }

        if (typeof code !== "string" || typeof language !== "string") {
            return res.status(400).json({
                error: "Invalid payload: language and code must be strings",
            });
        }

        if (code.length > MAX_CODE_LENGTH) {
            return res.status(413).json({
                error: "Code payload too large",
            });
        }

        const result = await reviewCode({ language, code });
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
};

