"""
S3-S5 — Work item lifecycle tests.

S3: Create work item → 201, response contains 'id'
S4: Update state → 200, state_id written back
S5: Write extra_properties → 201, GET reads back same values
"""
import pytest


@pytest.fixture(scope="module")
def created_work_item(api_client, workspace_slug, test_space, test_cycle, test_module, default_state_id):
    """Create a work item used across S3-S5 tests."""
    payload = {
        "name": "Integration Test Work Item",
        "state_id": default_state_id,
        "cycle_id": test_cycle,
        "module_id": test_module,
    }
    resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/",
        json=payload,
    )
    assert resp.status_code == 201, f"Failed to create work item: {resp.text}"
    return resp.json()


# ---------------------------------------------------------------------------
# S3: Create work item
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_create_work_item_returns_201(api_client, workspace_slug, test_space, default_state_id):
    """S3: POST /work-items/ should return 201."""
    payload = {"name": "S3 Test Item", "state_id": default_state_id}
    resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/",
        json=payload,
    )
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"


@pytest.mark.integration
def test_create_work_item_response_has_id(api_client, workspace_slug, test_space, default_state_id):
    """S3: Created work item response should contain 'id'."""
    payload = {"name": "S3 Test Item with ID check", "state_id": default_state_id}
    resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/",
        json=payload,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data, "Response missing 'id' field"
    assert data["id"], "Response 'id' is empty"


# ---------------------------------------------------------------------------
# S4: Update work item state
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_update_state_returns_200(api_client, workspace_slug, test_space, created_work_item):
    """S4: PATCH state_id should return 200."""
    work_item_id = created_work_item["id"]
    # Get a 'started' state to transition to
    states_resp = api_client.get(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/states/"
    )
    assert states_resp.status_code == 200
    states_data = states_resp.json()
    states = states_data.get("results", states_data) if isinstance(states_data, dict) else states_data
    started_state = next((s for s in states if s.get("group") == "started"), None)
    if not started_state:
        pytest.skip("No 'started' state found in test space")

    resp = api_client.patch(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/{work_item_id}/",
        json={"state": started_state["id"]},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"


@pytest.mark.integration
def test_update_state_is_written_back(api_client, workspace_slug, test_space, created_work_item):
    """S4: Updated state_id should match in the response body."""
    work_item_id = created_work_item["id"]
    states_resp = api_client.get(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/states/"
    )
    states_data = states_resp.json()
    states = states_data.get("results", states_data) if isinstance(states_data, dict) else states_data
    target_state = next((s for s in states if s.get("group") == "started"), None)
    if not target_state:
        pytest.skip("No 'started' state found in test space")

    resp = api_client.patch(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/{work_item_id}/",
        json={"state": target_state["id"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    # API returns state as "state" (UUID) or "state_id" depending on version
    actual_state = data.get("state_id") or data.get("state")
    assert actual_state == target_state["id"], (
        f"state mismatch: expected {target_state['id']}, got {actual_state}"
    )


# ---------------------------------------------------------------------------
# S5: extra_properties read/write
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_create_work_item_with_extra_properties(api_client, workspace_slug, test_space, default_state_id):
    """S5a: Creating work item with extra_properties should return 201 with the values."""
    payload = {
        "name": "S5 Extra Props Test",
        "state_id": default_state_id,
        "extra_properties": {"source": "ci-cd"},
    }
    resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/",
        json=payload,
    )
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "extra_properties" in data, "Response missing 'extra_properties' field"
    assert data["extra_properties"].get("source") == "ci-cd", (
        f"extra_properties mismatch: {data['extra_properties']}"
    )


@pytest.mark.integration
def test_get_work_item_returns_extra_properties(api_client, workspace_slug, test_space, default_state_id):
    """S5b: GET work item should return the extra_properties written at create time."""
    # Create with extra_properties
    payload = {
        "name": "S5 GET Extra Props Test",
        "state_id": default_state_id,
        "extra_properties": {"source": "ci-cd", "env": "staging"},
    }
    create_resp = api_client.post(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/",
        json=payload,
    )
    assert create_resp.status_code == 201
    work_item_id = create_resp.json()["id"]

    # GET and verify
    get_resp = api_client.get(
        f"/api/v1/workspaces/{workspace_slug}/projects/{test_space}/work-items/{work_item_id}/"
    )
    assert get_resp.status_code == 200, f"GET failed: {get_resp.text}"
    data = get_resp.json()
    extra = data.get("extra_properties", {})
    assert extra.get("source") == "ci-cd", f"source mismatch: {extra}"
    assert extra.get("env") == "staging", f"env mismatch: {extra}"
