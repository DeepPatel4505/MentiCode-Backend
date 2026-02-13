from app.services.syntax_validator import validate_syntax
from app.utils.file_manager import create_temp_cpp, delete_temp_file


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
