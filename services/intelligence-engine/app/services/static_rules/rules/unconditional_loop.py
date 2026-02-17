from app.domain.issue import Issue
from ..base_rule import StaticRule

class UnconditionalLoopRule(StaticRule):

    @property
    def name(self):
        return "unconditional_loop"

    def check(self, code: str):
        issues = []
        lines = code.split("\n")

        for i, line in enumerate(lines):
            if "while(true)" in line.replace(" ", ""):
                # scan next 10 lines for break or return
                block = "\n".join(lines[i:i+10])
                if "break" not in block and "return" not in block:
                    issues.append(
                        Issue(
                            type="unconditional_loop",
                            severity="major",
                            line=i+1,
                            message="Unconditional loop detected. Ensure termination condition exists.",
                            confidence="medium"
                        )
                    )

        return issues
