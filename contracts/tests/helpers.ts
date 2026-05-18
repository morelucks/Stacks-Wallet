/**
 * Test Helpers and Utilities
 * Common functions for Stacks Network contract testing via Clarinet SDK
 *
 * @module helpers
 */

import { Cl } from '@stacks/transactions';

// ---------------------------------------------------------------------------
// Clarity value constructors
// ---------------------------------------------------------------------------

/** Wrap a string address as a Clarity principal */
export function principal(address: string) {
  return Cl.principal(address);
}

/** Wrap a number or bigint as a Clarity uint */
export function uint(value: number | bigint) {
  return Cl.uint(value);
}

/** Wrap a string as a Clarity UTF-8 string */
export function str(value: string) {
  return Cl.stringUtf8(value);
}

/** Wrap a string as a Clarity ASCII string */
export function ascii(value: string) {
  return Cl.stringAscii(value);
}

/** Wrap a string or Buffer as a Clarity buffer */
export function buffer(value: string | Buffer) {
  if (typeof value === 'string') {
    return Cl.buffer(Buffer.from(value, 'utf-8'));
  }
  return Cl.buffer(value);
}

/** Wrap a Clarity value in Some */
export function some(value: unknown) {
  return Cl.some(value);
}

/** Return a Clarity None value */
export function none() {
  return Cl.none();
}

/** Wrap a boolean as a Clarity bool */
export function bool(value: boolean) {
  return Cl.bool(value);
}

// ---------------------------------------------------------------------------
// Result assertion helpers
// ---------------------------------------------------------------------------

/**
 * Assert that a Clarity result is Ok and return its inner value.
 * Throws a descriptive error on failure.
 */
export function assertOk(result: any, message?: string): any {
  if (!result.isOk()) {
    throw new Error(message ?? `Expected Ok result, got: ${JSON.stringify(result)}`);
  }
  return result.value;
}

/**
 * Assert that a Clarity result is Err.
 * Optionally verify the numeric error code.
 */
export function assertErr(result: any, expectedError?: number, message?: string): any {
  if (!result.isErr()) {
    throw new Error(message ?? `Expected Err result, got: ${JSON.stringify(result)}`);
  }
  if (expectedError !== undefined && result.value.value !== expectedError) {
    throw new Error(
      message ?? `Expected error ${expectedError}, got: ${result.value.value}`,
    );
  }
  return result.value;
}

/**
 * Extract the inner value from an Ok result.
 * Throws if the result is an Err.
 */
export function getValue(result: any): any {
  if (result.isOk()) {
    return result.value;
  }
  throw new Error(`Cannot get value from error result: ${JSON.stringify(result)}`);
}

/**
 * Deep-equality check for Clarity values using JSON serialisation.
 * Throws a descriptive error when values differ.
 */
export function expectEqual(actual: unknown, expected: unknown, message?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(message ?? `Expected ${expectedStr}, got ${actualStr}`);
  }
}

// ---------------------------------------------------------------------------
// Token amount utilities
// ---------------------------------------------------------------------------

/**
 * Convert a human-readable token amount to its on-chain micro-unit representation.
 * Defaults to 6 decimal places (STX / SIP-010 standard).
 */
export function formatTokenAmount(amount: number, decimals = 6): number {
  return amount * Math.pow(10, decimals);
}

/**
 * Convert an on-chain micro-unit amount back to a human-readable value.
 */
export function parseTokenAmount(amount: number, decimals = 6): number {
  return amount / Math.pow(10, decimals);
}

// ---------------------------------------------------------------------------
// Miscellaneous utilities
// ---------------------------------------------------------------------------

/** Async sleep helper (milliseconds) */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a syntactically valid but random Stacks testnet principal.
 * Useful for property-based tests that need arbitrary addresses.
 */
