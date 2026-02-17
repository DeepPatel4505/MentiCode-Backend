// src/core/schema/final.schema.js
import { z } from "zod";
import { ExplainFindingSchema } from "./explain.schema.js";

const FinalOutputSchema = z.object({
    version: z.literal("v2"),

    summary: z.object({
        risk_level: z.enum(["low", "medium", "high"]),
        overall_quality: z.number().min(0).max(100),
    }),

    findings: z.array(ExplainFindingSchema).max(10),
});

export { FinalOutputSchema };
