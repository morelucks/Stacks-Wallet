/**
 * Test Helpers and Utilities
 * Common functions for contract testing
 */

import { Cl } from '@stacks/transactions';

/**
 * Create a principal from a string address
 */
export function principal(address: string) {
  return Cl.principal(address);
}

/**
 * Create a uint value
 */
export function uint(value: number | bigint) {
  return Cl.uint(value);
}

/**
 * Create a string value
 */
export function str(value: string) {
  return Cl.stringUtf8(value);
}

/**
 * Create a buffer value
 */
export function buffer(value: string | Buffer) {
  if (typeof value === 'string') {
    return Cl.buffer(Buffer.from(value, 'utf-8'));
  }
  return Cl.buffer(value);
}

/**
 * Create an optional value
 */
export function some(value: any) {
  return Cl.some(value);
}

/**
 * Create a none value
 */
export function none() {
  return Cl.none();
}

/**
 * Assert that a result is ok
 */
export function assertOk(result: any, message?: string) {
  if (!result.isOk()) {
    throw new Error(message || `Expected Ok result, got: ${JSON.stringify(result)}`);
  }
  return result.value;
}

/**
 * Assert that a result is error
 */
export function assertErr(result: any, expectedError?: number, message?: string) {
  if (!result.isErr()) {
    throw new Error(message || `Expected Err result, got: ${JSON.stringify(result)}`);
  }
  if (expectedError !== undefined && result.value.value !== expectedError) {
    throw new Error(
      message || `Expected error ${expectedError}, got: ${result.value.value}`
    );
  }
  return result.value;
}

/**
 * Get the value from a result
 */
export function getValue(result: any) {
  if (result.isOk()) {
    return result.value;
  }
  throw new Error(`Cannot get value from error result: ${JSON.stringify(result)}`);
}

/**
 * Compare two Clarity values
 */
export function expectEqual(actual: any, expected: any, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Expected ${expectedStr}, got ${actualStr}`
    );
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: number, decimals: number = 6): number {
  return amount * Math.pow(10, decimals);
}

/**
 * Parse token amount with decimals
 */
export function parseTokenAmount(amount: number, decimals: number = 6): number {
  return amount / Math.pow(10, decimals);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random principal address for testing
 */
export function randomPrincipal(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'ST';
  for (let i = 0; i < 34; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create test data for token operations
 */
export interface TestTokenData {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  uri: string;
}

export const DEFAULT_TOKEN_DATA: TestTokenData = {
  name: 'Test Token',
  symbol: 'TST',
  decimals: 6,
  initialSupply: 1000000000,
  uri: 'https://example.com/token-metadata.json'
};

/**
 * Create test data for wallet operations
 */
export interface TestWalletData {
  walletName: string;
  initialFunding: number;
  memberName: string;
  memberFunding: number;
}

export const DEFAULT_WALLET_DATA: TestWalletData = {
  walletName: 'Test Wallet',
  initialFunding: 1000000,
  memberName: 'Test Member',
  memberFunding: 100000
};
/**
 * NFT-specific helper functions
 */

/**
 * NFT test data interface
 */
export interface NFTTestData {
  tokenId: number;
  owner: string;
  recipient: string;
  contractOwner: string;
}

/**
 * NFT error codes
 */
export const NFT_ERROR_CODES = {
  ERR_OWNER_ONLY: 100,
  ERR_NOT_TOKEN_OWNER: 101,
  ERR_TOKEN_EXISTS: 102,
  ERR_TOKEN_NOT_FOUND: 103
} as const;

/**
 * Create NFT test data with default values
 */
export function createNFTTestData(overrides: Partial<NFTTestData> = {}): NFTTestData {
  return {
    tokenId: 1,
    owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
    contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ...overrides
  };
}

/**
 * Assert NFT ownership
 */
export function assertNFTOwnership(
  contractName: string,
  tokenId: number,
  expectedOwner: string,
  caller: string = 'deployer'
) {
  const result = simnet.callReadOnlyFn(
    contractName,
    'get-owner',
    [uint(tokenId)],
    caller
  );

  if (!result.isOk()) {
    throw new Error(`Failed to get owner for token ${tokenId}: ${JSON.stringify(result)}`);
  }

  expectEqual(result.value, Cl.ok(some(principal(expectedOwner))));
}

/**
 * Assert NFT does not exist
 */
export function assertNFTNotExists(
  contractName: string,
  tokenId: number,
  caller: string = 'deployer'
) {
  const result = simnet.callReadOnlyFn(
    contractName,
    'get-owner',
    [uint(tokenId)],
    caller
  );

  if (!result.isOk()) {
    throw new Error(`Failed to check token existence for ${tokenId}: ${JSON.stringify(result)}`);
  }

  expectEqual(result.value, Cl.ok(none()));
}

/**
 * Mint NFT helper
 */
export function mintNFT(
  contractName: string,
  recipient: string,
  minter: string = 'deployer'
) {
  return simnet.callPublicFn(
    contractName,
    'mint',
    [principal(recipient)],
    minter
  );
}

/**
 * Transfer NFT helper
 */
export function transferNFT(
  contractName: string,
  tokenId: number,
  sender: string,
  recipient: string,
  caller: string
) {
  return simnet.callPublicFn(
    contractName,
    'transfer',
    [uint(tokenId), principal(sender), principal(recipient)],
    caller
  );
}

/**
 * Get last token ID helper
 */
export function getLastTokenId(contractName: string, caller: string = 'deployer') {
  return simnet.callReadOnlyFn(
    contractName,
    'get-last-token-id',
    [],
    caller
  );
}

/**
 * Validate NFT error code
 */
export function assertNFTError(result: any, expectedErrorCode: number) {
  if (!result.isErr()) {
    throw new Error(`Expected error result, got: ${JSON.stringify(result)}`);
  }
  expectEqual(result.value, Cl.error(uint(expectedErrorCode)));
}
/**
 * Additional NFT testing utilities
 */

/**
 * Batch mint multiple tokens
 */
export function batchMintNFTs(
  contractName: string,
  recipients: string[],
  minter: string = 'deployer'
): number[] {
  const tokenIds: number[] = [];
  
  recipients.forEach((recipient, index) => {
    const result = simnet.callPublicFn(
      contractName,
      'mint',
      [principal(recipient)],
      minter
    );
    
    if (result.isOk()) {
      tokenIds.push(index + 1);
    }
  });
  
  return tokenIds;
}

/**
 * Verify token ownership batch
 */
export function verifyTokenOwnership(
  contractName: string,
  tokenOwnerPairs: Array<{ tokenId: number; owner: string }>,
  caller: string = 'deployer'
) {
  tokenOwnerPairs.forEach(({ tokenId, owner }) => {
    const result = simnet.callReadOnlyFn(
      contractName,
      'get-owner',
      [uint(tokenId)],
      caller
    );
    
    expectEqual(result.value, Cl.ok(some(principal(owner))));
  });
}