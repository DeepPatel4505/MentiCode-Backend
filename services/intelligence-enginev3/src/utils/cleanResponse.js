const cleanResponse = (llmResponse) => {
    if (!llmResponse || typeof llmResponse !== "string") {
        throw new Error("Invalid LLM response type");
    }

    // 1️⃣ Remove markdown fences if present
    const cleanedText = llmResponse
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    let parsed;
    try {
        // 2️⃣ Parse JSON
        parsed = JSON.parse(cleanedText);
    } catch (err) {
        throw new Error("LLM returned invalid JSON");
    }

    // 3️⃣ Normalize response (frontend contract enforcement)
    return {
        summary: {
            risk_level: parsed.summary?.risk_level ?? "low",
            overall_quality:
                typeof parsed.summary?.overall_quality === "number"
                    ? parsed.summary.overall_quality
                    : 0,
        },

        findings: Array.isArray(parsed.findings)
            ? parsed.findings.map((f) => ({
                    category: f.category ?? "bug",
                    severity: f.severity ?? "minor",
                    line_range: Array.isArray(f.line_range)
                        ? f.line_range
                        : [0, 0],
                    issue: f.issue ?? "",
                    why_it_matters: f.why_it_matters ?? "",
                    hint: f.hint ?? "",
                    guided_fix: f.guided_fix ?? "",
                    full_fix: f.full_fix ?? null,
                }))
            : [],
    };
};

export default cleanResponse;
