"""
S1 — Authentication validation tests.

Verifies API token authentication behavior:
- Valid token returns current user info (200)
- Invalid token returns 401 or 403 (implementation-dependent)
- No token returns 401
"""
import pytest
import requests


@pytest.mark.integration
def test_valid_token_returns_current_user(api_client):
    """S1a: Valid API token should return 200 with user id and email."""
    resp = api_client.get("/api/v1/users/me/")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "id" in data, "Response missing 'id' field"
    assert "email" in data, "Response missing 'email' field"


@pytest.mark.integration
def test_invalid_token_returns_auth_error(api_client):
    """S1b: Invalid API token should return 401 or 403 (token format is valid but not found)."""
    import os

    base_url = os.environ.get("PLANE_TEST_BASE_URL", "http://localhost:8000")
    resp = requests.get(
        f"{base_url}/api/v1/users/me/",
        headers={"X-Api-Key": "invalid-token-that-does-not-exist"},
    )
    assert resp.status_code in (401, 403), (
        f"Expected 401 or 403 for invalid token, got {resp.status_code}: {resp.text}"
    )


@pytest.mark.integration
def test_no_token_returns_401(api_client):
    """S1c: Missing API token should return 401."""
    import os

    base_url = os.environ.get("PLANE_TEST_BASE_URL", "http://localhost:8000")
    resp = requests.get(f"{base_url}/api/v1/users/me/")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"
