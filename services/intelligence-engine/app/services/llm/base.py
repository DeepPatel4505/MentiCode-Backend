"""Abstract LLM client interface."""
from abc import ABC, abstractmethod


class BaseLLMClient(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def complete(self, prompt: str, **kwargs) -> str:
        """Send prompt and return raw text response."""
        pass
