#!/usr/bin/env python3
import os
import requests
import json

# Configuration
API_KEY = os.environ.get("PLANE_API_KEY_COMMUNITY")
BASE_URL = "http://107.174.155.181/api/v1"
WORKSPACE = "ficcaurora"
PROJECT = "e945261d-205f-4c08-b585-9e199474890f"

# Create headers
headers = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json"
}

# Test data
data = {
    "name": "Debug Test Type",
    "description": "Testing from Python script",
    "logo_props": {"emoji": "🔍"},
    "is_epic": False,
    "is_default": False,
    "is_active": True,
    "level": 0
}

# Make request
url = f"{BASE_URL}/workspaces/{WORKSPACE}/projects/{PROJECT}/work-item-types/"
print(f"URL: {url}")
print(f"Headers: {headers}")
print(f"Data: {json.dumps(data, indent=2)}")
print("\nMaking request...\n")

response = requests.post(url, headers=headers, json=data)

print(f"Status Code: {response.status_code}")
print(f"Response Headers: {dict(response.headers)}")
print(f"Response Body:")
try:
    print(json.dumps(response.json(), indent=2))
except:
    print(response.text)
