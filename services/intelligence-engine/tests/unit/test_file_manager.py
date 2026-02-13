import os
from app.utils.file_manager import create_temp_cpp, delete_temp_file


def test_temp_file_lifecycle():
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)

    assert os.path.exists(path)

    delete_temp_file(path)

    assert not os.path.exists(path)
