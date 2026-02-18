"""Detects for(;;) or for(;1;) infinite loop without break/return."""
from app.domain.issue import Issue
from ..base_rule import StaticRule


class ForEverLoopRule(StaticRule):
    @property
    def name(self) -> str:
        return "for_ever_loop"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            normalized = line.replace(" ", "")
            if "for(;;)" in normalized or "for(;1;)" in normalized or "for(;true;)" in normalized:
                block = "\n".join(lines[i : i + 15])
                if "break" not in block and "return" not in block:
                    issues.append(
                        Issue(
                            type="for_ever_loop",
                            severity="major",
                            line=i + 1,
                            message="Infinite for loop (for(;;)) detected. Ensure break or return exists for termination.",
                            confidence="medium",
                            source="static_rule",
                        )
                    )

        return issues
