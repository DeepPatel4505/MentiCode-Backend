from pydantic import BaseModel
from typing import Optional, List


class Issue(BaseModel):
    type: str
    severity: str  # critical | major | minor
    line: Optional[int] = None
    message: str
    confidence: Optional[str] = None
    # Optional origin of the issue, e.g. "compiler" or "static_rule"
    source: Optional[str] = None


class AnalysisResult(BaseModel):
    bundleId: str
    issues: List[Issue]
