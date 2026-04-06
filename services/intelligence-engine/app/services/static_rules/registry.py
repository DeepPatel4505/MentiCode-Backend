from typing import List
from .base_rule import StaticRule

class RuleRegistry:
    def __init__(self):
        self._rules: List[StaticRule] = []

    def register(self, rule: StaticRule):
        self._rules.append(rule)

    def get_rules(self) -> List[StaticRule]:
        return self._rules


