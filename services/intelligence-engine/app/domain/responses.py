"""API response models."""
from pydantic import BaseModel
from typing import Optional, List, Any
from app.domain.issue import AnalysisResult


class AnalyzeWithExplanationResponse(BaseModel):
    """Response for /analyze/explain endpoint - matches LLM explanation schema."""
    bundleId: str
    analysis: AnalysisResult
    summary: dict  # { risk_level, overall_quality }
    findings: List[dict]  # [{ category, severity, line_range, issue, why_it_matters, hint, guided_fix }]
    final_solution: Optional[str] = None
