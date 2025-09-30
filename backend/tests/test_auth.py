from fastapi.testclient import TestClient
from app.main import app


def test_login_success(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "grayj@wofford.edu", "password": "grayj"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body.get("role") == "organizer"


def test_login_failure_wrong_pwd(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "grayj@wofford.edu", "password": "nope"})
    assert r.status_code == 400
