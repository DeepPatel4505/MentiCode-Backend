import os
from app.utils.file_manager import create_temp_cpp, delete_temp_file
from unittest.mock import patch
import pytest


def test_temp_file_lifecycle():
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)

    assert os.path.exists(path)

    delete_temp_file(path)

    assert not os.path.exists(path)


def test_create_temp_cpp_creates_file():
    """Test that create_temp_cpp creates a file with correct content"""
    code = "#include <iostream>\nint main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        assert os.path.exists(path)
        assert path.endswith(".cpp")
        
        with open(path, "r") as f:
            content = f.read()
        assert content == code
    finally:
        delete_temp_file(path)


def test_delete_temp_file_handles_missing_file():
    """Test that delete_temp_file gracefully handles missing files"""
    non_existent_path = "/non/existent/path/file.cpp"
    
    # Should not raise an exception
    delete_temp_file(non_existent_path)


def test_delete_temp_file_handles_permission_error():
    """Test that delete_temp_file handles permission errors gracefully"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("os.remove", side_effect=PermissionError("Access denied")):
            # Should not raise an exception
            delete_temp_file(path)
    finally:
        if os.path.exists(path):
            delete_temp_file(path)


def test_delete_temp_file_handles_os_error():
    """Test that delete_temp_file handles OS errors gracefully"""
    code = "int main(){return 0;}"
    path = create_temp_cpp(code)
    
    try:
        with patch("os.remove", side_effect=OSError("General OS error")):
            # Should not raise an exception
            delete_temp_file(path)
    finally:
        if os.path.exists(path):
            delete_temp_file(path)
