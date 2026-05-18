# Stacks Network Contract Test Suite

Comprehensive test suite for all Clarity smart contracts deployed on the Stacks Network.

## Framework

| Tool | Purpose |
|------|---------|
| [Vitest](https://vitest.dev/) | Test runner |
| [@stacks/clarinet-sdk](https://github.com/hirosystems/clarinet) | Stacks simnet environment |
| [fast-check](https://fast-check.io/) | Property-based testing |

## Running Tests

```bash
# Run all tests once
npm test

# Run with coverage and cost reports
npm run test:report

# Watch mode (re-runs on file changes)
npm run test:watch
```

## Test Organisation

```
tests/
├── helpers.ts                          # Shared Clarity value helpers
├── constants.ts                        # Shared error codes and constants
│
├── # SIP-009 NFT
├── nft-contract.test.ts                # Main NFT test suite (12 groups)
├── nft-test-config.ts                  # NFT test configuration
├── nft-test-utils.ts                   # NFT state management utilities
├── nft-generators.ts                   # Property-test generators
│
├── # SIP-010 Token
├── token-contract.test.ts              # Fungible token tests
│
├── # Wallet-X
├── wallet-x.test.ts                    # Multi-sig wallet tests
│
├── # ERC-712
├── erc-712.test.ts                     # Structured data hashing tests
├── erc-712-enhanced.test.ts            # Enhanced ERC-712 features
│
├── # Enhanced SIP-009
├── enhanced-sip-009.test.ts            # Enhanced NFT features
├── enhanced-sip-009-improvements.test.ts  # Gas optimisation improvements
│
├── # Multi-Token NFT (ERC-1155-like)
├── multi-token-nft.test.ts             # Multi-token NFT tests
│
├── # SIP-009 Cross-Chain Bridge
├── sip-009-bridge.test.ts              # Main bridge test suite (8 properties)
├── bridge-test-config.ts               # Bridge configuration
├── bridge-test-utils.ts                # BridgeTestUtils class
├── bridge-generators.ts                # fast-check generators
├── bridge-fee-tests.test.ts            # Fee calculation tests
├── bridge-validator-tests.test.ts      # Validator management tests
├── bridge-config-tests.test.ts         # Configuration tests
├── bridge-lifecycle-tests.test.ts      # Request lifecycle tests
├── bridge-error-tests.test.ts          # Error handling tests
├── bridge-emergency-tests.test.ts      # Emergency operation tests
├── bridge-timeout-tests.test.ts        # Timeout handling tests
├── bridge-batch-tests.test.ts          # Batch operation tests
├── bridge-statistics-tests.test.ts     # Statistics tracking tests
├── bridge-integration-tests.test.ts    # End-to-end integration tests
│
└── # Multi-Token Bridge
    ├── multi-token-bridge-test-config.ts
    ├── multi-token-bridge-test-utils.ts
    ├── multi-token-bridge-generators.ts
    ├── multi-token-bridge-config.test.ts
    ├── multi-token-bridge-property.test.ts
    ├── multi-token-bridge-transactions.test.ts
    ├── multi-token-bridge-validators.test.ts
    ├── multi-token-bridge-complete.test.ts
    ├── multi-token-bridge-edge-cases.test.ts
    ├── multi-token-bridge-errors.test.ts
    ├── multi-token-bridge-security.test.ts
    ├── multi-token-bridge-audit.test.ts
    ├── multi-token-bridge-multichain.test.ts
    ├── multi-token-bridge-integration.test.ts
    ├── multi-token-bridge-stress.test.ts
    ├── multi-token-bridge-performance.test.ts
    ├── multi-token-bridge-signatures.test.ts
    ├── multi-token-bridge-queries.test.ts
    └── multi-token-bridge-final.test.ts
```

## Test Patterns

### Unit Tests
Verify specific contract functions with known inputs and expected outputs.

### Property-Based Tests
Use `fast-check` to generate random inputs and verify universal invariants.
Each property test runs 100 iterations by default (configurable via `PROPERTY_TEST_RUNS`).

### Integration Tests
Exercise multi-step workflows across multiple contract functions.

### Error Tests
Verify that every invalid input and access-control violation returns the correct error code.

## Shared Utilities

- **`helpers.ts`** – Clarity value constructors (`principal`, `uint`, `str`, etc.) and assertion helpers
- **`constants.ts`** – Error codes, account keys, and default test data
- **`nft-test-utils.ts`** – NFT state capture, invariant validation, batch helpers
- **`bridge-test-utils.ts`** – `BridgeTestUtils` class for SIP-009 bridge interactions
- **`multi-token-bridge-test-utils.ts`** – `MultiTokenBridgeTestUtils` class

## Stacks Network Simnet Accounts

| Key | Role |
|-----|------|
| `deployer` | Contract owner / deployer |
| `wallet_1` | Primary test user / validator |
| `wallet_2` | Secondary test user / validator |
| `wallet_3` | Tertiary test user / validator |
| `wallet_4` | Additional test user / validator |
