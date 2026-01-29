# WalletConnect Integration Analysis

## Current State

### ✅ What's Already Integrated

1. **Reown AppKit** (formerly WalletConnect)
   - `@reown/appkit` v1.8.15
   - `@reown/appkit-adapter-wagmi` v1.8.15
   - Wagmi adapter configured

2. **Wagmi Configuration**
   - Wagmi adapter set up with project ID
   - Networks configured (mainnet, arbitrum, sepolia)
   - QueryClient configured

3. **AppKit Provider**
   - WagmiProvider wrapper
   - QueryClientProvider for state management
   - AppKit initialization in init.ts

4. **Stacks Support**
   - `@stacks/connect` v8.2.4
   - `@stacks/transactions` v7.3.1
   - `@stacks/network` v7.3.1
   - Basic Stacks network configuration

### ❌ What's Missing

1. **Stacks-Specific WalletConnect Integration**
   - No Stacks network in AppKit configuration
   - Wagmi is EVM-focused (Ethereum, Arbitrum, Sepolia)
   - No Stacks wallet connection UI

2. **Stacks Connect Integration**
   - `@stacks/connect` is installed but not used
   - No wallet connection hooks
   - No Stacks-specific wallet provider

3. **UI Components**
   - No wallet connection button
   - No wallet display component
   - No transaction status display

4. **Hooks & Context**
   - No useWallet hook
   - No useStacksWallet hook
   - No transaction management hooks

5. **Error Handling**
   - No error boundaries
   - No transaction error handling
   - No wallet connection error handling

## Problem

The current setup uses **Reown AppKit with Wagmi**, which is designed for **EVM chains** (Ethereum, Arbitrum, etc.). However, **Stacks is a Bitcoin Layer 2** and requires different wallet integration.

### Current Architecture Issues

```
Current (EVM-focused):
AppKit → Wagmi → EVM Networks (Ethereum, Arbitrum, Sepolia)
                ✗ No Stacks support

Needed (Stacks-focused):
AppKit → Stacks Connect → Stacks Network (Testnet/Mainnet)
                        → Leather Wallet
                        → Hiro Wallet
```

## Solution

We need to:

1. **Keep AppKit** for general wallet management UI
2. **Add Stacks Connect** for Stacks-specific wallet integration
3. **Create Stacks Wallet Context** for state management
4. **Add UI Components** for wallet connection and display
5. **Create Custom Hooks** for wallet operations

## Implementation Plan

### Phase 1: Core Integration
- [ ] Create StacksWalletProvider context
- [ ] Implement useStacksWallet hook
- [ ] Add wallet connection logic
- [ ] Create wallet connection button component

### Phase 2: UI Components
- [ ] Wallet connection button
- [ ] Wallet display component
- [ ] Account info display
- [ ] Network selector

### Phase 3: Transaction Management
- [ ] Transaction signing
- [ ] Transaction broadcasting
- [ ] Transaction status tracking
- [ ] Error handling

### Phase 4: Advanced Features
- [ ] Multi-wallet support
- [ ] Wallet switching
- [ ] Transaction history
- [ ] Balance display

## Files to Create/Modify

### New Files
```
frontend/src/
├── context/
│   ├── StacksWalletContext.tsx      # NEW: Stacks wallet context
│   └── AppKitProvider.tsx            # MODIFY: Add Stacks support
├── hooks/
│   ├── useStacksWallet.ts            # NEW: Stacks wallet hook
│   ├── useStacksTransaction.ts       # NEW: Transaction hook
│   └── useStacksBalance.ts           # NEW: Balance hook
├── components/
│   ├── WalletConnect/
│   │   ├── WalletConnectButton.tsx   # NEW: Connection button
│   │   ├── WalletDisplay.tsx         # NEW: Wallet info display
│   │   └── NetworkSelector.tsx       # NEW: Network selector
│   └── Transaction/
│       ├── TransactionStatus.tsx     # NEW: Tx status display
│       └── TransactionHistory.tsx    # NEW: Tx history
└── config/
    └── stacks.ts                     # MODIFY: Enhanced config
```

### Modified Files
```
frontend/src/
├── main.tsx                          # MODIFY: Add StacksWalletProvider
├── App.tsx                           # MODIFY: Add wallet UI
├── config/
│   ├── appkit.ts                     # MODIFY: Add Stacks config
│   └── stacks.ts                     # MODIFY: Enhance config
└── context/
    └── AppKitProvider.tsx            # MODIFY: Add Stacks provider
```

## Dependencies to Add

```json
{
  "@stacks/connect": "^8.2.4",        // Already installed
  "@stacks/transactions": "^7.3.1",   // Already installed
  "@stacks/network": "^7.3.1",        // Already installed
  "@stacks/auth": "^7.3.1"            // Already installed
}
```

## Next Steps

1. Create new branch: `feat/stacks-walletconnect-integration`
2. Implement StacksWalletContext
3. Create useStacksWallet hook
4. Add UI components
5. Test with Leather/Hiro wallets
6. Create PR with documentation

## References

- [Stacks Connect Documentation](https://docs.stacks.co/stacks-js/connect)
- [Leather Wallet Integration](https://leather.io/developers)
- [Hiro Wallet Integration](https://www.hiro.so/wallet)
- [Stacks.js Documentation](https://docs.stacks.co/stacks-js)
