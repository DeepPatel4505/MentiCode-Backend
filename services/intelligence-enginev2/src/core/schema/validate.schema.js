// src/core/schema/validate.schema.js
import { z } from "zod";
import { DetectFindingSchema } from "./detect.schema.js";

const ValidateOutputSchema = z.object({
    findings: z.array(DetectFindingSchema).max(12),
});

export {
    ValidateOutputSchema,
};
