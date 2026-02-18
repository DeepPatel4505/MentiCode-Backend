"""LLM explanation response schema."""
from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal, Any


class ExplanationSummary(BaseModel):
    risk_level: Literal["low", "medium", "high"] = "medium"
    overall_quality: float = 0.0


class Finding(BaseModel):
    category: Literal["bug", "design", "security", "performance", "style"] = "bug"
    severity: Literal["minor", "major", "critical"] = "major"
    line_range: List[int] = []
    issue: str = ""
    why_it_matters: str = ""
    hint: str = ""
    guided_fix: str = ""

    @field_validator("line_range", mode="before")
    @classmethod
    def ensure_line_range(cls, v: Any) -> List[int]:
        if isinstance(v, list) and len(v) >= 1:
            start = int(v[0]) if v else 0
            end = int(v[1]) if len(v) > 1 else start
            return [start, end]
        return [0, 0]


class LLMExplanation(BaseModel):
    """Output schema for LLM code analysis explanation."""
    summary: ExplanationSummary = ExplanationSummary()
    findings: List[Finding] = []
    final_solution: Optional[str] = None
