/**
 * Shared Test Constants
 * Central registry of constants used across all Stacks Network contract tests.
 *
 * @module constants
 */

// ---------------------------------------------------------------------------
// Stacks Network simnet account keys
// ---------------------------------------------------------------------------

/** Standard simnet account key names */
export const ACCOUNTS = {
  DEPLOYER: 'deployer',
  WALLET_1: 'wallet_1',
  WALLET_2: 'wallet_2',
  WALLET_3: 'wallet_3',
  WALLET_4: 'wallet_4',
} as const;

// ---------------------------------------------------------------------------
// SIP-009 NFT error codes
// ---------------------------------------------------------------------------

/** Error codes for SIP-009 compliant NFT contracts */
export const SIP009_ERRORS = {
  ERR_OWNER_ONLY:      100,
  ERR_NOT_TOKEN_OWNER: 101,
  ERR_TOKEN_EXISTS:    102,
  ERR_TOKEN_NOT_FOUND: 103,
} as const;

// ---------------------------------------------------------------------------
// SIP-010 token error codes
// ---------------------------------------------------------------------------

/** Error codes for SIP-010 compliant fungible token contracts */
export const SIP010_ERRORS = {
  ERR_OWNER_ONLY:      100,
  ERR_NOT_TOKEN_OWNER: 101,
} as const;

// ---------------------------------------------------------------------------
// Wallet-X error codes
// ---------------------------------------------------------------------------

/** Error codes for the Wallet-X multi-signature contract */
export const WALLET_X_ERRORS = {
  ERR_NOT_ADMIN:               100,
  ERR_WALLET_EXISTS:           101,
  ERR_INSUFFICIENT_FUNDS:      102,
  ERR_MEMBER_NOT_ACTIVE:       103,
  ERR_MEMBER_FROZEN:           104,
  ERR_INSUFFICIENT_SPEND_LIMIT: 105,
} as const;

// ---------------------------------------------------------------------------
// ERC-712 error codes
// ---------------------------------------------------------------------------

/** Error codes for the ERC-712 structured data hashing contract */
export const ERC712_ERRORS = {
  ERR_UNAUTHORIZED:    401,
  ERR_INVALID_SIGNATURE: 402,
  ERR_EXPIRED:         403,
  ERR_ALREADY_USED:    404,
} as const;

// ---------------------------------------------------------------------------
// SIP-009 Bridge error codes
// ---------------------------------------------------------------------------

/** Error codes for the SIP-009 cross-chain bridge contract */
export const BRIDGE_ERRORS = {
  NOT_AUTHORIZED:          401,
  TOKEN_LOCKED:            402,
  INVALID_CHAIN:           403,
  INSUFFICIENT_VALIDATORS: 404,
  BRIDGE_DISABLED:         405,
  INVALID_REQUEST:         406,
  INSUFFICIENT_BALANCE:    407,
  INVALID_SIGNATURE:       408,
  REQUEST_EXPIRED:         409,
} as const;

// ---------------------------------------------------------------------------
// Multi-Token Bridge error codes
// ---------------------------------------------------------------------------

/** Error codes for the multi-token bridge contract */
export const MULTI_TOKEN_BRIDGE_ERRORS = {
  UNAUTHORIZED:         401,
  NOT_FOUND:            404,
  INVALID_PARAMETER:    400,
  INSUFFICIENT_BALANCE: 402,
  BRIDGE_PAUSED:        403,
  INVALID_CHAIN:        405,
  INVALID_SIGNATURE:    406,
} as const;

// ---------------------------------------------------------------------------
// Token amounts
// ---------------------------------------------------------------------------

/** Common token amounts used in tests (in micro-units, 6 decimals) */
export const TOKEN_AMOUNTS = {
  ONE:      1_000_000,
  TEN:     10_000_000,
  HUNDRED: 100_000_000,
  THOUSAND: 1_000_000_000,
} as const;

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/** Default token metadata for SIP-010 tests */
export const DEFAULT_TOKEN_METADATA = {
  name:     'Clarity Coin',
  symbol:   'CC',
  decimals: 6,
  uri:      'https://example.com/token-metadata.json',
} as const;

/** Default NFT metadata for SIP-009 tests */
export const DEFAULT_NFT_METADATA = {
  contractName: 'nft-contract',
  tokenUri:     'https://example.com/nft-metadata.json',
} as const;

/** Supported bridge chains */
export const BRIDGE_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'optimism'] as const;
export type BridgeChain = (typeof BRIDGE_CHAINS)[number];
