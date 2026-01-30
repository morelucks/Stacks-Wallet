# NFT Contract Testing Design

## Overview

This design document outlines a comprehensive testing strategy for the basic NFT contract (`nft-contract.clar`) that implements the SIP-009 NFT trait. The testing suite will provide both unit tests for specific functionality and property-based tests for universal invariants, ensuring the contract behaves correctly across all scenarios.

The NFT contract provides basic functionality including minting, transferring, and ownership tracking. Our testing approach will validate each function individually and verify that the contract maintains correctness properties across all operations.

## Architecture

The testing architecture follows a layered approach:

1. **Unit Test Layer**: Tests specific functions with known inputs and expected outputs
2. **Property-Based Test Layer**: Tests universal properties that should hold across all valid inputs
3. **Integration Test Layer**: Tests interactions between multiple contract functions
4. **Error Handling Layer**: Tests edge cases and error conditions

The tests will be implemented using Vitest as the test runner and Clarinet SDK for Stacks contract interaction, following the existing patterns in the codebase.

## Components and Interfaces

### Test Structure Components

1. **NFT Test Suite** (`nft-contract.test.ts`)
   - Main test file containing all NFT contract tests
   - Organized into logical test groups (minting, transfers, ownership, errors)
   - Uses existing helper functions from `helpers.ts`

2. **Property Test Generators**
   - Token ID generators for valid ranges
   - Principal generators for different user types
   - Operation sequence generators for complex scenarios

3. **Test Data Fixtures**
   - Predefined test scenarios
   - Mock principal addresses
   - Expected error codes and messages

### Contract Interface Testing

The tests will validate the following contract interfaces:

1. **Read-Only Functions**
   - `get-last-token-id()` → `(response uint uint)`
   - `get-token-uri(uint)` → `(response (optional (string-utf8 256)) uint)`
   - `get-owner(uint)` → `(response (optional principal) uint)`

2. **Public Functions**
   - `transfer(uint, principal, principal)` → `(response bool uint)`
   - `mint(principal)` → `(response uint uint)`

## Data Models

### Test Data Structures

```typescript
interface NFTTestData {
  tokenId: number;
  owner: string;
  recipient: string;
  contractOwner: string;
}

interface TestAccounts {
  deployer: string;
  user1: string;
  user2: string;
  user3: string;
}

interface ErrorCodes {
  ERR_OWNER_ONLY: number;      // u100
  ERR_NOT_TOKEN_OWNER: number; // u101
  ERR_TOKEN_EXISTS: number;    // u102
  ERR_TOKEN_NOT_FOUND: number; // u103
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I've identified several areas where properties can be consolidated:

**Redundancy Analysis:**
- Properties 1.3 and 5.3 both test that last-token-id reflects minting operations - these can be combined
- Properties 2.1 and 2.4 both test successful transfer behavior - these can be combined  
- Properties 3.1 and 5.2 both test ownership correctness - these can be combined
- Properties 4.1 and 4.2 both test error handling - these can be combined

**Consolidated Properties:**
The final set of unique, non-redundant properties focuses on the core invariants and behaviors without overlap.

Property 1: Minting creates sequential tokens with correct ownership
*For any* valid recipient principal, when the contract owner mints a token, the contract should create a token with ID equal to (last-token-id + 1) and assign ownership to the recipient
**Validates: Requirements 1.1, 1.3, 5.3**

Property 2: Non-owner minting is rejected
*For any* non-owner principal, attempting to mint should be rejected with ERR-OWNER-ONLY error
**Validates: Requirements 1.2**

Property 3: Sequential minting produces consecutive IDs
*For any* sequence of mint operations, token IDs should be consecutive starting from 1
**Validates: Requirements 1.4, 5.1**

Property 4: Owner can transfer tokens successfully
*For any* existing token and valid recipient, when the token owner initiates a transfer, ownership should change to the recipient immediately
**Validates: Requirements 2.1, 2.4, 5.2**

Property 5: Non-owner transfers are rejected
*For any* existing token and non-owner principal, transfer attempts should be rejected with ERR-NOT-TOKEN-OWNER error
**Validates: Requirements 2.2**

Property 6: Invalid token operations fail gracefully
*For any* non-existent token ID, operations should fail with appropriate errors without corrupting state
**Validates: Requirements 2.3, 4.1, 4.2**

Property 7: Ownership queries return correct results
*For any* existing token, get-owner should return the current owner; for non-existent tokens, it should return none
**Validates: Requirements 3.1, 3.2**

Property 8: Last token ID tracking is accurate
*For any* contract state, get-last-token-id should return the highest minted token ID (or 0 if none minted)
**Validates: Requirements 3.3, 3.4**

Property 9: Transfers preserve token count
*For any* sequence of transfer operations, the total number of existing tokens should remain unchanged
**Validates: Requirements 5.4**

Property 10: System maintains consistency under all operations
*For any* sequence of valid operations, the contract should maintain all invariants (unique ownership, sequential IDs, accurate counts)
**Validates: Requirements 4.4**

## Error Handling

The NFT contract defines four error codes that must be properly tested:

1. **ERR-OWNER-ONLY (u100)**: Returned when non-owners attempt restricted operations
2. **ERR-NOT-TOKEN-OWNER (u101)**: Returned when non-owners attempt to transfer tokens
3. **ERR-TOKEN-EXISTS (u102)**: Reserved for future use (not currently used in contract)
4. **ERR-TOKEN-NOT-FOUND (u103)**: Reserved for future use (not currently used in contract)

The testing strategy will verify that appropriate errors are returned for invalid operations and that the contract state remains consistent after error conditions.

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing approaches:

**Unit Testing:**
- Unit tests verify specific examples, edge cases, and error conditions
- Tests cover concrete scenarios like minting the first token, transferring between specific users
- Integration points between contract functions are validated
- Specific error conditions are tested with known inputs

**Property-Based Testing:**
- Property tests verify universal properties that should hold across all inputs
- Each correctness property will be implemented as a property-based test
- Tests will run a minimum of 100 iterations to ensure statistical confidence
- Property tests will use fast-check as the property-based testing library for TypeScript

**Property-Based Testing Requirements:**
- Use fast-check library for generating test data and running property tests
- Configure each property test to run minimum 100 iterations
- Tag each property-based test with format: `**Feature: nft-contract-testing, Property {number}: {property_text}**`
- Each correctness property must be implemented by exactly one property-based test
- Property tests should use smart generators that constrain inputs to valid ranges

**Test Organization:**
- Tests are organized into logical groups: minting, transfers, ownership queries, error handling
- Each test group contains both unit tests and property tests
- Property tests are placed close to related unit tests for better organization
- Comprehensive edge case coverage through both approaches

### Test Data Generation

Property-based tests will use generators for:
- **Token IDs**: Valid existing tokens, non-existent tokens, boundary values
- **Principals**: Contract owner, token owners, non-owners, random addresses  
- **Operation Sequences**: Valid mint/transfer sequences, invalid operation attempts
- **Edge Cases**: Zero values, maximum values, empty states

### Validation Strategy

Each test will validate:
1. **Return Values**: Correct success/error responses
2. **State Changes**: Proper updates to contract state
3. **Invariant Preservation**: Core properties maintained after operations
4. **Error Consistency**: Appropriate error codes for invalid operations

The comprehensive testing approach ensures the NFT contract behaves correctly under all conditions and maintains its correctness properties across all possible usage scenarios.