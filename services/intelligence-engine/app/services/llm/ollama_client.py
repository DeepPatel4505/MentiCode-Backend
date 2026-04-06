"""Ollama client for local models."""
import httpx
from .base import BaseLLMClient
from app.config import OLLAMA_BASE_URL, LLM_MODEL
from app.utils.logger import logger


class OllamaLLMClient(BaseLLMClient):
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = LLM_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def complete(self, prompt: str, **kwargs) -> str:
        model = kwargs.get("model") or self.model
        timeout = kwargs.get("timeout", )
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("response", "")
        except httpx.HTTPError as e:
            logger.exception(f"Ollama API error: {e}")
            raise RuntimeError(f"Ollama request failed: {e}") from e