export function randomPrincipal(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'ST';
  for (let i = 0; i < 34; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Token test data
// ---------------------------------------------------------------------------

export interface TestTokenData {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  uri: string;
}

/** Default SIP-010 token metadata used across Stacks Network tests */
export const DEFAULT_TOKEN_DATA: TestTokenData = {
  name: 'Test Token',
  symbol: 'TST',
  decimals: 6,
  initialSupply: 1_000_000_000,
  uri: 'https://example.com/token-metadata.json',
};

// ---------------------------------------------------------------------------
// Wallet test data
// ---------------------------------------------------------------------------

export interface TestWalletData {
  walletName: string;
  initialFunding: number;
  memberName: string;
  memberFunding: number;
}

/** Default wallet configuration used across Stacks Network wallet tests */
export const DEFAULT_WALLET_DATA: TestWalletData = {
  walletName: 'Test Wallet',
  initialFunding: 1_000_000,
  memberName: 'Test Member',
  memberFunding: 100_000,
};

// ---------------------------------------------------------------------------
// NFT helpers
// ---------------------------------------------------------------------------

export interface NFTTestData {
  tokenId: number;
  owner: string;
  recipient: string;
  contractOwner: string;
}

/** Canonical NFT error codes matching the SIP-009 contract on Stacks Network */
export const NFT_ERROR_CODES = {
  ERR_OWNER_ONLY:     100,
  ERR_NOT_TOKEN_OWNER: 101,
  ERR_TOKEN_EXISTS:   102,
  ERR_TOKEN_NOT_FOUND: 103,
} as const;

/** Build an NFTTestData object with sensible defaults */
export function createNFTTestData(overrides: Partial<NFTTestData> = {}): NFTTestData {
  return {
    tokenId: 1,
    owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
    contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ...overrides,
  };
}

/**
 * Assert that a specific token is owned by the expected principal.
 * Uses the SIP-009 `get-owner` read-only function.
 */
export function assertNFTOwnership(
  contractName: string,
  tokenId: number,
  expectedOwner: string,
  caller = 'deployer',
): void {
  const result = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(tokenId)], caller);
  if (!result.isOk()) {
    throw new Error(`Failed to get owner for token ${tokenId}: ${JSON.stringify(result)}`);
  }
  expectEqual(result.value, Cl.ok(some(principal(expectedOwner))));
}

/**
 * Assert that a token does not exist (owner returns None).
 */
export function assertNFTNotExists(
  contractName: string,
  tokenId: number,
  caller = 'deployer',
): void {
  const result = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(tokenId)], caller);
  if (!result.isOk()) {
    throw new Error(
      `Failed to check token existence for ${tokenId}: ${JSON.stringify(result)}`,
    );
  }
  expectEqual(result.value, Cl.ok(none()));
}

/** Mint a single NFT via the contract's `mint` function */
export function mintNFT(contractName: string, recipient: string, minter = 'deployer') {
  return simnet.callPublicFn(contractName, 'mint', [principal(recipient)], minter);
}

/** Transfer an NFT via the contract's `transfer` function */
export function transferNFT(
  contractName: string,
  tokenId: number,
  sender: string,
  recipient: string,
  caller: string,
) {
  return simnet.callPublicFn(
    contractName,
    'transfer',
    [uint(tokenId), principal(sender), principal(recipient)],
    caller,
  );
}

/** Read the last minted token ID from the contract */
export function getLastTokenId(contractName: string, caller = 'deployer') {
  return simnet.callReadOnlyFn(contractName, 'get-last-token-id', [], caller);
}

/** Assert that a result is an Err with the given NFT error code */
export function assertNFTError(result: any, expectedErrorCode: number): void {
  if (!result.isErr()) {
    throw new Error(`Expected error result, got: ${JSON.stringify(result)}`);
  }
  expectEqual(result.value, Cl.error(uint(expectedErrorCode)));
}

// ---------------------------------------------------------------------------
// Batch NFT helpers
// ---------------------------------------------------------------------------

/**
 * Mint multiple NFTs in sequence and return the assigned token IDs.
 */
export function batchMintNFTs(
  contractName: string,
  recipients: string[],
  minter = 'deployer',
): number[] {
  return recipients.reduce<number[]>((ids, recipient, index) => {
    const result = simnet.callPublicFn(contractName, 'mint', [principal(recipient)], minter);
    if (result.isOk()) ids.push(index + 1);
    return ids;
  }, []);
}

/**
 * Verify ownership for a list of (tokenId, owner) pairs in a single pass.
 */
export function verifyTokenOwnership(
  contractName: string,
  tokenOwnerPairs: Array<{ tokenId: number; owner: string }>,
  caller = 'deployer',
): void {
  for (const { tokenId, owner } of tokenOwnerPairs) {
    const result = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(tokenId)], caller);
    expectEqual(result.value, Cl.ok(some(principal(owner))));
  }
}
