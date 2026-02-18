"""Detects use of unsafe C string functions (buffer overflow risks)."""
import re
from app.domain.issue import Issue
from ..base_rule import StaticRule


class UnsafeStringFunctionsRule(StaticRule):
    @property
    def name(self) -> str:
        return "unsafe_string_functions"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        # Functions that are unsafe (no bounds checking)
        UNSAFE_FUNCS = [
            ("gets", "gets()", "buffer overflow; use fgets() or std::getline()"),
            ("strcpy", "strcpy()", "no bounds check; use strncpy() or strcpy_s()"),
            ("strcat", "strcat()", "no bounds check; use strncat() or strcat_s()"),
            ("sprintf", "sprintf()", "no bounds check; use snprintf()"),
            ("vsprintf", "vsprintf()", "no bounds check; use vsnprintf()"),
        ]

        for i, line in enumerate(lines):
            for func, display, suggestion in UNSAFE_FUNCS:
                if re.search(rf"\b{re.escape(func)}\s*\(", line):
                    issues.append(
                        Issue(
                            type="unsafe_string_function",
                            severity="major",
                            line=i + 1,
                            message=f"{display} is unsafe: {suggestion}",
                            confidence="high",
                            source="static_rule",
                        )
                    )

        return issues
