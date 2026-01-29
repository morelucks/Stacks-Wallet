# SIP-009 Bridge Contract Tests

This directory contains comprehensive tests for the SIP-009 Cross-Chain Bridge Contract.

## Test Structure

### Core Test Files
- `sip-009-bridge.test.ts` - Main test suite with property-based tests
- `bridge-test-utils.ts` - Utility functions for bridge testing
- `bridge-generators.ts` - Property-based test data generators
- `bridge-test-config.ts` - Test configuration constants

### Specialized Test Suites
- `bridge-fee-tests.test.ts` - Fee calculation and discount system tests
- `bridge-validator-tests.test.ts` - Validator management and signature tests
- `bridge-error-tests.test.ts` - Error handling and edge case tests
- `bridge-lifecycle-tests.test.ts` - Request lifecycle management tests
- `bridge-config-tests.test.ts` - Configuration management tests
- `bridge-emergency-tests.test.ts` - Emergency operation tests
- `bridge-statistics-tests.test.ts` - Statistics tracking tests
- `bridge-batch-tests.test.ts` - Batch operation tests
- `bridge-timeout-tests.test.ts` - Timeout handling tests
- `bridge-integration-tests.test.ts` - End-to-end integration tests

## Property-Based Testing

The test suite uses fast-check for property-based testing with the following properties:

1. **Bridge Request State Transitions** - Validates correct state management
2. **Fee Calculation Consistency** - Ensures accurate fee calculations
3. **Token Locking Integrity** - Prevents double-locking and ensures security
4. **Validator Signature Thresholds** - Enforces consensus requirements
5. **Error Handling Completeness** - Validates proper error responses
6. **Batch Operation Atomicity** - Ensures all-or-nothing batch processing
7. **Configuration Isolation** - Verifies config changes don't affect existing requests
8. **Bridge Pause Behavior** - Tests pause/unpause functionality

## Running Tests

```bash
npm test
```

## Test Coverage

The test suite covers:
- ✅ Bridge request creation and validation
- ✅ Validator consensus mechanisms
- ✅ Fee calculation and discount systems
- ✅ Token locking and unlocking
- ✅ Administrative functions
- ✅ Emergency operations
- ✅ Batch processing
- ✅ Error handling
- ✅ Timeout management
- ✅ Statistics tracking
- ✅ Configuration management
- ✅ Integration workflows