from fastapi.testclient import TestClient
from app.main import app
from app.config import MAX_FILE_SIZE, MAX_FILES
from unittest.mock import patch
import pytest

client = TestClient(app)


def test_health_endpoint():
    """Test GET /health endpoint returns OK status"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_analyze_valid_code():
    response = client.post("/analyze", json={
        "bundleId": "test-valid",
        "language": "cpp",
        "files": [
            {
                "path": "main.cpp",
                "content": "int main(){return 0;}"
            }
        ]
    })

    assert response.status_code == 200
    data = response.json()
    assert data["issues"] == []


def test_analyze_syntax_error():
    response = client.post("/analyze", json={
        "bundleId": "test-error",
        "language": "cpp",
        "files": [
            {
                "path": "main.cpp",
                "content": "int main(){ int a = 5 return 0; }"
            }
        ]
    })

    assert response.status_code == 200
    data = response.json()
    assert len(data["issues"]) >= 1
    assert data["issues"][0]["severity"] == "critical"


def test_unsupported_language():
    response = client.post("/analyze", json={
        "bundleId": "test-lang",
        "language": "python",
        "files": []
    })

    assert response.status_code == 200
    data = response.json()
    assert data["issues"][0]["type"] == "unsupported_language"


def test_analyze_no_files():
    """Test analyzing bundle with no files"""
    response = client.post("/analyze", json={
        "bundleId": "test-no-files",
        "language": "cpp",
        "files": []
    })

    assert response.status_code == 200
    data = response.json()
    assert len(data["issues"]) >= 1
    assert data["issues"][0]["type"] == "no_files"


def test_analyze_too_many_files():
    """Test analyzing bundle with more than MAX_FILES"""
    files = [
        {"path": f"file{i}.cpp", "content": "int main(){return 0;}"}
        for i in range(MAX_FILES + 1)
    ]
    
    response = client.post("/analyze", json={
        "bundleId": "test-too-many",
        "language": "cpp",
        "files": files
    })

    assert response.status_code == 200
    data = response.json()
    assert len(data["issues"]) >= 1
    assert data["issues"][0]["type"] == "too_many_files"


def test_analyze_file_too_large():
    """Test analyzing file that exceeds MAX_FILE_SIZE"""
    large_content = "int main(){\n" + "// comment\n" * (MAX_FILE_SIZE // 10 + 100) + "return 0;\n}"
    
    response = client.post("/analyze", json={
        "bundleId": "test-large",
        "language": "cpp",
        "files": [
            {
                "path": "large.cpp",
                "content": large_content
            }
        ]
    })

    assert response.status_code == 200
    data = response.json()
    assert len(data["issues"]) >= 1
    assert data["issues"][0]["type"] == "file_too_large"


def test_analyze_exception_handling():
    """Test that pipeline exceptions are caught and handled gracefully"""
    with patch("app.main.pipeline.run", side_effect=Exception("Test exception")):
        response = client.post("/analyze", json={
            "bundleId": "test-exception",
            "language": "cpp",
            "files": [
                {
                    "path": "main.cpp",
                    "content": "int main(){return 0;}"
                }
            ]
        })

    assert response.status_code == 200
    data = response.json()
    assert len(data["issues"]) >= 1
    assert data["issues"][0]["type"] == "engine_failure"
    assert data["issues"][0]["severity"] == "critical"
