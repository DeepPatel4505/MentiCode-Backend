"""Gemini client for Google's API."""
import httpx
import json
from .base import BaseLLMClient
from app.config import GEMINI_API_KEY, LLM_MODEL
from app.utils.logger import logger


class GeminiLLMClient(BaseLLMClient):
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, api_key: str = GEMINI_API_KEY, model: str = LLM_MODEL):
        self.api_key = api_key
        self.model = model

    def _model_id(self) -> str:
        # Map friendly names to Gemini model IDs
        m = self.model.lower()
        if m.startswith("gemini"):
            return m
        return "gemini-pro" if "pro" in m else "gemini-1.5-flash"

    async def complete(self, prompt: str, **kwargs) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required for Gemini provider")
        model = kwargs.get("model") or self._model_id()
        timeout = kwargs.get("timeout", 60.0)
        url = f"{self.BASE_URL}/models/{model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 8192,
            },
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as e:
            logger.exception(f"Gemini API error: {e}")
            raise RuntimeError(f"Gemini request failed: {e}") from e

        try:
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            return parts[0].get("text", "") if parts else ""
        except (IndexError, KeyError) as e:
            logger.error(f"Gemini response parse error: {data}")
            raise RuntimeError(f"Failed to parse Gemini response: {e}") from e
