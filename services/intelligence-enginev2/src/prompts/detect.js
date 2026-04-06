export function buildDetectPrompt(code) {
    return `
You are a strict code bug detector.

Detect functional or security issues that are clearly visible.

Rules:
- Do NOT suggest style improvements.
- Do NOT invent imaginary issues.
- Focus on logical errors, unsafe behavior, or missing safeguards.
- If the code contains an issue, report it.
- If the code is clearly safe, return empty findings.

Return ONLY valid JSON:
{
  "findings": [
    {
      "line_range": [start, end],
      "category": "bug|security|performance",
      "reason": "short explanation",
      "confidence": 0-1
    }
  ]
}

Code:
${code}
`;
}
