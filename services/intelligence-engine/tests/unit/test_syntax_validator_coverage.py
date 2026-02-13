"""
Additional edge case tests for syntax_validator to achieve 100% coverage
"""
from app.services.syntax_validator import validate_syntax, parse_compiler_errors
from app.utils.file_manager import create_temp_cpp, delete_temp_file
from unittest.mock import patch, MagicMock
import subprocess
import pytest


def test_compiler_returns_unrecognized_error_with_stderr():
    """Test compiler returning non-standard stderr output"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run") as mock_run:
            # Return non-zero exit code with non-standard stderr
            mock_result = subprocess.CompletedProcess(
                args=["g++"],
                returncode=1,
                stdout="",
                stderr="Custom compiler message\nNo match pattern here"
            )
            mock_run.return_value = mock_result
            
            issues = validate_syntax(path)
        
        assert len(issues) >= 1
        assert issues[0].type == "compilation_failed"
        assert issues[0].severity == "critical"
    finally:
        delete_temp_file(path)


def test_compiler_failure_with_empty_stderr_string():
    """Test compiler failure but with empty stderr (not None, but empty string)"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run") as mock_run:
            # Return non-zero exit code with empty stderr string
            mock_result = subprocess.CompletedProcess(
                args=["g++"],
                returncode=1,
                stdout="",
                stderr=""  # Empty string, not None
            )
            mock_run.return_value = mock_result
            
            issues = validate_syntax(path)
        
        assert len(issues) >= 1
        assert issues[0].type == "compilation_failed"
        assert "without error output" in issues[0].message
        assert issues[0].confidence == "low"
    finally:
        delete_temp_file(path)


def test_parse_compiler_errors_with_various_error_types():
    """Test parsing various error message formats"""
    stderr = """main.cpp:1:1: error: includes are not allowed
main.cpp:5:15: fatal error: syntax error"""
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 2
    assert all(issue.type == "syntax_error" for issue in issues)
    assert all(issue.severity == "critical" for issue in issues)
    assert all(issue.confidence == "high" for issue in issues)


def test_parse_error_message_extraction():
    """Test correct extraction of error message content"""
    stderr = "file.cpp:10:5: error: this is; a complex: message; with: colons"
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 1
    assert "this is; a complex: message; with: colons" in issues[0].message


def test_validate_syntax_with_large_line_numbers():
    """Test parsing errors with large line numbers"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run") as mock_run:
            mock_result = subprocess.CompletedProcess(
                args=["g++"],
                returncode=1,
                stdout="",
                stderr="main.cpp:999999:15: error: error at huge line number"
            )
            mock_run.return_value = mock_result
            
            issues = validate_syntax(path)
        
        assert len(issues) >= 1
        assert issues[0].line == 999999
    finally:
        delete_temp_file(path)


def test_validate_syntax_success_with_valid_return_code():
    """Test that returncode 0 returns empty issues"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run") as mock_run:
            mock_result = subprocess.CompletedProcess(
                args=["g++"],
                returncode=0,
                stdout="",
                stderr=""
            )
            mock_run.return_value = mock_result
            
            issues = validate_syntax(path)
        
        assert issues == []
    finally:
        delete_temp_file(path)


def test_parse_errors_with_multiple_colons_in_message():
    """Test parsing error messages containing multiple colons"""
    stderr = 'main.cpp:3:10: error: use std::cout instead of cout'
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 1
    assert issues[0].message == "use std::cout instead of cout"
    assert issues[0].line == 3


def test_parse_warning_lines_ignored():
    """Test that warning lines are properly ignored if they don't match pattern"""
    stderr = """main.cpp:2:5: warning: unused variable 'x'
main.cpp:3:10: error: expected ';'"""
    
    issues = parse_compiler_errors(stderr)
    
    # Should only parse the error, not the warning
    assert len(issues) == 1
    assert issues[0].line == 3


def test_parse_errors_maintains_order():
    """Test that errors are returned in order"""
    stderr = """main.cpp:10:5: error: first error
main.cpp:5:10: error: second error
main.cpp:20:15: error: third error"""
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 3
    assert issues[0].line == 10
    assert issues[1].line == 5
    assert issues[2].line == 20
