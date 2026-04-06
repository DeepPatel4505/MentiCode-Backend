// src/core/schema/detect.schema.js
import { z } from "zod";

const DetectFindingSchema = z.object({
    line_range: z
        .tuple([z.number().int().min(1), z.number().int().min(1)])
        .refine(([start, end]) => start <= end, {
            message: "Invalid line range",
        }),

    category: z.enum(["bug", "security", "performance"]),

    reason: z.string().min(5).max(300),

    confidence: z.number().min(0).max(1).optional(),
});

const DetectOutputSchema = z.object({
    findings: z.array(DetectFindingSchema).max(12),
});

export { DetectFindingSchema, DetectOutputSchema };
