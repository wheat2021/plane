"""
S8 — Permission boundary tests.

Verifies:
- Member role token cannot create a space → 403
- Unauthenticated requests return 401

Note: For the Member token test (S8a) to run meaningfully, set
PLANE_TEST_MEMBER_API_TOKEN to a token with Member-level role.
If not set, S8a is skipped and only S8b (no token → 401) runs.
"""
import os
import pytest
import requests


@pytest.mark.integration
def test_member_token_cannot_create_space(api_client, workspace_slug):
    """S8a: Member-role token should receive 403 when creating a space."""
    member_token = os.environ.get("PLANE_TEST_MEMBER_API_TOKEN")
    if not member_token:
        pytest.skip(
            "PLANE_TEST_MEMBER_API_TOKEN not set — "
            "provide a Member-role token to run permission boundary test S8a"
        )
    base_url = os.environ.get("PLANE_TEST_BASE_URL", "http://localhost:8000")
    resp = requests.post(
        f"{base_url}/api/v1/workspaces/{workspace_slug}/projects/",
        headers={"X-Api-Key": member_token, "Content-Type": "application/json"},
        json={"name": "Member Should Not Create This", "identifier": "MSNCT", "network": 0},
    )
    assert resp.status_code == 403, (
        f"Expected 403 for Member token creating space, got {resp.status_code}: {resp.text}"
    )


@pytest.mark.integration
def test_no_token_returns_401(api_client):
    """S8b: Request without X-Api-Key header should return 401."""
    base_url = os.environ.get("PLANE_TEST_BASE_URL", "http://localhost:8000")
    resp = requests.get(f"{base_url}/api/v1/users/me/")
    assert resp.status_code == 401, (
        f"Expected 401 for unauthenticated request, got {resp.status_code}: {resp.text}"
    )
