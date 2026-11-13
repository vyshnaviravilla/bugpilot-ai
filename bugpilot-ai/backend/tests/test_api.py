import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["OLLAMA_MODEL"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def reg(c, email, role, name="Employee A"):
    return c.post("/api/auth/register", json={"name": name, "email": email, "password": "password123", "role": role})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_full_flow():
    with TestClient(app) as c:
        assert c.get("/api/health").json()["status"] == "ok"

        r = reg(c, "qa@example.com", "qa", "Quinn")
        assert r.status_code == 201
        qa = r.json()["access_token"]
        dev = reg(c, "dev@example.com", "developer").json()["access_token"]

        assert reg(c, "QA@example.com", "qa").status_code == 409  # duplicate, case-insensitive
        assert c.post("/api/auth/register", json={"name": "x", "email": "bad", "password": "short", "role": "qa"}).status_code == 422

        ok = c.post("/api/auth/login", json={"email": "qa@example.com", "password": "password123", "role": "qa"})
        assert ok.status_code == 200 and "password_hash" not in ok.text
        assert c.post("/api/auth/login", json={"email": "qa@example.com", "password": "nope"}).status_code == 401
        assert c.post("/api/auth/login", json={"email": "qa@example.com", "password": "password123", "role": "developer"}).status_code == 403

        assert c.get("/api/auth/me", headers=auth(qa)).json()["role"] == "qa"
        assert c.get("/api/qa/overview").status_code == 401
        assert c.get("/api/qa/overview", headers=auth(qa)).status_code == 200
        assert c.get("/api/qa/overview", headers=auth(dev)).status_code == 403
        assert c.get("/api/developer/overview", headers=auth(qa)).status_code == 403
        assert c.get("/api/developer/overview", headers=auth(dev)).status_code == 200

        st = c.get("/api/ai/status", headers=auth(qa)).json()
        assert st["configured"] is False and st["message"]
        assert c.post("/api/ai/test", headers=auth(qa), json={}).status_code == 503
