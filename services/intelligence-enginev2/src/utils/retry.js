import { runModel } from "../core/model-client.js";

export async function safeRun(prompt, schema) {
    for (let i = 0; i < 2; i++) {
        const raw = await runModel(prompt);
        try {
            console.log("Raw model output:", raw);
            const parsed = JSON.parse(raw);
            return schema.parse(parsed);
        } catch {
            continue;
        }
    }
    return { findings: [] };
}
