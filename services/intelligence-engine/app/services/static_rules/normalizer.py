import re

def remove_comments(code: str) -> str:
    # Remove single-line comments
    code = re.sub(r"//.*", "", code)
    # Remove multi-line comments
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
    return code

def remove_preprocessor_lines(code: str) -> str:
    lines = code.split("\n")
    filtered = [line for line in lines if not line.strip().startswith("#")]
    return "\n".join(filtered)

