"""
S6 — Module (project/项目) work item query tests.

Verifies listing work items within a module.
"""
import pytest


@pytest.mark.integration
def test_list_module_work_items_returns_200(api_client, workspace_slug, test_space, test_module):
    """S6: GET module issues should return 200."""
    resp = api_client.get(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/modules/{test_module}/module-issues/"
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"


@pytest.mark.integration
def test_list_module_work_items_returns_array(api_client, workspace_slug, test_space, test_module):
    """S6: Module issues response should be a list (possibly empty)."""
    resp = api_client.get(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/modules/{test_module}/module-issues/"
    )
    assert resp.status_code == 200
    data = resp.json()
    # Response might be paginated or a plain list
    if isinstance(data, dict) and "results" in data:
        assert isinstance(data["results"], list), "Expected 'results' to be a list"
    else:
        assert isinstance(data, list), f"Expected list, got {type(data)}"
