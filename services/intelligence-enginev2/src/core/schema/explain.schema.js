// src/core/schema/explain.schema.js
import { z } from "zod";

const ExplainFindingSchema = z.object({
    line_range: z
        .tuple([z.number().int().min(1), z.number().int().min(1)])
        .refine(([start, end]) => start <= end),

    category: z.enum(["bug", "security", "performance"]),

    severity: z.enum(["minor", "major", "critical"]),

    issue: z.string().min(5).max(500),

    why_it_matters: z.string().min(10).max(1500),

    hint: z.string().min(5).max(500),

    guided_fix: z.string().min(5).max(2000),

    confidence: z.number().min(0).max(1),
});

const ExplainOutputSchema = z.object({
    findings: z.array(ExplainFindingSchema).max(10),
});

export { ExplainFindingSchema, ExplainOutputSchema };
