## Stacks Wallet – SIP-010 Fungible Token Contracts

This repository contains a minimal Stacks smart-contract project that implements a SIP‑010–compatible fungible token (“Clarity Coin”) plus a simple TypeScript test + deployment toolchain.

The contracts are written in Clarity and managed with Clarinet; tests and deployment utilities are written in TypeScript and use `vitest` and the `@stacks/*` libraries.

---

## Project structure

- **`contracts/Clarinet.toml`**: Clarinet project config for the smart contracts.
- **`contracts/contracts/sip-010-trait.clar`**: Local copy of the SIP‑010 fungible token trait.
- **`contracts/contracts/token-contract.clar`**: Implementation of the SIP‑010 token:
  - Defines the `clarity-coin` fungible token.
  - Owner-only `mint` and `set-token-uri` functions.
  - Read-only helpers like `get-balance`, `get-total-supply`, `get-name`, `get-symbol`, `get-decimals`, and `get-token-uri`.
- **`contracts/tests/token-contract.test.ts`**: Example `vitest` test using the Clarinet JS environment.
- **`contracts/scripts/deploy.ts`**: Node/TypeScript script to deploy the trait and token contracts to Testnet or Mainnet.
- **`contracts/package.json`**: NPM scripts and dependencies for testing and deployment.

---

## Prerequisites

- **Node.js**: v18+ recommended.
- **npm**: v9+ recommended.
- **Clarinet** (optional but recommended for local simulation):
  - Install via the official docs: `https://docs.hiro.so/clarinet`.
- A **Stacks private key** (for the deployer wallet) with enough STX balance on the chosen network.

---

## Installation

From the project root:

```bash
cd contracts
npm install
```

This installs testing and deployment dependencies (`vitest`, `vitest-environment-clarinet`, `@stacks/transactions`, `@stacks/clarinet-sdk`, etc.).

---

## Environment configuration

Deployment is driven by environment variables read from a `.env` file in the `contracts/` directory.

Create `contracts/.env`:

```bash
cd contracts
cat > .env << 'EOF'
# Private key of the deployer (Mainnet or Testnet)
PRIVATE_KEY=replace-with-your-private-key

# or, alternatively:
# DEPLOYER_KEY=replace-with-your-private-key

# Target network: "mainnet" or "testnet"
STACKS_NETWORK=testnet
EOF
```

Notes:

- **`PRIVATE_KEY`** or **`DEPLOYER_KEY`** must be set; if both are provided, `PRIVATE_KEY` takes precedence.
- **`STACKS_NETWORK`** defaults to `mainnet` if not set.

Never commit real private keys to version control.

---

## Running tests

All test commands are run from the `contracts/` directory.

- **Single test run (no watch):**

```bash
cd contracts
npm test
```

- **With coverage and costs (as configured in `package.json`):**

```bash
cd contracts
npm run test:report
```

- **Watch mode (re-runs when `.clar` or test files change):**

```bash
cd contracts
npm run test:watch
```

The sample test in `token-contract.test.ts` demonstrates how to access the Clarinet `simnet` environment and accounts. Extend this file with additional tests for your contract behavior (minting, transfers, etc.).

---

## Deploying contracts

The deployment flow is scripted in `contracts/scripts/deploy.ts` and is exposed via an NPM script.

From the `contracts/` directory:

```bash
cd contracts
npm run deploy
```

What this does:

- Loads environment variables from `.env`.
- Determines the target network based on `STACKS_NETWORK` (`mainnet` or `testnet`).
- Deploys, in order:
  1. **`sip-010-trait.clar`** as the trait contract.
  2. **`token-contract.clar`** as the fungible token implementation, with a **unique name per deployment**:
     - Contract name format: `token-contract-<timestamp>`.
- Logs:
  - The network being targeted.
  - The transaction IDs for each deployment.
  - Explorer links (via `https://explorer.hiro.so`) for quick verification.

If deployment fails (e.g., missing env vars, insufficient balance, invalid key), the script prints an error and exits with a non‑zero code.

---

## Contract overview

The main token contract (`token-contract.clar`) implements:

- **Token definition**
  - `define-fungible-token clarity-coin`
  - Name: **"Clarity Coin"**
  - Symbol: **"CC"**
  - Decimals: **6** (i.e., 1 token = 1_000_000 base units)

- **Read-only SIP‑010 interfaces**
  - `get-balance (who principal)` → current balance of `who`.
  - `get-total-supply ()` → total supply of `clarity-coin`.
  - `get-name ()`, `get-symbol ()`, `get-decimals ()` → token metadata.
  - `get-token-uri ()` → optional metadata URI.

- **Admin / owner-only operations**
  - `set-token-uri (value (string-utf8 256))`
    - Only callable by the contract owner.
    - Updates the `token-uri` data-var.
    - Emits a metadata update notification (SIP‑019 style).
  - `mint (amount uint) (recipient principal)`
    - Only callable by the contract owner.
    - Mints new tokens to `recipient`.

- **Transfers**
  - `transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))`
    - Enforces that `sender` matches `tx-sender` or `contract-caller`.
    - Calls `ft-transfer?` internally.
    - Optionally logs the `memo` buffer.

