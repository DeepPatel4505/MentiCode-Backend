import re
from app.domain.issue import Issue
from ..base_rule import StaticRule


class VectorIndexWithoutResizeRule(StaticRule):

    @property
    def name(self):
        return "vector_index_without_resize"

    def check(self, code: str):
        issues = []

        lines = code.split("\n")

        # Step 1: find vector declarations
        vector_vars = {}

        for i, line in enumerate(lines):
            # Match: vector<int> v;
            match_no_size = re.search(r"vector<[^>]+>\s+(\w+)\s*;", line)
            if match_no_size:
                var_name = match_no_size.group(1)
                vector_vars[var_name] = {
                    "decl_line": i + 1,
                    "safe": False,
                }

            # Match: vector<int> v(n);
            match_with_size = re.search(r"vector<[^>]+>\s+(\w+)\s*\(", line)
            if match_with_size:
                var_name = match_with_size.group(1)
                # Mark safe immediately
                vector_vars[var_name] = {
                    "decl_line": i + 1,
                    "safe": True,
                }

        # Step 2: scan for resize or push_back
        for _, line in enumerate(lines):
            for var in vector_vars:
                if re.search(rf"\b{var}\.resize\s*\(", line) or \
                   re.search(rf"\b{var}\.push_back\s*\(", line):
                    vector_vars[var]["safe"] = True

        # Step 3: detect unsafe indexing
        for i, line in enumerate(lines):
            for var, info in vector_vars.items():
                if re.search(rf"\b{var}\s*\[.*\]", line):
                    if not info["safe"]:
                        issues.append(
                            Issue(
                                type="vector_index_without_resize",
                                severity="major",
                                line=i + 1,
                                message=f"Vector '{var}' indexed without resize or size constructor.",
                                confidence="medium",
                                source="static_rule",
                            )
                        )

        return issues
