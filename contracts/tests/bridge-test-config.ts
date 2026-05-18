/**
 * Bridge Test Configuration
 * Centralised constants for SIP-009 cross-chain bridge tests on Stacks Network
 *
 * @module bridge-test-config
 */

export const BRIDGE_TEST_CONFIG = {
  // -------------------------------------------------------------------------
  // Timing and limits
  // -------------------------------------------------------------------------
  /** Default request timeout in Stacks blocks (~1 day at 10-min block time) */
  DEFAULT_TIMEOUT: 144,
  /** Maximum number of validators that can be registered */
  MAX_VALIDATORS: 10,
  /** Minimum number of validators required for consensus */
  MIN_VALIDATORS: 3,
  /** Default number of validator signatures required to confirm a request */
  DEFAULT_SIGNATURE_THRESHOLD: 3,

  // -------------------------------------------------------------------------
  // Chain fee configuration (in micro-STX)
  // -------------------------------------------------------------------------
  CHAIN_FEES: {
    ethereum: 1_000_000,
    polygon:  500_000,
    arbitrum: 750_000,
    optimism: 600_000,
  },

  // -------------------------------------------------------------------------
  // Minimum confirmations per chain
  // -------------------------------------------------------------------------
  CHAIN_CONFIRMATIONS: {
    ethereum: 12,
    polygon:  20,
    arbitrum:  8,
    optimism: 10,
  },

  // -------------------------------------------------------------------------
  // Test destination addresses (one per supported chain)
  // -------------------------------------------------------------------------
  TEST_ADDRESSES: {
    ethereum: '0x1234567890123456789012345678901234567890',
    polygon:  '0x2234567890123456789012345678901234567890',
    arbitrum: '0x3234567890123456789012345678901234567890',
    optimism: '0x4234567890123456789012345678901234567890',
  },

  // -------------------------------------------------------------------------
  // Bridge error codes (must match sip-009-bridge.clar)
  // -------------------------------------------------------------------------
  ERRORS: {
    NOT_AUTHORIZED:          401,
    TOKEN_LOCKED:            402,
    INVALID_CHAIN:           403,
    INSUFFICIENT_VALIDATORS: 404,
    BRIDGE_DISABLED:         405,
    INVALID_REQUEST:         406,
    INSUFFICIENT_BALANCE:    407,
    INVALID_SIGNATURE:       408,
    REQUEST_EXPIRED:         409,
  },

  // -------------------------------------------------------------------------
  // Property-based test settings
  // -------------------------------------------------------------------------
  /** Number of random inputs generated per property test */
  PROPERTY_TEST_RUNS: 100,
  /** Maximum shrink attempts for failing property inputs */
  SHRINK_ATTEMPTS: 1_000,

  // -------------------------------------------------------------------------
  // Stacks Network simnet test accounts
  // -------------------------------------------------------------------------
  ACCOUNTS: {
    deployer:   'deployer',
    validator1: 'wallet_1',
    validator2: 'wallet_2',
    validator3: 'wallet_3',
    user:       'wallet_4',
  },
} as const;

export type BridgeErrorCode =
  (typeof BRIDGE_TEST_CONFIG.ERRORS)[keyof typeof BRIDGE_TEST_CONFIG.ERRORS];

export type SupportedChain = keyof typeof BRIDGE_TEST_CONFIG.CHAIN_FEES;
