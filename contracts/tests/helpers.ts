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
