import subprocess
import re
import time
from typing import List
from app.domain.issue import Issue
from app.config import COMPILER_TIMEOUT, CPP_STANDARD
from app.utils.logger import logger


def validate_syntax(file_path: str) -> List[Issue]:
    issues: List[Issue] = []

    start_time = time.time()

    try:
        result = subprocess.run(
            ["g++", f"-std={CPP_STANDARD}", "-fsyntax-only", file_path],
            capture_output=True,
            text=True,
            timeout=COMPILER_TIMEOUT
        )

    except subprocess.TimeoutExpired:
        logger.warning("Compilation timeout")
        return [
            Issue(
                type="compiler_timeout",
                severity="critical",
                message="Compilation timed out",
                confidence="high",
                source="compiler",
            )
        ]

    except Exception:
        logger.exception("Compiler execution failure")
        return [
            Issue(
                type="compiler_execution_failure",
                severity="critical",
                message="Internal compiler execution failure",
                confidence="medium",
                source="compiler",
            )
        ]

    elapsed = time.time() - start_time
    logger.info(f"Compilation completed in {elapsed:.3f}s")

    # If compilation failed
    if result.returncode != 0:
        if result.stderr:
            parsed = parse_compiler_errors(result.stderr)

            if parsed:
                return parsed

            return [
                Issue(
                    type="compilation_failed",
                    severity="critical",
                    message="Compilation failed (unrecognized error format)",
                    confidence="medium",
                    source="compiler",
                )
            ]
        else:
            return [
                Issue(
                    type="compilation_failed",
                    severity="critical",
                    message="Compilation failed without error output",
                    confidence="low",
                    source="compiler",
                )
            ]

    return issues


def parse_compiler_errors(stderr: str) -> List[Issue]:
    issues: List[Issue] = []

    pattern = r":(\d+):\d+: (fatal error|error): (.+)"


    for line in stderr.splitlines():
        match = re.search(pattern, line)
        if match:
            try:
                line_number = int(match.group(1))
            except Exception:
                line_number = None

            message = match.group(3).strip()

            issues.append(
                Issue(
                    type="syntax_error",
                    severity="critical",
                    line=line_number,
                    message=message,
                    confidence="high",
                    source="compiler",
                )
            )

    # If no matches but stderr exists, return unrecognized format error
    if not issues:
        return [
            Issue(
                type="compilation_failed",
                severity="critical",
                line=None,
                message="Compilation failed but error format unrecognized",
                confidence="medium",
                source="compiler",
            )
        ]

    return issues
