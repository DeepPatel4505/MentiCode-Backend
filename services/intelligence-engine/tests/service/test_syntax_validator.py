from app.services.syntax_validator import validate_syntax, parse_compiler_errors
from app.utils.file_manager import create_temp_cpp, delete_temp_file
from unittest.mock import patch
import subprocess
import pytest


def test_valid_code_compiles():
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)

    issues = validate_syntax(path)

    delete_temp_file(path)

    assert issues == []


def test_invalid_code_detected():
    code = "int main(){ int a = 5 return 0; }"
    path = create_temp_cpp(code)

    issues = validate_syntax(path)

    delete_temp_file(path)

    assert len(issues) >= 1
    assert issues[0].type == "syntax_error"


def test_compiler_timeout():
    """Test handling of subprocess timeout"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("g++", 5)):
            issues = validate_syntax(path)
        
        assert len(issues) == 1
        assert issues[0].type == "compiler_timeout"
        assert issues[0].severity == "critical"
        assert issues[0].confidence == "high"
    finally:
        delete_temp_file(path)


def test_compiler_execution_failure():
    """Test handling of generic compiler execution exceptions"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run", side_effect=Exception("Compiler not found")):
            issues = validate_syntax(path)
        
        assert len(issues) == 1
        assert issues[0].type == "compiler_execution_failure"
        assert issues[0].severity == "critical"
        assert issues[0].confidence == "medium"
    finally:
        delete_temp_file(path)


def test_compiler_no_stderr():
    """Test handling when compiler fails but produces no stderr"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("subprocess.run") as mock_run:
            mock_result = subprocess.CompletedProcess(
                args=["g++"],
                returncode=1,
                stdout="",
                stderr=""
            )
            mock_run.return_value = mock_result
            
            issues = validate_syntax(path)
        
        assert len(issues) >= 1
        assert issues[0].type == "compilation_failed"
        assert "without error output" in issues[0].message
    finally:
        delete_temp_file(path)


def test_parse_multiple_errors():
    """Test parsing multiple compiler errors from stderr"""
    stderr = """main.cpp:2:5: error: expected ';' before 'return'
main.cpp:4:10: error: 'undefined_var' was not declared"""
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 2
    assert all(issue.type == "syntax_error" for issue in issues)
    assert issues[0].line == 2
    assert issues[1].line == 4


def test_parse_invalid_line_number():
    """Test parsing error with invalid line number"""
    stderr = "main.cpp:invalid:5: error: some error"
    
    issues = parse_compiler_errors(stderr)
    
    # Should still parse even with invalid line number
    assert len(issues) == 1
    assert issues[0].line is None


def test_parse_no_matches():
    """Test parsing stderr with no recognizable error patterns"""
    stderr = "some random compiler output"
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 1
    assert issues[0].type == "compilation_failed"
    assert "unrecognized" in issues[0].message