---

## Local development tips

- **Clarinet console** (if Clarinet is installed):
  - From `contracts/`, you can open a REPL and interact with contracts:

    ```bash
    clarinet console
    ```

  - Use it to call contract functions, inspect state, and prototype interactions.

- **Extending tests**:
  - Use `simnet.callPublicFn`, `simnet.callReadOnlyFn`, and `simnet.mineBlock` (see Clarinet JS docs) to simulate transactions and blocks.
  - Add assertions around balances, minting limits, and access control.

---

## Scripts reference

All scripts live in `contracts/package.json`:

- **`npm test`**: Run unit tests once using `vitest`.
- **`npm run test:report`**: Run tests with coverage and cost reporting.
- **`npm run test:watch`**: Watch `.clar` and test files, re-running `test:report` on changes.
- **`npm run deploy`**: Deploy SIP‑010 trait and token contracts to the configured Stacks network.

---

## Frontend (React + Vite)

A full-featured UI is available under `frontend/` that integrates **Reown AppKit (WalletConnect)** for secure wallet connections and transaction signing. The frontend supports:

- **Wallet Connection** via Reown AppKit (WalletConnect)
- **Contract Deployment** directly from the browser using your connected wallet
- **Contract Interactions** (mint, transfer, approve, etc.) with wallet signing
- **Read-only Queries** (token metadata, balances, supply)
- **Transaction History** tracking
- **Contract Templates** for quick deployment

### Setup and Installation

```bash
cd frontend
npm install
npm run dev          # start Vite dev server (usually http://localhost:5173)
```

### Environment Configuration

Copy `frontend/env.example` to `frontend/.env` and configure:

```bash
# Network configuration
VITE_STACKS_NETWORK=testnet          # or "mainnet"
VITE_STACKS_API_URL=                 # optional API URL override

# Contract configuration (for read-only queries)
VITE_CONTRACT_ADDRESS=ST...          # your deployed contract address
VITE_CONTRACT_NAME=token-contract    # your deployed contract name

# Reown AppKit (WalletConnect) - REQUIRED for wallet features
VITE_REOWN_PROJECT_ID=your-project-id-here
```

**Getting a Reown Project ID:**
1. Visit [https://cloud.reown.com](https://cloud.reown.com)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID to `VITE_REOWN_PROJECT_ID` in `.env`

### WalletConnect / Reown AppKit Integration

The frontend uses **Reown AppKit** (formerly WalletConnect) to enable secure wallet connections without exposing private keys.

#### Features Enabled by WalletConnect:

1. **Wallet Connection**
   - Connect to Stacks wallets (Hiro Wallet, Xverse, etc.)
   - Supports both Mainnet and Testnet
   - Connection persists across page refreshes
   - Secure connection via WalletConnect protocol

2. **Contract Deployment**
   - Deploy Clarity contracts directly from the browser
   - No private keys required - transactions signed by your wallet
   - Choose from contract templates or write your own
   - Configure transaction fees and Clarity version

3. **Contract Interactions**
   - Call public contract functions (mint, transfer, approve, etc.)
   - All transactions signed by your connected wallet
   - Real-time transaction status updates
   - Transaction history tracking

4. **Transaction History**
   - View all transactions from your connected wallet
   - Filter by network and transaction type
   - Direct links to Stacks Explorer

#### Using WalletConnect in the App:

**1. Connect Your Wallet:**
   - Click the "Connect Wallet" button in the header
   - Reown AppKit modal opens
   - Select your Stacks wallet (Hiro, Xverse, etc.)
   - Approve the connection in your wallet
   - Your wallet address will be displayed

**2. Deploy Contracts:**
   - Navigate to the "Deploy Smart Contract" section
   - Select a template or paste your Clarity code
   - Enter contract name and configure settings
   - Click "Deploy Contract"
   - Approve the transaction in your wallet
   - View transaction ID and explorer link

**3. Interact with Contracts:**
   - Configure contract address and name
   - Use the "Interact with Contract" section
   - Call functions like:
     - **Mint Tokens** (owner only)
     - **Transfer Tokens**
     - **Approve Spender**
     - **Transfer From** (with approval)
     - **Pause/Unpause Minting** (admin)
   - All transactions require wallet approval

**4. View Transaction History:**
   - Scroll to "Transaction History" section
   - View all transactions from your connected wallet
   - Click "Refresh" to update
   - Click "View →" to open in Stacks Explorer

#### Supported Wallets:

Any Stacks wallet that supports WalletConnect protocol:
- **Hiro Wallet** (mobile & extension)
- **Xverse Wallet**
- **Leather Wallet** (formerly Stacks Wallet)
- Other WalletConnect-compatible Stacks wallets

#### Network Support:

- ✅ **Stacks Mainnet** - Full production support
- ✅ **Stacks Testnet** - Development and testing

Switch networks using the network selector in the UI. Your wallet will be prompted to switch networks when needed.

#### Security Notes:

- **No Private Keys**: Private keys never leave your wallet
- **User Approval**: All transactions require explicit approval in your wallet
- **Secure Protocol**: Uses WalletConnect's secure protocol for communication
- **Local Storage**: Only connection state is stored locally (no sensitive data)

#### Code Examples:

**Using the `useWallet` hook:**
```typescript
import { useWallet } from "./components/WalletConnect";

function MyComponent() {
  const { address, isConnected, connect, disconnect } = useWallet();
  
  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

**Deploying a contract:**
```typescript
import { useContractDeploy } from "./hooks/useContractDeploy";

function DeployComponent() {
  const { deploy, isDeploying, lastTxId } = useContractDeploy();
  
  const handleDeploy = async () => {
    const txId = await deploy({
      contractName: "my-contract",
      contractSource: "(define-public (hello) (ok \"world\"))",
      network: "testnet",
      fee: 150000,
    });
    console.log("Deployed:", txId);
  };
  
  return <button onClick={handleDeploy} disabled={isDeploying}>
    {isDeploying ? "Deploying..." : "Deploy"}
  </button>;
}
```

**Calling contract functions:**
```typescript
import { useContractCall } from "./hooks/useContractCall";
import { uintCV, standardPrincipalCV } from "@stacks/transactions";

function InteractComponent() {
  const { call, isCalling } = useContractCall();
  
  const handleMint = async () => {
    await call({
      contractAddress: "ST...",
      contractName: "token-contract",
      functionName: "mint",
      functionArgs: [uintCV(1000000), standardPrincipalCV("ST...")],
      network: "testnet",
    });
  };
  
  return <button onClick={handleMint} disabled={isCalling}>
    Mint Tokens
  </button>;
}
```

For more details, see [REOWN_APPKIT_INTEGRATION.md](./REOWN_APPKIT_INTEGRATION.md).

---

## Hiro Chainhooks (webhook listener)

This repo integrates **Hiro Chainhooks** to monitor on-chain activity for your SIP-010 token contracts. Chainhooks watch the Stacks blockchain and POST events to your webhook server when `mint` or `transfer` calls occur.

### Deployed Contracts

**Mainnet:**
- Contract: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.token-contract-v2-1766049545741`
- Trait: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.sip-010-trait`

**Testnet:**
- Contract: `ST1EQNTKNRGME36P9EEXZCFFNCYBA50VN6SHNZ40.token-contract-1765968837127`
- Trait: `ST1EQNTKNRGME36P9EEXZCFFNCYBA50VN6SHNZ40.sip-010-trait`

### Chainhook Definitions

Two YAML configs are provided:

- **`ops/chainhooks/token-contract.yaml`** (testnet)
  - Watches testnet contract `mint` and `transfer` calls
  - Contract: `ST1EQNTKNRGME36P9EEXZCFFNCYBA50VN6SHNZ40.token-contract-1765968837127`

- **`ops/chainhooks/token-contract-mainnet.yaml`** (mainnet)
  - Watches mainnet contract v2 `mint` and `transfer` calls
  - Contract: `SP1EQNTKNRGME36P9EEXZCFFNCYBA50VN51676JB.token-contract-v2-1766049545741`

Both configs need:
- `delivery.url`: your deployed webhook endpoint (e.g., `https://your-app.railway.app/hooks/stacks`)
- `delivery.secret`: shared secret matching `CHAINHOOK_SECRET` in `hooks-server/.env`

### Webhook Server (Node/Express)

- **Location**: `hooks-server/`
- **Quick start**:

  ```bash
  cd hooks-server
  cp env.example .env   # set CHAINHOOK_SECRET and PORT
  npm install
  npm run dev           # starts on PORT (default 3001)
  ```

- **Endpoints**:
  - `POST /hooks/stacks` — receives Chainhook events
    - Verifies HMAC signature if `CHAINHOOK_SECRET` is set
    - Stores events in memory (up to `MAX_EVENTS`, default 500)
  - `GET /activity` — returns recent events
    - Query params: `?limit=50&network=mainnet&txid=...`
  - `GET /health` — health check

### Frontend Integration

The React frontend can display activity from Chainhooks:

- Set `VITE_HOOKS_SERVER_URL` in `frontend/.env` (e.g., `http://localhost:3001` or your deployed URL)
- The UI will fetch and display recent `mint`/`transfer` events from `GET /activity`

### Registering Chainhooks

1. **Deploy your webhook server** (public HTTPS):
   - Options: Railway, Render, Fly.io, or your own VPS
   - Ensure `POST /hooks/stacks` is accessible

2. **Update chainhook YAML files**:
   - Set `delivery.url` to your webhook endpoint
   - Set `delivery.secret` to match `CHAINHOOK_SECRET` in `hooks-server/.env`

3. **Register with Hiro Chainhooks service**:
   - Use the Hiro Chainhooks CLI/API to register each YAML config
   - Start with testnet (`token-contract.yaml`) for testing

4. **Verify**:
   - Trigger `mint` or `transfer` calls on your contract
   - Check `GET /activity` endpoint for new events
   - View activity in the frontend UI

---

## License

This project is licensed under the terms specified in `LICENSE`.
