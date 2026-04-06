import { GoogleGenAI } from "@google/genai";
import config from "../config/config.js";

// if (!process.env.GOOGLE_GENAI_API_KEY) {
//     throw new Error("GOOGLE_GENAI_API_KEY is missing");
// }

const buildTimeoutPromise = (timeoutMs) =>
    new Promise((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            const err = new Error("LLM request timed out");
            err.statusCode = 504;
            err.publicMessage = "Code review service timed out";
            reject(err);
        }, timeoutMs);
    });

export const myLLMClient = async ({
    model,
    prompt,
    temperature = 0,
    timeoutMs = config.llm.timeoutMs,
}) => {
    if (!prompt || typeof prompt !== "string") {
        const err = new Error("Prompt must be a non-empty string");
        err.statusCode = 400;
        err.publicMessage = "Invalid code review request";
        throw err;
    }

    const genAI = new GoogleGenAI({
        apiKey: config.llm.apiKey,
    });

    const llmPromise = genAI.models.generateContent({
        model: model || config.llm.model,
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }],
            },
        ],
        config: {
            temperature,
        },
    });

    let response;
    try {
        response = await Promise.race([llmPromise, buildTimeoutPromise(timeoutMs)]);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 502;
            err.publicMessage = "Code review service temporarily unavailable";
        }
        throw err;
    }

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        const err = new Error("Empty LLM response");
        err.statusCode = 502;
        err.publicMessage = "Received empty response from code analysis engine";
        throw err;
    }

    return text; // return STRING, not SDK object
};
