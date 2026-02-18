"""Detects potential array/vector index out-of-bounds patterns."""
import re
from app.domain.issue import Issue
from ..base_rule import StaticRule


class ArrayBoundsRiskRule(StaticRule):
    @property
    def name(self) -> str:
        return "array_bounds_risk"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            # Negative array index: arr[-1], arr[-n], arr[i-1] when i could be 0
            if re.search(r"\[\s*-\s*\d+\s*\]", line):
                issues.append(
                    Issue(
                        type="array_bounds_risk",
                        severity="major",
                        line=i + 1,
                        message="Negative array index detected. Causes undefined behavior.",
                        confidence="high",
                        source="static_rule",
                    )
                )
            # Index with size/length variable - arr[size] is one past end
            match = re.search(r"\b(\w+)\s*\[\s*(\w+)\s*\]", line)
            if match:
                arr, idx = match.group(1), match.group(2)
                if idx.lower() in ("size", "length", "count"):
                    # arr[size] - common off-by-one error
                    issues.append(
                        Issue(
                            type="array_bounds_risk",
                            severity="major",
                            line=i + 1,
                            message=f"Index '{idx}' may be one past valid range. Valid indices are 0 to {idx}-1.",
                            confidence="medium",
                            source="static_rule",
                        )
                    )

        return issues
