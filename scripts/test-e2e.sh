#!/bin/bash
# End-to-end test script for Chainhooks integration
# Tests: webhook server, activity API, and frontend integration

set -e

HOOKS_SERVER="${HOOKS_SERVER:-http://localhost:3001}"
NETWORK="${NETWORK:-testnet}"

echo "🧪 Testing Chainhooks integration..."
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
if curl -s "${HOOKS_SERVER}/health" | grep -q '"ok":true'; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

# Test 2: Send test webhook event
echo ""
echo "2️⃣ Sending test webhook event..."
cd hooks-server
if node test-webhook.js "${HOOKS_SERVER}/hooks/stacks"; then
  echo "✅ Webhook event sent"
else
  echo "❌ Webhook event failed"
  exit 1
fi

# Test 3: Query activity API
echo ""
echo "3️⃣ Querying activity API..."
sleep 1
if node test-activity.js "${HOOKS_SERVER}" "${NETWORK}"; then
  echo "✅ Activity API working"
else
  echo "❌ Activity API failed"
  exit 1
fi

echo ""
echo "🎉 All tests passed!"

