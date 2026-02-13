from app.services.syntax_validator import parse_compiler_errors


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
