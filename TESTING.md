# End-to-End Testing Guide

This guide walks through testing the complete Chainhooks integration.

## Prerequisites

1. **Hooks server running** (local or deployed):
   ```bash
   cd hooks-server
   npm install
   npm run dev  # starts on http://localhost:3001
   ```

2. **Frontend running** (optional, for UI testing):
   ```bash
   cd frontend
   npm install
   npm run dev  # starts on http://localhost:5173
   ```

## Test Steps

### Step 1: Test Webhook Server

Send a mock Chainhook event:
```bash
cd hooks-server
node test-webhook.js
```

Expected: `✅ Webhook accepted: 200`

### Step 2: Test Activity API

Query recent events:
```bash
cd hooks-server
node test-activity.js
```

Expected: Shows the event you just sent.

### Step 3: Run Full E2E Test

Run the automated test suite:
```bash
./scripts/test-e2e.sh
```

This tests:
- Health endpoint
- Webhook event delivery
- Activity API response

### Step 4: Test with Real Transactions

1. **Generate testnet transactions**:
   ```bash
   cd contracts
   STACKS_NETWORK=testnet npx tsx scripts/generate-txs.ts
   ```

2. **Check activity** (if Chainhooks are registered):
   ```bash
   curl http://localhost:3001/activity?network=testnet
   ```

3. **View in frontend**:
   - Open http://localhost:5173
   - Click "Load Chainhooks activity"
   - Verify events appear

## Troubleshooting

- **Webhook not receiving events**: Ensure Chainhooks are registered with Hiro service
- **Activity empty**: Events may take time to propagate; check webhook logs
- **Frontend can't connect**: Verify `VITE_HOOKS_SERVER_URL` in `frontend/.env`

