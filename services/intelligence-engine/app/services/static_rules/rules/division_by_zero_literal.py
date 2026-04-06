"""Detects division or modulo by literal zero."""
import re
from app.domain.issue import Issue
from ..base_rule import StaticRule


class DivisionByZeroLiteralRule(StaticRule):
    @property
    def name(self) -> str:
        return "division_by_zero_literal"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        # Matches / 0 or % 0 (division/modulo by literal zero), avoiding comments
        div_zero = re.compile(r"(?<![/\*])\/\s*0\b")
        mod_zero = re.compile(r"%\s*0\b")

        for i, line in enumerate(lines):
            if div_zero.search(line):
                issues.append(
                    Issue(
                        type="division_by_zero",
                        severity="critical",
                        line=i + 1,
                        message="Division by literal zero detected. This causes undefined behavior.",
                        confidence="high",
                        source="static_rule",
                    )
                )
            if mod_zero.search(line):
                issues.append(
                    Issue(
                        type="modulo_by_zero",
                        severity="critical",
                        line=i + 1,
                        message="Modulo by literal zero detected. This causes undefined behavior.",
                        confidence="high",
                        source="static_rule",
                    )
                )

        return issues
