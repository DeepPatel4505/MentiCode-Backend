from pydantic import BaseModel
from typing import Optional, List


class Issue(BaseModel):
    type: str
    severity: str  # critical | major | minor
    line: Optional[int] = None
    message: str
    confidence: Optional[str] = None


class AnalysisResult(BaseModel):
    bundleId: str
    issues: List[Issue]
