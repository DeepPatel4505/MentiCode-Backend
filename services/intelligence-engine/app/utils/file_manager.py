import tempfile
import os
from app.utils.logger import logger

def create_temp_cpp(code: str) -> str:
    fd, path = tempfile.mkstemp(suffix=".cpp")
    with os.fdopen(fd, "w") as tmp:
        tmp.write(code)
    return path


def delete_temp_file(path: str):
    try:
        os.remove(path)
    except Exception:
        logger.warning(f"Failed to delete temp file {path}")
        pass
