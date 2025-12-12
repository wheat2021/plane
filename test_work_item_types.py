#!/usr/bin/env python3
"""
Test script to verify Work Item Types API endpoints
Compares Community Edition vs Business Edition behavior
"""

import os
import requests
import json
from typing import Dict, Any

# API configurations
COMMUNITY_CONFIG = {
    "base_url": "http://107.174.155.181/api/v1",
    "api_key": os.environ.get("PLANE_API_KEY_COMMUNITY"),
    "workspace_slug": "ficcaurora",
    "project_id": "e945261d-205f-4c08-b585-9e199474890f"
}

BUSINESS_CONFIG = {
    "base_url": "https://api.plane.so/api/v1",
    "api_key": os.environ.get("PLANE_API_KEY_BUSINESS"),
    "workspace_slug": "ficcaurora",
    "project_id": "96fe3ed1-7fb2-404a-bacc-7406c8f3f183"
}

def make_request(config: Dict[str, str], endpoint: str, method: str = "GET", data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Make API request"""
    url = f"{config['base_url']}/workspaces/{config['workspace_slug']}/projects/{config['project_id']}/{endpoint}"

    headers = {
        "X-Api-Key": config['api_key'],
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    print(f"\n{'='*80}")
    print(f"Request: {method} {url}")
    if data:
        print(f"Body: {json.dumps(data, indent=2)}")

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=30)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")

        print(f"Status: {response.status_code}")

        if response.status_code != 204:  # No content
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)[:500]}...")
                return {
                    "status_code": response.status_code,
                    "data": response_data
                }
            except:
                print(f"Response (text): {response.text[:500]}...")
                return {
                    "status_code": response.status_code,
                    "data": response.text
                }
        else:
            return {
                "status_code": response.status_code,
                "data": None
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "status_code": 0,
            "error": str(e)
        }

def test_list_work_item_types(config: Dict[str, str], label: str):
    """Test listing work item types"""
    print(f"\n{'#'*80}")
    print(f"# Testing LIST work item types - {label}")
    print(f"{'#'*80}")

    result = make_request(config, "work-item-types/", "GET")
    return result

def test_create_work_item_type(config: Dict[str, str], label: str):
    """Test creating a work item type"""
    print(f"\n{'#'*80}")
    print(f"# Testing CREATE work item type - {label}")
    print(f"{'#'*80}")

    data = {
        "name": "Test Type",
        "description": "Test work item type created by automated test",
        "logo_props": {"emoji": "🧪"},
        "is_epic": False,
        "is_default": False,
        "is_active": True,
        "level": 0
    }

    result = make_request(config, "work-item-types/", "POST", data)
    return result

def test_get_work_item_type(config: Dict[str, str], type_id: str, label: str):
    """Test getting a specific work item type"""
    print(f"\n{'#'*80}")
    print(f"# Testing GET work item type - {label}")
    print(f"{'#'*80}")

    result = make_request(config, f"work-item-types/{type_id}/", "GET")
    return result

def test_update_work_item_type(config: Dict[str, str], type_id: str, label: str):
    """Test updating a work item type"""
    print(f"\n{'#'*80}")
    print(f"# Testing UPDATE work item type - {label}")
    print(f"{'#'*80}")

    data = {
        "name": "Updated Test Type",
        "description": "Updated description"
    }

    result = make_request(config, f"work-item-types/{type_id}/", "PATCH", data)
    return result

def test_delete_work_item_type(config: Dict[str, str], type_id: str, label: str):
    """Test deleting a work item type"""
    print(f"\n{'#'*80}")
    print(f"# Testing DELETE work item type - {label}")
    print(f"{'#'*80}")

    result = make_request(config, f"work-item-types/{type_id}/", "DELETE")
    return result

def compare_results(business_result: Dict, community_result: Dict, test_name: str):
    """Compare results between business and community editions"""
    print(f"\n{'='*80}")
    print(f"COMPARISON: {test_name}")
    print(f"{'='*80}")

    # Compare status codes
    if business_result.get("status_code") != community_result.get("status_code"):
        print(f"❌ Status code mismatch:")
        print(f"   Business: {business_result.get('status_code')}")
        print(f"   Community: {community_result.get('status_code')}")
    else:
        print(f"✅ Status code matches: {business_result.get('status_code')}")

    # Compare response structure (basic check)
    if "data" in business_result and "data" in community_result:
        business_data = business_result["data"]
        community_data = community_result["data"]

        if isinstance(business_data, dict) and isinstance(community_data, dict):
            business_keys = set(business_data.keys()) if business_data else set()
            community_keys = set(community_data.keys()) if community_data else set()

            if business_keys != community_keys:
                print(f"⚠️  Response structure differences:")
                print(f"   Only in Business: {business_keys - community_keys}")
                print(f"   Only in Community: {community_keys - business_keys}")
            else:
                print(f"✅ Response structure matches")

def main():
    """Main test execution"""
    print("="*80)
    print("Work Item Types API Test Suite")
    print("="*80)
    print(f"Community API: {COMMUNITY_CONFIG['base_url']}")
    print(f"Business API: {BUSINESS_CONFIG['base_url']}")
    print("="*80)

    # Test 1: List work item types
    business_list = test_list_work_item_types(BUSINESS_CONFIG, "BUSINESS")
    community_list = test_list_work_item_types(COMMUNITY_CONFIG, "COMMUNITY")
    compare_results(business_list, community_list, "LIST work item types")

    # Test 2: Create work item type
    business_create = test_create_work_item_type(BUSINESS_CONFIG, "BUSINESS")
    community_create = test_create_work_item_type(COMMUNITY_CONFIG, "COMMUNITY")
    compare_results(business_create, community_create, "CREATE work item type")

    # Extract created IDs for further tests
    business_type_id = None
    community_type_id = None

    if business_create.get("status_code") in [200, 201] and business_create.get("data"):
        business_type_id = business_create["data"].get("id")
        print(f"\nBusiness type created: {business_type_id}")

    if community_create.get("status_code") in [200, 201] and community_create.get("data"):
        community_type_id = community_create["data"].get("id")
        print(f"Community type created: {community_type_id}")

    # Test 3: Get specific work item type
    if business_type_id and community_type_id:
        business_get = test_get_work_item_type(BUSINESS_CONFIG, business_type_id, "BUSINESS")
        community_get = test_get_work_item_type(COMMUNITY_CONFIG, community_type_id, "COMMUNITY")
        compare_results(business_get, community_get, "GET work item type")

        # Test 4: Update work item type
        business_update = test_update_work_item_type(BUSINESS_CONFIG, business_type_id, "BUSINESS")
        community_update = test_update_work_item_type(COMMUNITY_CONFIG, community_type_id, "COMMUNITY")
        compare_results(business_update, community_update, "UPDATE work item type")

        # Test 5: Delete work item type
        business_delete = test_delete_work_item_type(BUSINESS_CONFIG, business_type_id, "BUSINESS")
        community_delete = test_delete_work_item_type(COMMUNITY_CONFIG, community_type_id, "COMMUNITY")
        compare_results(business_delete, community_delete, "DELETE work item type")
    else:
        print("\n⚠️  Skipping GET/UPDATE/DELETE tests due to creation failures")

    print("\n" + "="*80)
    print("Test Suite Completed")
    print("="*80)

if __name__ == "__main__":
    main()
