/**
 * Multi-Token Bridge Test Configuration
 * Centralised constants for multi-token bridge contract tests on Stacks Network
 *
 * @module multi-token-bridge-test-config
 */

export const MULTI_TOKEN_BRIDGE_TEST_CONFIG = {
  // -------------------------------------------------------------------------
  // Timing and limits
  // -------------------------------------------------------------------------
  /** Default request timeout in Stacks blocks (~1 day at 10-min block time) */
  DEFAULT_TIMEOUT: 144,
  /** Maximum number of validators per chain */
  MAX_VALIDATORS: 10,
  /** Minimum number of validators required */
  MIN_VALIDATORS: 1,
  /** Default number of validator signatures required to confirm a transaction */
  DEFAULT_SIGNATURE_THRESHOLD: 2,

  // -------------------------------------------------------------------------
  // Supported chain IDs
  // -------------------------------------------------------------------------
  TEST_CHAINS: {
    ETHEREUM: 1,
    BITCOIN:  2,
    POLYGON:  3,
    BSC:      4,
  },

  // -------------------------------------------------------------------------
  // Bridge amount limits (in micro-units)
  // -------------------------------------------------------------------------
  MIN_BRIDGE_AMOUNT: 1_000,
  MAX_BRIDGE_AMOUNT: 1_000_000,

  // -------------------------------------------------------------------------
  // Fee configuration (basis points: 100 = 1 %)
  // -------------------------------------------------------------------------
  /** Default bridge fee in basis points */
  DEFAULT_BRIDGE_FEE: 100,
  /** Maximum allowed bridge fee in basis points (10 %) */
  MAX_BRIDGE_FEE: 1_000,

  // -------------------------------------------------------------------------
  // Validator stake settings
  // -------------------------------------------------------------------------
  MIN_STAKE_AMOUNT: 1_000,
  MAX_STAKE_AMOUNT: 100_000,

  // -------------------------------------------------------------------------
  // Validator reputation settings
  // -------------------------------------------------------------------------
  DEFAULT_REPUTATION: 100,
  MIN_REPUTATION:       0,
  MAX_REPUTATION:     100,

  // -------------------------------------------------------------------------
  // Test destination addresses
  // -------------------------------------------------------------------------
  TEST_ADDRESSES: {
    ETHEREUM: '0x1234567890123456789012345678901234567890',
    BITCOIN:  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    POLYGON:  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    BSC:      '0x9876543210987654321098765432109876543210',
  },

  // -------------------------------------------------------------------------
  // Error codes (must match multi-token-bridge.clar)
  // -------------------------------------------------------------------------
  ERRORS: {
    UNAUTHORIZED:        401,
    NOT_FOUND:           404,
    INVALID_PARAMETER:   400,
    INSUFFICIENT_BALANCE: 402,
    BRIDGE_PAUSED:       403,
    INVALID_CHAIN:       405,
    INVALID_SIGNATURE:   406,
  },

  // -------------------------------------------------------------------------
  // Property-based test settings
  // -------------------------------------------------------------------------
  PROPERTY_TEST_RUNS: 100,
  SHRINK_ATTEMPTS:  1_000,
} as const;

export type MultiTokenChainId =
  (typeof MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS)[keyof typeof MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS];

export type MultiTokenBridgeError =
  (typeof MULTI_TOKEN_BRIDGE_TEST_CONFIG.ERRORS)[keyof typeof MULTI_TOKEN_BRIDGE_TEST_CONFIG.ERRORS];
