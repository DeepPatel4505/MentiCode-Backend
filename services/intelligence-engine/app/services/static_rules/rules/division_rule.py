import code
from app.domain.issue import Issue
from ..base_rule import StaticRule
import re


class DivisionByVariableRule(StaticRule):

    @property
    def name(self):
        return "division_without_check"

    def check(self, code: str):
        pattern = r"(?<!/)/(?!/)"  # matches / but not //
        matches = re.finditer(pattern, code)
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            if "/" in line and "0" not in line:
                issues.append(
                    Issue(
                        type="division_without_check",
                        severity="major",
                        line=i+1,
                        message="Division detected. Ensure divisor is not zero.",
                        confidence="low"
                    )
                )

        return issues
