from typing import List
from app.domain.issue import Issue
from .registry import RuleRegistry
from .normalizer import remove_comments, remove_preprocessor_lines




class StaticRuleEngine:

    def __init__(self, registry: RuleRegistry):
        self.registry = registry

    def run(self, code: str) -> List[Issue]:
        code = remove_comments(code)
        code = remove_preprocessor_lines(code)
        issues = []

        for rule in self.registry.get_rules():
            try:
                issues.extend(rule.check(code))
            except Exception:
                # Never let a rule crash engine
                continue

        return issues
