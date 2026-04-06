import os
from pathlib import Path

# Load .env from project root
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_path)
    except ImportError:
        pass  # python-dotenv optional

MAX_FILE_SIZE = 100_000  # 100KB
MAX_FILES = 5
COMPILER_TIMEOUT = 5
CPP_STANDARD = "c++17"
SUPPORTED_LANGUAGES = ["cpp"]

# LLM configuration - toggle provider and model via env
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")  # "ollama" | "gemini"
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")  # e.g. llama3.2, gemini-pro
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
