"""Unit tests for LLM client factory."""
import pytest
from app.services.llm import create_llm_client, OllamaLLMClient, GeminiLLMClient


def test_create_ollama_client():
    client = create_llm_client(provider="ollama")
    assert isinstance(client, OllamaLLMClient)
    assert client.model  # uses default from config


def test_create_gemini_client():
    client = create_llm_client(provider="gemini", api_key="test-key")
    assert isinstance(client, GeminiLLMClient)


def test_create_unknown_provider_raises():
    with pytest.raises(ValueError, match="Unknown LLM provider"):
        create_llm_client(provider="unknown")
