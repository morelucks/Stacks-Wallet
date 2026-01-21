# Chainhooks Webhook Server

Minimal Express server to receive and store Hiro Chainhook events for SIP-010 token contracts.

## Quick Start

```bash
npm install
cp env.example .env
# Edit .env: set CHAINHOOK_SECRET and PORT (optional)
npm run dev
```

Server starts on `http://localhost:3001` (or your `PORT`).

## Endpoints

- `POST /hooks/stacks` - Receives Chainhook events
- `GET /activity?limit=50&network=testnet` - Returns recent events
- `GET /health` - Health check

## Testing

Send a test event:
```bash
node test-webhook.js
```

Query activity:
```bash
node test-activity.js
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `CHAINHOOK_SECRET` - Shared secret for HMAC verification (optional)
- `MAX_EVENTS` - Max events to store in memory (default: 500)

