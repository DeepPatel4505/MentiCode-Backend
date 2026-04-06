"""Service to generate LLM explanations from analysis results."""
import json
import re
from typing import Optional

from app.domain.issue import AnalysisResult, Issue
from app.domain.explanation import LLMExplanation, ExplanationSummary, Finding
from app.services.llm import create_llm_client
from app.utils.logger import logger


EXPLANATION_PROMPT = """
You are a strict programming mentor reviewing C++ code.

Your task:

* Prioritize real execution errors and logical bugs first.
* Ignore style, micro-optimizations, and advanced security unless no critical or major bugs exist.
* Report findings for detected issues.
* If logical or conceptual issues are detected, report them as "design" category.
* If no issues are detected, do not report any findings.
* Be precise, technical, and concise.
* If critical execution issues exist, report ONLY those.
* Address each unique issue only once (do not duplicate overlapping findings).
* Do not include full corrected code.

Analyze the following code:

```cpp
<<<code>>>
```

If available, consider the following detected issues:

```json
<<<issues_json>>>
```

Produce a JSON response with this EXACT structure (no markdown, no explanations, no extra text):

```json
{
"summary": {
"risk_level": "low" | "medium" | "high",
"overall_quality": 0
},
"findings": [
{
"category": "bug" | "design" | "security" | "performance" | "style",
"severity": "minor" | "major" | "critical",
"line_range": [start_line, end_line],
"issue": "brief technical description",
"why_it_matters": "clear impact explanation",
"hint": "concrete technical hint",
"guided_fix": "step-by-step technical correction"
}
],
"final_solution": null
}
```

Rules:

* risk_level must reflect the highest severity finding.
* overall_quality must be an integer between 0 and 100.
* Map each detected issue to one finding where applicable.
* Output ONLY valid raw JSON.
* Do NOT wrap in markdown.
* Do NOT include commentary outside JSON.

"""


def _issues_to_dicts(issues: list[Issue]) -> list[dict]:
    return [
        {
            "type": i.type,
            "severity": i.severity,
            "line": i.line,
            "message": i.message,
            "source": i.source or "unknown",
        }
        for i in issues
    ]


def _extract_json(text: str) -> str:
    """Extract JSON object from LLM response (handles markdown code blocks)."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    # Try to find { ... }
    start = text.find("{")
    if start >= 0:
        depth = 0
        for i, c in enumerate(text[start:], start):
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start: i + 1]
    return text


async def explain(
    analysis: AnalysisResult,
    code: str,
    client=None,
) -> LLMExplanation:
    """Generate LLM explanation from analysis result."""
    if not analysis.issues:
        return LLMExplanation(
            summary=ExplanationSummary(
                risk_level="low", overall_quality=100.0),
            findings=[],
            final_solution=None,
        )

    issues_json = json.dumps(_issues_to_dicts(analysis.issues), indent=2)
    prompt = EXPLANATION_PROMPT.replace("<<<code>>>", code).replace("<<<issues_json>>>", issues_json)

    llm = client or create_llm_client()
    raw = await llm.complete(prompt)

    json_str = _extract_json(raw)
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.warning(f"LLM returned invalid JSON: {e}")
        return LLMExplanation(
            summary=ExplanationSummary(risk_level="high", overall_quality=0.0),
            findings=[],
            final_solution=None,
        )

    try:
        return LLMExplanation(**data)
    except Exception as e:
        logger.warning(f"LLM response schema validation failed: {e}")
        # Fallback: build minimal explanation from raw issues
        severity = max((i.severity for i in analysis.issues), key=lambda s: {
                       "critical": 3, "major": 2, "minor": 1}.get(s, 0))
        risk = "high" if severity == "critical" else (
            "medium" if severity == "major" else "low")

        def _norm_sev(s: str) -> str:
            return s if s in ("minor", "major", "critical") else "major"

        findings = [
            Finding(
                category="bug",
                severity=_norm_sev(i.severity),
                line_range=[i.line, i.line] if i.line else [0, 0],
                issue=i.message,
                why_it_matters="",
                hint="",
                guided_fix="",
            )
            for i in analysis.issues
        ]
        return LLMExplanation(
            summary=ExplanationSummary(risk_level=risk, overall_quality=0.0),
            findings=findings,
            final_solution=None,
        )
