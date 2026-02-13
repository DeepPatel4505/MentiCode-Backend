from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


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
