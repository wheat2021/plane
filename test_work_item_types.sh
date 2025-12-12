#!/bin/bash

# Work Item Types API Test Script
# Compares Community Edition vs Business Edition behavior

set -e

COMMUNITY_API_KEY="${PLANE_API_KEY_COMMUNITY}"
BUSINESS_API_KEY="${PLANE_API_KEY_BUSINESS}"

COMMUNITY_BASE_URL="http://107.174.155.181/api/v1"
BUSINESS_BASE_URL="https://api.plane.so/api/v1"

COMMUNITY_WORKSPACE="ficcaurora"
BUSINESS_WORKSPACE="ficcaurora"

COMMUNITY_PROJECT="e945261d-205f-4c08-b585-9e199474890f"
BUSINESS_PROJECT="96fe3ed1-7fb2-404a-bacc-7406c8f3f183"

echo "================================================================================"
echo "Work Item Types API Test Suite"
echo "================================================================================"
echo "Community API: ${COMMUNITY_BASE_URL}"
echo "Business API: ${BUSINESS_BASE_URL}"
echo "================================================================================"

# Test 1: List work item types - BUSINESS
echo ""
echo "################################################################################"
echo "# Test 1A: LIST work item types - BUSINESS"
echo "################################################################################"
BUSINESS_LIST_URL="${BUSINESS_BASE_URL}/workspaces/${BUSINESS_WORKSPACE}/projects/${BUSINESS_PROJECT}/work-item-types/"
echo "Request: GET ${BUSINESS_LIST_URL}"
BUSINESS_LIST_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "X-Api-Key: ${BUSINESS_API_KEY}" \
  -H "Accept: application/json" \
  "${BUSINESS_LIST_URL}")

