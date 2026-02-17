function buildExplainPrompt(code, findings) {
  return `
You are a code explanation engine.

IMPORTANT:
- You must preserve "line_range" and "category" exactly as provided.
- Do NOT remove or modify them.
- For each finding, enrich it with explanation details.

Validated Findings:
${JSON.stringify(findings, null, 2)}

For each finding, return:
{
  "line_range": [start, end],
  "category": "bug|security|performance",
  "severity": "minor|major|critical",
  "issue": "...",
  "why_it_matters": "...",
  "hint": "...",
  "guided_fix": "...",
  "confidence": 0-1
}

Return ONLY valid JSON:
{
  "findings": [...]
}
`;
}

export { buildExplainPrompt };
