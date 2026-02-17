import re
from ..base_rule import StaticRule
from app.domain.issue import Issue

class AssignmentInConditionRule(StaticRule):

    @property
    def name(self):
        return "assignment_in_condition"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines, start=1):

            match = re.search(r"(if|while)\s*\((.*?)\)", line)
            if not match:
                continue

            condition = match.group(2)

            # detect single '=' not part of comparison
            if re.search(r"(?<![=!<>])=(?!=)", condition):
                issues.append(
                    Issue(
                        type="assignment_in_condition",
                        severity="major",
                        line=i,
                        message="Assignment used inside condition. Did you mean '=='?",
                        confidence="high"
                    )
                )

        return issues
