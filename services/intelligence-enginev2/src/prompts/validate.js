// src/prompts/validate.js
function buildValidatePrompt(code, findings) {
    return `
You are a strict code validator.

Original Code:
${code}

Detected Findings:
${JSON.stringify(findings, null, 2)}

Task:
- Remove findings not directly supported by code.
- Remove speculative issues.
- Remove incorrect line ranges.
- Do NOT add new findings.

Return ONLY valid JSON:
{
  "findings": [...]
}
`;
}

export { buildValidatePrompt };