BUSINESS_LIST_BODY=$(echo "$BUSINESS_LIST_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
BUSINESS_LIST_STATUS=$(echo "$BUSINESS_LIST_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: ${BUSINESS_LIST_STATUS}"
echo "Response:"
echo "$BUSINESS_LIST_BODY" | python3 -m json.tool 2>/dev/null | head -50 || echo "$BUSINESS_LIST_BODY"

# Test 1: List work item types - COMMUNITY
echo ""
echo "################################################################################"
echo "# Test 1B: LIST work item types - COMMUNITY"
echo "################################################################################"
COMMUNITY_LIST_URL="${COMMUNITY_BASE_URL}/workspaces/${COMMUNITY_WORKSPACE}/projects/${COMMUNITY_PROJECT}/work-item-types/"
echo "Request: GET ${COMMUNITY_LIST_URL}"
COMMUNITY_LIST_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "X-Api-Key: ${COMMUNITY_API_KEY}" \
  -H "Accept: application/json" \
  "${COMMUNITY_LIST_URL}")

COMMUNITY_LIST_BODY=$(echo "$COMMUNITY_LIST_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
COMMUNITY_LIST_STATUS=$(echo "$COMMUNITY_LIST_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: ${COMMUNITY_LIST_STATUS}"
echo "Response:"
echo "$COMMUNITY_LIST_BODY" | python3 -m json.tool 2>/dev/null | head -50 || echo "$COMMUNITY_LIST_BODY"

# Comparison
echo ""
echo "================================================================================"
echo "COMPARISON: LIST work item types"
echo "================================================================================"
if [ "$BUSINESS_LIST_STATUS" == "$COMMUNITY_LIST_STATUS" ]; then
    echo "✅ Status code matches: ${BUSINESS_LIST_STATUS}"
else
    echo "❌ Status code mismatch:"
    echo "   Business: ${BUSINESS_LIST_STATUS}"
    echo "   Community: ${COMMUNITY_LIST_STATUS}"
fi

# Test 2: Create work item type - BUSINESS
echo ""
echo "################################################################################"
echo "# Test 2A: CREATE work item type - BUSINESS"
echo "################################################################################"
BUSINESS_CREATE_URL="${BUSINESS_BASE_URL}/workspaces/${BUSINESS_WORKSPACE}/projects/${BUSINESS_PROJECT}/work-item-types/"
CREATE_DATA='{"name":"Test Type","description":"Test work item type created by automated test","logo_props":{"emoji":"🧪"},"is_epic":false,"is_default":false,"is_active":true,"level":0}'
echo "Request: POST ${BUSINESS_CREATE_URL}"
echo "Body: ${CREATE_DATA}"

BUSINESS_CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "X-Api-Key: ${BUSINESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${CREATE_DATA}" \
  "${BUSINESS_CREATE_URL}")

BUSINESS_CREATE_BODY=$(echo "$BUSINESS_CREATE_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
BUSINESS_CREATE_STATUS=$(echo "$BUSINESS_CREATE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: ${BUSINESS_CREATE_STATUS}"
echo "Response:"
echo "$BUSINESS_CREATE_BODY" | python3 -m json.tool 2>/dev/null || echo "$BUSINESS_CREATE_BODY"

# Extract Business type ID
BUSINESS_TYPE_ID=$(echo "$BUSINESS_CREATE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null || echo "")

# Test 2: Create work item type - COMMUNITY
echo ""
echo "################################################################################"
echo "# Test 2B: CREATE work item type - COMMUNITY"
echo "################################################################################"
COMMUNITY_CREATE_URL="${COMMUNITY_BASE_URL}/workspaces/${COMMUNITY_WORKSPACE}/projects/${COMMUNITY_PROJECT}/work-item-types/"
echo "Request: POST ${COMMUNITY_CREATE_URL}"
echo "Body: ${CREATE_DATA}"

COMMUNITY_CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "X-Api-Key: ${COMMUNITY_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "${CREATE_DATA}" \
  "${COMMUNITY_CREATE_URL}")

COMMUNITY_CREATE_BODY=$(echo "$COMMUNITY_CREATE_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
COMMUNITY_CREATE_STATUS=$(echo "$COMMUNITY_CREATE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: ${COMMUNITY_CREATE_STATUS}"
echo "Response:"
echo "$COMMUNITY_CREATE_BODY" | python3 -m json.tool 2>/dev/null || echo "$COMMUNITY_CREATE_BODY"

# Extract Community type ID
COMMUNITY_TYPE_ID=$(echo "$COMMUNITY_CREATE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('id', ''))" 2>/dev/null || echo "")

# Comparison
echo ""
echo "================================================================================"
echo "COMPARISON: CREATE work item type"
echo "================================================================================"
if [ "$BUSINESS_CREATE_STATUS" == "$COMMUNITY_CREATE_STATUS" ]; then
    echo "✅ Status code matches: ${BUSINESS_CREATE_STATUS}"
else
    echo "❌ Status code mismatch:"
    echo "   Business: ${BUSINESS_CREATE_STATUS}"
    echo "   Community: ${COMMUNITY_CREATE_STATUS}"
fi

# Only proceed with further tests if both created successfully
if [ -n "$BUSINESS_TYPE_ID" ] && [ -n "$COMMUNITY_TYPE_ID" ]; then
    echo ""
    echo "Business Type ID: ${BUSINESS_TYPE_ID}"
    echo "Community Type ID: ${COMMUNITY_TYPE_ID}"

    # Test 3: Get work item type
    echo ""
    echo "################################################################################"
    echo "# Test 3A: GET work item type - BUSINESS"
    echo "################################################################################"
    BUSINESS_GET_URL="${BUSINESS_BASE_URL}/workspaces/${BUSINESS_WORKSPACE}/projects/${BUSINESS_PROJECT}/work-item-types/${BUSINESS_TYPE_ID}/"
    echo "Request: GET ${BUSINESS_GET_URL}"

    BUSINESS_GET_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -H "X-Api-Key: ${BUSINESS_API_KEY}" \
      -H "Accept: application/json" \
      "${BUSINESS_GET_URL}")

    BUSINESS_GET_BODY=$(echo "$BUSINESS_GET_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    BUSINESS_GET_STATUS=$(echo "$BUSINESS_GET_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "Status: ${BUSINESS_GET_STATUS}"
    echo "Response:"
    echo "$BUSINESS_GET_BODY" | python3 -m json.tool 2>/dev/null || echo "$BUSINESS_GET_BODY"

    echo ""
    echo "################################################################################"
    echo "# Test 3B: GET work item type - COMMUNITY"
    echo "################################################################################"
    COMMUNITY_GET_URL="${COMMUNITY_BASE_URL}/workspaces/${COMMUNITY_WORKSPACE}/projects/${COMMUNITY_PROJECT}/work-item-types/${COMMUNITY_TYPE_ID}/"
    echo "Request: GET ${COMMUNITY_GET_URL}"

    COMMUNITY_GET_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -H "X-Api-Key: ${COMMUNITY_API_KEY}" \
      -H "Accept: application/json" \
      "${COMMUNITY_GET_URL}")

    COMMUNITY_GET_BODY=$(echo "$COMMUNITY_GET_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    COMMUNITY_GET_STATUS=$(echo "$COMMUNITY_GET_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "Status: ${COMMUNITY_GET_STATUS}"
    echo "Response:"
    echo "$COMMUNITY_GET_BODY" | python3 -m json.tool 2>/dev/null || echo "$COMMUNITY_GET_BODY"

    # Comparison
    echo ""
    echo "================================================================================"
    echo "COMPARISON: GET work item type"
    echo "================================================================================"
    if [ "$BUSINESS_GET_STATUS" == "$COMMUNITY_GET_STATUS" ]; then
        echo "✅ Status code matches: ${BUSINESS_GET_STATUS}"
    else
        echo "❌ Status code mismatch:"
        echo "   Business: ${BUSINESS_GET_STATUS}"
        echo "   Community: ${COMMUNITY_GET_STATUS}"
    fi

    # Test 4: Update work item type
    echo ""
    echo "################################################################################"
    echo "# Test 4A: UPDATE work item type - BUSINESS"
    echo "################################################################################"
    UPDATE_DATA='{"name":"Updated Test Type","description":"Updated description"}'
    BUSINESS_UPDATE_URL="${BUSINESS_BASE_URL}/workspaces/${BUSINESS_WORKSPACE}/projects/${BUSINESS_PROJECT}/work-item-types/${BUSINESS_TYPE_ID}/"
    echo "Request: PATCH ${BUSINESS_UPDATE_URL}"
    echo "Body: ${UPDATE_DATA}"

    BUSINESS_UPDATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH \
      -H "X-Api-Key: ${BUSINESS_API_KEY}" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d "${UPDATE_DATA}" \
      "${BUSINESS_UPDATE_URL}")

    BUSINESS_UPDATE_BODY=$(echo "$BUSINESS_UPDATE_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    BUSINESS_UPDATE_STATUS=$(echo "$BUSINESS_UPDATE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "Status: ${BUSINESS_UPDATE_STATUS}"
    echo "Response:"
    echo "$BUSINESS_UPDATE_BODY" | python3 -m json.tool 2>/dev/null || echo "$BUSINESS_UPDATE_BODY"

    echo ""
    echo "################################################################################"
    echo "# Test 4B: UPDATE work item type - COMMUNITY"
    echo "################################################################################"
    COMMUNITY_UPDATE_URL="${COMMUNITY_BASE_URL}/workspaces/${COMMUNITY_WORKSPACE}/projects/${COMMUNITY_PROJECT}/work-item-types/${COMMUNITY_TYPE_ID}/"
    echo "Request: PATCH ${COMMUNITY_UPDATE_URL}"
    echo "Body: ${UPDATE_DATA}"

    COMMUNITY_UPDATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH \
      -H "X-Api-Key: ${COMMUNITY_API_KEY}" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d "${UPDATE_DATA}" \
      "${COMMUNITY_UPDATE_URL}")

    COMMUNITY_UPDATE_BODY=$(echo "$COMMUNITY_UPDATE_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    COMMUNITY_UPDATE_STATUS=$(echo "$COMMUNITY_UPDATE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "Status: ${COMMUNITY_UPDATE_STATUS}"
    echo "Response:"
    echo "$COMMUNITY_UPDATE_BODY" | python3 -m json.tool 2>/dev/null || echo "$COMMUNITY_UPDATE_BODY"

    # Comparison
    echo ""
    echo "================================================================================"
    echo "COMPARISON: UPDATE work item type"
    echo "================================================================================"
    if [ "$BUSINESS_UPDATE_STATUS" == "$COMMUNITY_UPDATE_STATUS" ]; then
        echo "✅ Status code matches: ${BUSINESS_UPDATE_STATUS}"
    else
        echo "❌ Status code mismatch:"
        echo "   Business: ${BUSINESS_UPDATE_STATUS}"
        echo "   Community: ${COMMUNITY_UPDATE_STATUS}"
    fi

    # Test 5: Delete work item type
    echo ""
    echo "################################################################################"
    echo "# Test 5A: DELETE work item type - BUSINESS"
    echo "################################################################################"
    BUSINESS_DELETE_URL="${BUSINESS_BASE_URL}/workspaces/${BUSINESS_WORKSPACE}/projects/${BUSINESS_PROJECT}/work-item-types/${BUSINESS_TYPE_ID}/"
    echo "Request: DELETE ${BUSINESS_DELETE_URL}"

    BUSINESS_DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X DELETE \
      -H "X-Api-Key: ${BUSINESS_API_KEY}" \
      -H "Accept: application/json" \
      "${BUSINESS_DELETE_URL}")

    BUSINESS_DELETE_BODY=$(echo "$BUSINESS_DELETE_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    BUSINESS_DELETE_STATUS=$(echo "$BUSINESS_DELETE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "Status: ${BUSINESS_DELETE_STATUS}"
    if [ -n "$BUSINESS_DELETE_BODY" ]; then
        echo "Response:"
        echo "$BUSINESS_DELETE_BODY" | python3 -m json.tool 2>/dev/null || echo "$BUSINESS_DELETE_BODY"
    fi

    echo ""
    echo "################################################################################"
    echo "# Test 5B: DELETE work item type - COMMUNITY"
    echo "################################################################################"
    COMMUNITY_DELETE_URL="${COMMUNITY_BASE_URL}/workspaces/${COMMUNITY_WORKSPACE}/projects/${COMMUNITY_PROJECT}/work-item-types/${COMMUNITY_TYPE_ID}/"
    echo "Request: DELETE ${COMMUNITY_DELETE_URL}"

    COMMUNITY_DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X DELETE \
      -H "X-Api-Key: ${COMMUNITY_API_KEY}" \
      -H "Accept: application/json" \
      "${COMMUNITY_DELETE_URL}")

    COMMUNITY_DELETE_BODY=$(echo "$COMMUNITY_DELETE_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
    COMMUNITY_DELETE_STATUS=$(echo "$COMMUNITY_DELETE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "Status: ${COMMUNITY_DELETE_STATUS}"
    if [ -n "$COMMUNITY_DELETE_BODY" ]; then
        echo "Response:"
        echo "$COMMUNITY_DELETE_BODY" | python3 -m json.tool 2>/dev/null || echo "$COMMUNITY_DELETE_BODY"
    fi

    # Comparison
    echo ""
    echo "================================================================================"
    echo "COMPARISON: DELETE work item type"
    echo "================================================================================"
    if [ "$BUSINESS_DELETE_STATUS" == "$COMMUNITY_DELETE_STATUS" ]; then
        echo "✅ Status code matches: ${BUSINESS_DELETE_STATUS}"
    else
        echo "❌ Status code mismatch:"
        echo "   Business: ${BUSINESS_DELETE_STATUS}"
        echo "   Community: ${COMMUNITY_DELETE_STATUS}"
    fi
else
    echo "⚠️  Skipping GET/UPDATE/DELETE tests due to creation failures"
fi

echo ""
echo "================================================================================"
echo "Test Suite Completed"
echo "================================================================================"
