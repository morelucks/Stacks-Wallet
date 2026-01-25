# NFT Contract Test Documentation

## Overview

This document describes the comprehensive test suite for the NFT contract (`nft-contract.clar`) that implements the SIP-009 NFT trait. The test suite includes both unit tests and property-based tests to ensure contract correctness.

## Test Structure

### Test Files

- `nft-contract.test.ts` - Main test file with all NFT contract tests
- `helpers.ts` - Common test utilities and NFT-specific helper functions
- `nft-generators.ts` - Property test data generators
- `README-NFT-TESTS.md` - This documentation file

### Test Organization

The tests are organized into logical groups:

1. **Test Setup** - Basic configuration and account setup
2. **Minting Operations** - Token creation functionality
3. **Minting Access Control** - Authorization for minting
4. **Transfer Operations** - Token transfer functionality
5. **Transfer Access Control** - Authorization for transfers
6. **Ownership Queries** - Owner lookup functionality
7. **Token ID Tracking** - Last token ID management
8. **Token URI** - URI retrieval functionality
9. **Error Handling** - Error conditions and edge cases
10. **Edge Cases and Boundaries** - Boundary condition testing
11. **Integration Tests** - Multi-operation scenarios

## Test Types

### Unit Tests

Unit tests verify specific functionality with known inputs and expected outputs:

- Test specific examples (first token mint, basic transfer)
- Test error conditions (non-owner access, invalid tokens)
- Test edge cases (zero values, non-existent tokens)
- Test integration scenarios (mint then transfer sequences)

### Property-Based Tests

Property-based tests verify universal properties across all valid inputs:

- **Property 1**: Minting creates sequential tokens with correct ownership
- **Property 2**: Non-owner minting is rejected
- **Property 3**: Sequential minting produces consecutive IDs
- **Property 4**: Owner can transfer tokens successfully
- **Property 5**: Non-owner transfers are rejected
- **Property 6**: Invalid token operations fail gracefully
- **Property 7**: Ownership queries return correct results
- **Property 8**: Last token ID tracking is accurate
- **Property 9**: Transfers preserve token count
- **Property 10**: System maintains consistency under all operations

## Helper Functions

### NFT-Specific Helpers

```typescript
// Assert token ownership
assertNFTOwnership(contractName, tokenId, expectedOwner, caller?)

// Assert token doesn't exist
assertNFTNotExists(contractName, tokenId, caller?)

// Mint token helper
mintNFT(contractName, recipient, minter?)

// Transfer token helper
transferNFT(contractName, tokenId, sender, recipient, caller)

// Get last token ID
getLastTokenId(contractName, caller?)

// Assert error code
assertNFTError(result, expectedErrorCode)
```

### Test Data Generation

```typescript
// Generate valid/invalid token IDs
generateValidTokenId(maxTokens?)
generateInvalidTokenId(maxTokens?)

// Generate principals
generatePrincipal()
generateUniquePrincipals(count)

// Generate operation sequences
generateMintSequence(count, principals)
generateTransferSequence(tokenOwners, principals, count)
generateOperationSequence(principals, operationCount)
```

## Error Codes

The NFT contract defines these error codes:

- `ERR-OWNER-ONLY (u100)` - Non-owner attempted restricted operation
- `ERR-NOT-TOKEN-OWNER (u101)` - Non-owner attempted token transfer
- `ERR-TOKEN-EXISTS (u102)` - Reserved for future use
- `ERR-TOKEN-NOT-FOUND (u103)` - Reserved for future use

## Running Tests

### Prerequisites

- Node.js and npm installed
- Clarinet SDK configured
- Vitest test runner

### Commands

```bash
# Run all NFT tests
npm test nft-contract.test.ts

# Run specific test group
npm test -- --grep "Minting Operations"

# Run with coverage
npm test -- --coverage

# Run property tests only
npm test -- --grep "Property"
```

## Test Configuration

### Property Test Settings

```typescript
const PROPERTY_TEST_CONFIG = {
  iterations: 100,        // Number of test iterations
  maxTokens: 50,         // Maximum tokens in test scenarios
  maxPrincipals: 10,     // Maximum principals in test scenarios
  maxOperations: 20      // Maximum operations in sequences
};
```

### Test Accounts

Tests use these predefined accounts:
- `deployer` - Contract owner, can mint tokens
- `user1`, `user2`, `user3` - Regular users for testing

## Best Practices

### Writing New Tests

1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** in describe blocks
3. **Use helper functions** to reduce code duplication
4. **Test both success and failure cases**
5. **Verify state changes** after operations
6. **Use property tests** for universal behaviors

### Test Data

1. **Use generators** for property tests
2. **Create realistic scenarios** that match real usage
3. **Test edge cases** and boundary conditions
4. **Verify error conditions** return correct codes

### Assertions

1. **Use specific assertions** (expectEqual vs generic expect)
2. **Check both return values and state changes**
3. **Verify error codes** match expected values
4. **Test ownership changes** after transfers

## Troubleshooting

### Common Issues

1. **Test timeouts** - Reduce iteration counts or operation complexity
2. **Account conflicts** - Ensure fresh state in beforeEach
3. **State pollution** - Use separate test instances
4. **Generator failures** - Add bounds checking to generators

### Debugging

1. **Add console.log** statements to trace execution
2. **Use smaller test datasets** to isolate issues
3. **Check contract state** with read-only functions
4. **Verify test account setup** in beforeEach blocks

## Coverage Goals

The test suite aims for:
- **100% function coverage** - All contract functions tested
- **100% branch coverage** - All code paths tested
- **100% error coverage** - All error conditions tested
- **Property validation** - All correctness properties verified

## Maintenance

### Adding New Tests

1. Follow existing patterns and organization
2. Add appropriate helper functions if needed
3. Update this documentation
4. Ensure tests pass consistently

### Updating Tests

1. Maintain backward compatibility where possible
2. Update related tests when contract changes
3. Verify property tests still hold
4. Update documentation as needed

## Additional Test Utilities

### State Management

The test suite includes utilities for capturing and comparing contract state:

```typescript
// Capture current state
const state = captureContractState('nft-contract', 100);

// Compare states
const changes = compareContractStates(stateBefore, stateAfter);

// Validate invariants
validateContractInvariants('nft-contract', state);
```

### Batch Operations

Utilities for testing multiple operations:

```typescript
// Batch mint tokens
const tokenIds = batchMintNFTs('nft-contract', [user1, user2, user3]);

// Verify multiple ownerships
verifyTokenOwnership('nft-contract', [
  { tokenId: 1, owner: user1 },
  { tokenId: 2, owner: user2 }
]);
```

### Advanced Generators

Generators for complex test scenarios:

```typescript
// Generate boundary values
const boundaryIds = generateBoundaryTokenIds();

// Generate ownership chains
const chains = generateOwnershipChains(5, [user1, user2], 3);
```

## Test Coverage Metrics

Current test coverage includes:
- ✅ Basic minting functionality
- ✅ Minting access control
- ✅ Token transfer operations
- ✅ Transfer access control
- ✅ Ownership queries
- ✅ Token ID tracking
- ✅ Token URI functionality
- ✅ Error handling
- ✅ Edge cases and boundaries
- ✅ Integration scenarios
- ✅ Performance testing
- ✅ State validation
- ✅ Invariant checking