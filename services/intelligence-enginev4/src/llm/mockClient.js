export async function mockLLMCodeReview({ language, code, mode, prompt }) {
    // Mocked LLM result so API contract is stable until real provider integration.
    const lineCount = code.split(/\r?\n/).length;

    return {
        summary: {
            risk_level: lineCount > 120 ? "medium" : "low",
            overall_quality: lineCount > 120 ? 72 : 84,
        },
        findings: [
            {
                line: 1,
                category: "maintainability",
                severity: mode === "full" ? "medium" : "low",
                issue: `Initial ${language} scan found opportunities to improve structure.`,
                why_it_matters:
                    "Consistent structure and naming reduce onboarding time and defects.",
                hint: "Start by extracting repeated logic into small functions.",
                guided_fix:
                    mode === "full"
                        ? "Refactor large blocks into dedicated helpers and add clear function names."
                        : "Identify one repeated block and extract it into a helper function first.",
            },
        ],
        meta: {
            provider: "mock",
            promptSize: prompt.length,
        },
    };
}
