from app.domain.issue import Issue
from ..base_rule import StaticRule

class LoopBoundRiskRule(StaticRule):

    @property
    def name(self):
        return "loop_bound_risk"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            if "for" in line and "<=" in line:
                issues.append(
                    Issue(
                        type="loop_bound_risk",
                        severity="major",
                        line=i+1,
                        message="Loop uses '<=' bound. Check for off-by-one error.",
                        confidence="medium"
                    )
                )

        return issues
