from app.services.syntax_validator import parse_compiler_errors
import pytest


def test_parse_standard_error():
    stderr = "main.cpp:2:5: error: expected ';' before 'return'"
    issues = parse_compiler_errors(stderr)

    assert len(issues) == 1
    assert issues[0].line == 2
    assert issues[0].severity == "critical"
    assert issues[0].confidence == "high"


def test_parse_fatal_error():
    stderr = "main.cpp:1:10: fatal error: iostream: No such file or directory"
    issues = parse_compiler_errors(stderr)

    assert len(issues) == 1
    assert issues[0].line == 1
    assert "No such file or directory" in issues[0].message


def test_parse_unrecognized_format():
    stderr = "some weird compiler output"
    issues = parse_compiler_errors(stderr)

    assert len(issues) == 1
    assert issues[0].type == "compilation_failed"
    assert issues[0].confidence == "medium"


def test_parse_multiple_errors():
    """Test parsing multiple different error types"""
    stderr = """main.cpp:2:5: error: expected ';' before 'return'
main.cpp:5:10: fatal error: invalid syntax"""
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 2
    assert all(issue.type == "syntax_error" for issue in issues)
    assert issues[0].line == 2
    assert issues[1].line == 5


def test_parse_mixed_valid_invalid():
    """Test parsing with mix of valid error lines and invalid ones"""
    stderr = """main.cpp:2:5: error: expected ';'
some warning: this should be ignored
main.cpp:4:10: error: 'var' was not declared"""
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 2
    assert issues[0].line == 2
    assert issues[1].line == 4


def test_parse_error_with_whitespace():
    """Test parsing error messages with extra whitespace"""
    stderr = "main.cpp:3:8: error:    extra whitespace in message   "
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 1
    assert issues[0].message == "extra whitespace in message"


def test_parse_empty_stderr():
    """Test parsing empty stderr returns unrecognized format error"""
    stderr = ""
    
    issues = parse_compiler_errors(stderr)
    
    assert len(issues) == 1
    assert issues[0].type == "compilation_failed"
    assert "unrecognized" in issues[0].message
