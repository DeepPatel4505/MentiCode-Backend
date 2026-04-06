from abc import ABC, abstractmethod
from typing import List
from app.domain.issue import Issue

class StaticRule(ABC):

    @abstractmethod
    def check(self, code: str) -> List[Issue]:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass
