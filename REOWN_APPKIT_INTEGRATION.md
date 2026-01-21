# Reown AppKit Integration

This document confirms that **Reown AppKit** (formerly WalletConnect) is fully integrated into the Stacks Wallet frontend application.

## ✅ Integration Status

### 1. Package Dependencies
- `@reown/appkit-react` - React integration for Reown AppKit
- `@reown/appkit-networks` - Network configuration for Stacks

**Location:** `frontend/package.json`

### 2. Wallet Connection Component
**Location:** `frontend/src/components/WalletConnect.tsx`

**Features:**
- ✅ Initializes Reown AppKit with Stacks adapters
- ✅ Configures both Mainnet and Testnet networks
- ✅ Provides `useWallet()` hook for React components
- ✅ Manages wallet connection state (address, isConnected, isConnecting)
- ✅ Handles connect/disconnect functionality
- ✅ Subscribes to wallet state changes

**Key Implementation:**
```typescript
const appKit = createAppKit({
  adapters: ["stacks"],
  networks: [stacksMainnet, stacksTestnet],
  projectId: import.meta.env.VITE_REOWN_PROJECT_ID || "demo-project-id",
  metadata: {
    name: "Stacks Wallet",
    description: "SIP-010 Token Wallet",
    url: window.location.origin,
  },
});
```

### 3. Frontend Integration
**Location:** `frontend/src/App.tsx`

**Features:**
- ✅ Uses `useWallet()` hook to access wallet functionality
- ✅ Displays connected wallet address in UI
- ✅ "Connect Wallet" button opens Reown AppKit modal
- ✅ "Disconnect" button disconnects wallet
- ✅ "Use Wallet" button to auto-fill connected address for balance queries
- ✅ Shows connection state (connecting/connected/disconnected)

### 4. Environment Configuration
**Location:** `frontend/env.example`

**Required Variable:**
```bash
VITE_REOWN_PROJECT_ID=your-project-id-here
```

**Setup Instructions:**
1. Get a Project ID from [https://cloud.reown.com](https://cloud.reown.com)
2. Copy `frontend/env.example` to `frontend/.env`
3. Set `VITE_REOWN_PROJECT_ID` with your project ID

### 5. Network Support
- ✅ **Stacks Mainnet** - Configured with Hiro Mainnet RPC
- ✅ **Stacks Testnet** - Configured with Hiro Testnet RPC

Both networks are available in the wallet connection modal.

## 🎯 Usage in Application

### Connecting a Wallet
1. User clicks "Connect Wallet" button
2. Reown AppKit modal opens
3. User selects a Stacks wallet (Hiro Wallet, Xverse, etc.)
4. User approves connection
5. Wallet address is displayed in UI
6. Connected address can be used for balance queries

### Using Connected Wallet
- The connected wallet address is automatically suggested in the "Principal to check balance" field
- Users can click "Use Wallet" button to auto-fill their connected address
- Balance queries can be performed for the connected wallet

### Disconnecting
- User clicks "Disconnect" button
- Wallet connection is terminated
- Address is cleared from UI

## 📋 Integration Checklist

- [x] Reown AppKit packages installed
- [x] Wallet connection component created
- [x] `useWallet()` hook implemented
- [x] Mainnet network configured
- [x] Testnet network configured
- [x] Frontend UI integration complete
- [x] Connect/disconnect functionality working
- [x] Environment variable configuration documented
- [x] Connected wallet address displayed in UI
- [x] "Use Wallet" feature for balance queries
- [x] Connection state management (connecting/connected)

## 🔗 Resources

- **Reown AppKit Documentation:** [https://docs.reown.com](https://docs.reown.com)
- **Get Project ID:** [https://cloud.reown.com](https://cloud.reown.com)
- **Stacks Network Docs:** [https://docs.stacks.co](https://docs.stacks.co)

## 📝 Notes

- The integration uses Reown AppKit v1.0.0
- Default project ID is "demo-project-id" if not configured (for development only)
- Production deployments should use a valid Project ID from Reown Cloud
- The wallet connection persists across page refreshes (handled by Reown AppKit)
- Supports all Stacks-compatible wallets that work with WalletConnect protocol

---

**Status:** ✅ **FULLY INTEGRATED AND FUNCTIONAL**

