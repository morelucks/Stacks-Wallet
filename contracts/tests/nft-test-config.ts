/**
 * NFT Test Configuration
 * Centralised constants for SIP-009 NFT contract tests on Stacks Network
 *
 * @module nft-test-config
 */

export const NFT_TEST_CONFIG = {
  // -------------------------------------------------------------------------
  // Test execution settings
  // -------------------------------------------------------------------------
  /** Maximum milliseconds allowed per test */
  timeout: 30_000,
  /** Number of retry attempts for flaky tests */
  retries: 3,

  // -------------------------------------------------------------------------
  // Property-based test settings
  // -------------------------------------------------------------------------
  /** Number of random inputs generated per property test */
  propertyIterations: 100,

  // -------------------------------------------------------------------------
  // Data limits
  // -------------------------------------------------------------------------
  /** Maximum number of tokens minted in a single test scenario */
  maxTokens: 50,
  /** Maximum number of distinct principals used in a test scenario */
  maxPrincipals: 10,
  /** Maximum number of sequential operations in a scenario */
  maxOperations: 20,
  /** Maximum depth of an ownership-transfer chain */
  maxChainLength: 5,

  // -------------------------------------------------------------------------
  // SIP-009 error codes (must match nft-contract.clar)
  // -------------------------------------------------------------------------
  errorCodes: {
    /** Caller is not the contract owner */
    ERR_OWNER_ONLY: 100,
    /** Caller does not own the token being transferred */
    ERR_NOT_TOKEN_OWNER: 101,
    /** Token with this ID already exists */
    ERR_TOKEN_EXISTS: 102,
    /** Token with this ID does not exist */
    ERR_TOKEN_NOT_FOUND: 103,
  },

  // -------------------------------------------------------------------------
  // Stacks Network simnet test accounts
  // -------------------------------------------------------------------------
  accounts: {
    /** Contract deployer / owner */
    deployer: 'deployer',
    /** Primary test user */
    user1: 'wallet_1',
    /** Secondary test user */
    user2: 'wallet_2',
    /** Tertiary test user */
    user3: 'wallet_3',
    /** Additional test user */
    user4: 'wallet_4',
  },
} as const;

export type NFTErrorCode = (typeof NFT_TEST_CONFIG.errorCodes)[keyof typeof NFT_TEST_CONFIG.errorCodes];
