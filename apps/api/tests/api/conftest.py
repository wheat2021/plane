"""
Integration test fixtures for Plane v1 API.

Configuration via environment variables:
  PLANE_TEST_BASE_URL   - Base URL of the Plane instance (default: http://localhost:8000)
  PLANE_TEST_API_TOKEN  - Admin API token (required; tests are skipped if not set)
  PLANE_TEST_WORKSPACE  - Workspace slug (default: "my-workspace")
"""
import os
import time
import pytest
import requests


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "integration: Integration tests against a live Plane instance "
        "(requires PLANE_TEST_API_TOKEN and PLANE_TEST_BASE_URL)",
    )


class APIClient:
    """Thin wrapper around requests.Session with base URL and auth header."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"X-Api-Key": token, "Content-Type": "application/json"})

    def get(self, path: str, **kwargs):
        return self.session.get(f"{self.base_url}{path}", **kwargs)

    def post(self, path: str, **kwargs):
        return self.session.post(f"{self.base_url}{path}", **kwargs)

    def patch(self, path: str, **kwargs):
        return self.session.patch(f"{self.base_url}{path}", **kwargs)

    def delete(self, path: str, **kwargs):
        return self.session.delete(f"{self.base_url}{path}", **kwargs)


@pytest.fixture(scope="session")
def api_client():
    """Session-scoped API client. Skips if PLANE_TEST_API_TOKEN is not set."""
    token = os.environ.get("PLANE_TEST_API_TOKEN")
    if not token:
        pytest.skip("PLANE_TEST_API_TOKEN not set — skipping integration tests")
    base_url = os.environ.get("PLANE_TEST_BASE_URL", "http://localhost:8000")
    return APIClient(base_url=base_url, token=token)


@pytest.fixture(scope="session")
def workspace_slug(api_client):
    """Return the workspace slug from environment or discover from API."""
    slug = os.environ.get("PLANE_TEST_WORKSPACE")
    if slug:
        return slug
    # Discover workspace slug from /api/users/me/workspaces/
    resp = api_client.get("/api/users/me/workspaces/")
    assert resp.status_code == 200, f"Failed to list workspaces: {resp.text}"
    workspaces = resp.json()
    assert workspaces, "No workspaces found for the token"
    return workspaces[0]["slug"]


@pytest.fixture(scope="session")
def test_space(api_client, workspace_slug):
    """Create a dedicated test space (project). Deleted after the session."""
    timestamp = int(time.time())
    payload = {
        "name": f"API Test Space [{timestamp}]",
        "identifier": f"ATS{timestamp % 100000}",
        "network": 0,  # secret
        "cycle_view": True,
        "module_view": True,
    }
    resp = api_client.post(f"/api/v1/workspaces/{workspace_slug}/projects/", json=payload)
    assert resp.status_code == 201, f"Failed to create test space: {resp.text}"
    project = resp.json()
    project_id = project["id"]

    yield project_id

    # Teardown: delete the test space
    api_client.delete(f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/")


@pytest.fixture(scope="session")
def test_module(api_client, workspace_slug, test_space):
    """Create a test module (project/项目) inside the test space."""
    payload = {"name": "Test Module", "status": "in-progress"}
    resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/modules/", json=payload
    )
    assert resp.status_code == 201, f"Failed to create test module: {resp.text}"
    return resp.json()["id"]


@pytest.fixture(scope="session")
def test_cycle(api_client, workspace_slug, test_space):
    """Create a test cycle (iteration/迭代) that includes today."""
    from datetime import date, timedelta

    today = date.today()
    payload = {
        "name": f"Test Cycle [{int(time.time())}]",
        "project_id": test_space,
        "start_date": str(today - timedelta(days=1)),
        "end_date": str(today + timedelta(days=13)),
    }
    resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/cycles/", json=payload
    )
    assert resp.status_code == 201, f"Failed to create test cycle: {resp.text}"
    return resp.json()["id"]


@pytest.fixture(scope="session")
def default_state_id(api_client, workspace_slug, test_space):
    """Return the ID of the default (backlog) state in the test space."""
    resp = api_client.get(f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/states/")
    assert resp.status_code == 200, f"Failed to list states: {resp.text}"
    data = resp.json()
    # States endpoint returns paginated response
    states = data.get("results", data) if isinstance(data, dict) else data
    assert states, "No states found in test space"
    # Prefer 'backlog' group, else take the first state
    default = next((s for s in states if s.get("group") == "backlog"), None) or states[0]
    return default["id"]
