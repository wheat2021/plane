"""
S2 — Cycle (iteration/迭代) query tests.

Verifies listing cycles and field completeness.
"""
import pytest


@pytest.mark.integration
def test_list_cycles_returns_200(api_client, workspace_slug, test_space, test_cycle):
    """S2a: Listing cycles in a space should return 200."""
    resp = api_client.get(f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/cycles/")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"


def _extract_list(data):
    """Extract list from paginated or plain response."""
    if isinstance(data, dict):
        return data.get("results", list(data.values())[0] if data else [])
    return data


@pytest.mark.integration
def test_list_cycles_returns_array(api_client, workspace_slug, test_space, test_cycle):
    """S2b: Cycles response should contain a list of cycle objects."""
    resp = api_client.get(f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/cycles/")
    assert resp.status_code == 200
    cycles = _extract_list(resp.json())
    assert isinstance(cycles, list), f"Expected list, got {type(cycles)}"
    assert len(cycles) >= 1, "Expected at least one cycle (the test cycle)"


@pytest.mark.integration
def test_cycle_has_required_fields(api_client, workspace_slug, test_space, test_cycle):
    """S2c: Each cycle object should have id, name, start_date, end_date fields."""
    resp = api_client.get(f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/cycles/")
    assert resp.status_code == 200
    cycles = _extract_list(resp.json())
    assert cycles, "No cycles returned"

    # Find the test cycle we created
    cycle = next((c for c in cycles if c.get("id") == test_cycle), cycles[0])
    for field in ("id", "name", "start_date", "end_date"):
        assert field in cycle, f"Cycle missing required field: '{field}'"
