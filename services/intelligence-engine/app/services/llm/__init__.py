"""LLM client factory and implementations."""
from .base import BaseLLMClient
from .ollama_client import OllamaLLMClient
from .gemini_client import GeminiLLMClient

__all__ = ["BaseLLMClient", "OllamaLLMClient", "GeminiLLMClient", "create_llm_client"]


def create_llm_client(provider: str = None, **kwargs) -> BaseLLMClient:
    """Create LLM client from provider name (ollama, gemini)."""
    from app.config import LLM_PROVIDER
    if(not provider):
        provider = LLM_PROVIDER
    if(not provider):
        raise ValueError("LLM_PROVIDER is not set")
    p = (provider or LLM_PROVIDER).lower()
    if p == "ollama":
        return OllamaLLMClient(**kwargs)
    if p == "gemini":
        return GeminiLLMClient(**kwargs)
    raise ValueError(f"Unknown LLM provider: {provider or LLM_PROVIDER}")
