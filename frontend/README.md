# Stacks Wallet Frontend

React + Vite UI to query the SIP‑010 token contract (read-only) for name, total supply, and balances.

## Setup

```bash
cd frontend
npm install
```

## Env config

Copy `env.example` to `.env` (same directory) and adjust:

- `VITE_STACKS_NETWORK` – `testnet` (default) or `mainnet`
- `VITE_STACKS_API_URL` – optional Hiro API override (defaults based on network)
- `VITE_CONTRACT_ADDRESS` – contract deployer address (ST…)
- `VITE_CONTRACT_NAME` – deployed contract name (e.g., `token-contract` or timestamped)

## Run

```bash
npm run dev
```

Then open the shown local URL. Use the form to:
- Load token info (`get-name`, `get-total-supply`)
- Check balances (`get-balance`) for any principal

Calls are read-only; no private keys needed.
