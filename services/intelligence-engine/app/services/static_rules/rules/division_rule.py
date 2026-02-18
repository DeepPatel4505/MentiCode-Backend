import re
from app.domain.issue import Issue
from ..base_rule import StaticRule


class DivisionByVariableRule(StaticRule):

    @property
    def name(self):
        return "division_without_check"

    def check(self, code: str):
        # matches / but not // comments
        pattern = r"(?<!/)/(?!/)"
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            if re.search(pattern, line) and "0" not in line:
                issues.append(
                    Issue(
                        type="division_without_check",
                        severity="major",
                        line=i+1,
                        message="Division detected. Ensure divisor is not zero.",
                        confidence="low",
                        source="static_rule",
                    )
                )

        return issues
