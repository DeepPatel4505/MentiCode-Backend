"""Detects pointer dereference without null check after malloc/new."""
import re
from app.domain.issue import Issue
from ..base_rule import StaticRule


class NullPointerDereferenceRiskRule(StaticRule):
    @property
    def name(self) -> str:
        return "null_pointer_dereference_risk"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            # Match: var = malloc(...) or var = (Type*)malloc(...)
            malloc_match = re.search(
                r"(\w+)\s*=\s*(?:\([^)]*\)\s*)?(?:malloc|calloc|realloc)\s*\(", line
            )
            new_match = re.search(r"(\w+)\s*=\s*new\s+", line)

            if malloc_match or new_match:
                var = (malloc_match or new_match).group(1)
                # Check next 5 lines for dereference without null check
                block = "\n".join(lines[i : i + 6])
                if re.search(
                    rf"(?<!\*)\*{re.escape(var)}\b|\b{re.escape(var)}\s*->", block
                ):
                    check_block = "\n".join(lines[i : i + 6])
                    has_check = bool(
                        re.search(
                            rf"if\s*\(\s*{re.escape(var)}\s*[\)!=]|"
                            rf"{re.escape(var)}\s*!=\s*nullptr|"
                            rf"{re.escape(var)}\s*!=\s*NULL|"
                            rf"nullptr\s*!=\s*{re.escape(var)}|"
                            rf"NULL\s*!=\s*{re.escape(var)}",
                            check_block,
                            re.IGNORECASE,
                        )
                    )
                    if not has_check:
                        issues.append(
                            Issue(
                                type="possible_null_dereference",
                                severity="major",
                                line=i + 1,
                                message=f"Pointer '{var}' from malloc/new may be dereferenced without null check.",
                                confidence="low",
                                source="static_rule",
                            )
                        )

        return issues
