# WalletX Contract Interaction Guide

This guide explains how to interact with the WalletX multi-signature wallet contract using the provided scripts.

## Overview

WalletX is a multi-signature wallet system that supports:
- **Admin roles**: Can create wallets, onboard members, manage funds
- **Member roles**: Can withdraw funds up to their spend limit
- **Organization management**: Admins can freeze/unfreeze members, adjust spend limits
- **Transaction tracking**: All member withdrawals are recorded

## Prerequisites

1. **Environment Setup**: Create a `.env` file in the contracts directory:
```bash
# Required
PRIVATE_KEY=your_64_character_hex_private_key
WALLET_CONTRACT=ST1ABC...XYZ.wallet-x-123456789
CONTRACT_ADDRESS=ST1ABC...XYZ.token-contract-123456789

# Optional (with defaults)
STACKS_NETWORK=testnet  # or mainnet
```

**Example based on your current .env:**
```bash
PRIVATE_KEY=your_64_character_hex_private_key_here
STACKS_NETWORK=testnet
CONTRACT_ADDRESS=ST8DAC2FHJFX599JR491PEAEM0CAXP95JXZ00MBD.token-contract-1765800894281
WALLET_CONTRACT=ST8DAC2FHJFX599JR491PEAEM0CAXP95JXZ00MBD.wallet-x-1765958506578
```

2. **Install Dependencies**:
```bash
cd contracts
npm install
```

## Available Scripts

### 1. Interactive Script (`interact-wallet-x.ts`)

The main interaction script supports all wallet functions:

```bash
# Show help
npm run interact-wallet help

# Admin functions
npm run interact-wallet register-wallet "My Company" 1000000
npm run interact-wallet onboard-member ST1ABC...XYZ "John Doe" 50000 1
npm run interact-wallet reimburse-wallet 500000
npm run interact-wallet reimburse-member 1 25000
npm run interact-wallet freeze-member ST1ABC...XYZ
npm run interact-wallet unfreeze-member ST1ABC...XYZ
npm run interact-wallet remove-member ST1ABC...XYZ

# Member functions (requires member's private key)
npm run interact-wallet withdraw 10000 ST1RECEIVER...ADDRESS

# Query functions
npm run interact-wallet wallet-info ST1ADMIN...ADDRESS
npm run interact-wallet member-info ST1MEMBER...ADDRESS
npm run interact-wallet members ST1ADMIN...ADDRESS
npm run interact-wallet active-members ST1ADMIN...ADDRESS
npm run interact-wallet member-transactions ST1MEMBER...ADDRESS
```

### 2. Demo Script (`wallet-x-demo.ts`)

Automated demo showing complete workflow:

```bash
npm run wallet-demo
```

The demo will:
1. Register an admin wallet
2. Check wallet information
3. Onboard a member
4. Show member management functions
5. Demonstrate freeze/unfreeze operations
6. Display final status

## Workflow Examples

### Setting Up a New Organization

1. **Register Admin Wallet**:
```bash
npm run interact-wallet register-wallet "Acme Corp Wallet" 1000000
```

2. **Verify Wallet Creation**:
```bash
npm run interact-wallet wallet-info ST1YOUR...ADDRESS
```

3. **Onboard First Member**:
```bash
npm run interact-wallet onboard-member ST1MEMBER...ADDRESS "Alice Smith" 100000 1
```

4. **Check Organization Members**:
```bash
npm run interact-wallet members ST1YOUR...ADDRESS
```

### Managing Members

1. **Add More Funds to Member**:
```bash
npm run interact-wallet reimburse-member 1 50000
```

2. **Freeze Member (Emergency)**:
```bash
npm run interact-wallet freeze-member ST1MEMBER...ADDRESS
```

3. **Unfreeze Member**:
```bash
npm run interact-wallet unfreeze-member ST1MEMBER...ADDRESS
```

4. **Remove Member**:
```bash
npm run interact-wallet remove-member ST1MEMBER...ADDRESS
```

### Member Operations

Members need their own private key to perform withdrawals:

1. **Set Member's Private Key** in `.env`:
```bash
PRIVATE_KEY=member_private_key_here
```

2. **Perform Withdrawal**:
```bash
npm run interact-wallet withdraw 25000 ST1RECEIVER...ADDRESS
```

3. **Check Transaction History**:
```bash
npm run interact-wallet member-transactions ST1MEMBER...ADDRESS
```

## Contract Functions Reference

### Admin Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `register-wallet` | Create new admin wallet | name, initial_amount |
| `onboard-member` | Add member to organization | member_address, name, spend_limit, member_id |
| `reimburse-wallet` | Add funds to admin wallet | amount |
| `reimburse-member` | Increase member spend limit | member_id, amount |
| `remove-member` | Deactivate member | member_address |
| `freeze-member` | Prevent member withdrawals | member_address |
| `unfreeze-member` | Allow member withdrawals | member_address |

### Member Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `member-withdrawal` | Withdraw funds | amount, receiver_address |

### Query Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `get-wallet-admin` | Get admin wallet info | admin_address |
| `get-admin-role` | Check admin role | address |
| `get-members` | List organization members | admin_address |
| `get-member` | Get member details | member_address |
| `get-member-transactions` | Get member transaction history | member_address |
| `get-active-members` | List active members only | admin_address |

## Error Codes

The contract uses these error codes:

- `u100`: Not admin
- `u101`: Wallet already exists
- `u102`: Insufficient funds
- `u103`: Member not active
- `u104`: Member frozen
- `u105`: Insufficient spend limit
- `u106`: Member not found
- `u107`: Not authorized
- `u108`: Member already frozen
- `u109`: Member not frozen
- `u110`: Token transfer failed

## Security Notes

1. **Private Key Management**: Never share private keys. Each member should have their own key.

2. **Admin Responsibilities**: Admins control all funds and member permissions. Use admin functions carefully.

3. **Member Limits**: Members can only withdraw up to their spend limit. Monitor and adjust as needed.

4. **Frozen Members**: Frozen members cannot withdraw funds but remain in the organization.

5. **Transaction Tracking**: All member withdrawals are permanently recorded on-chain.

## Troubleshooting

### Common Issues

1. **"Not admin" error**: Ensure you're using the admin's private key for admin functions.

2. **"Member not found" error**: Verify the member address is correct and has been onboarded.

3. **"Insufficient funds" error**: Check wallet balance and member spend limits.

4. **"Member frozen" error**: Unfreeze the member before they can withdraw.

### Network Issues

1. **Transaction fails**: Check network status and try increasing the fee.

2. **Slow confirmation**: Testnet can be slow. Wait a few minutes and check the explorer.

3. **Wrong network**: Ensure `STACKS_NETWORK` in `.env` matches your intended network.

## Advanced Usage

### Multiple Organizations

Each admin address can have one wallet. To manage multiple organizations:

1. Use different admin addresses (different private keys)
2. Deploy separate contract instances
3. Use different `CONTRACT_ADDRESS` values

### Integration with Other Contracts

The wallet contract accepts any SIP-010 compliant token:

```typescript
// Example: Using different token contract
const functionArgs = [
  stringUtf8CV("My Wallet"),
  uintCV("1000000"),
  contractPrincipalCV("ST1ABC...XYZ", "my-custom-token")
];
```

### Batch Operations

For multiple operations, create custom scripts that call multiple functions in sequence with appropriate delays.

## Support

For issues or questions:
1. Check the contract source code in `contracts/wallet-x.clar`
2. Review transaction details in the Stacks Explorer
3. Test operations on testnet before mainnet deployment

## License

This code is provided as-is for educational and development purposes.