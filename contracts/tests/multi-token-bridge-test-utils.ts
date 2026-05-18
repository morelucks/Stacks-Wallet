/**
 * Multi-Token Bridge Test Utilities
 * Helper class for multi-token bridge contract tests on Stacks Network
 *
 * @module multi-token-bridge-test-utils
 */

import { Cl } from '@stacks/transactions';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

export class MultiTokenBridgeTestUtils {
  static readonly CONFIG = MULTI_TOKEN_BRIDGE_TEST_CONFIG;
  static readonly ERRORS = MULTI_TOKEN_BRIDGE_TEST_CONFIG.ERRORS;

  // -------------------------------------------------------------------------
  // Bridge configuration
  // -------------------------------------------------------------------------

  /** Configure a bridge for a specific chain */
  static configureBridge(
    chainId: number,
    enabled: boolean,
    minAmount: number,
    maxAmount: number,
    bridgeFee: number,
    confirmationBlocks: number,
    validatorThreshold: number,
    deployer: string,
  ) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'configure-bridge',
      [
        Cl.uint(chainId),
        Cl.bool(enabled),
        Cl.uint(minAmount),
        Cl.uint(maxAmount),
        Cl.uint(bridgeFee),
        Cl.uint(confirmationBlocks),
        Cl.uint(validatorThreshold),
      ],
      deployer,
    );
  }

  /** Add a validator for a specific chain */
  static addValidator(
    chainId: number,
    validator: string,
    stakeAmount: number,
    deployer: string,
  ) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'add-validator',
      [Cl.uint(chainId), Cl.principal(validator), Cl.uint(stakeAmount)],
      deployer,
    );
  }

  // -------------------------------------------------------------------------
  // Bridge transactions
  // -------------------------------------------------------------------------

  /** Initiate a bridge token transfer */
  static bridgeTokens(
    tokenId: number,
    amount: number,
    destChain: number,
    destAddress: string,
    txId: Uint8Array,
    user: string,
  ) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'bridge-tokens',
      [
        Cl.uint(tokenId),
        Cl.uint(amount),
        Cl.uint(destChain),
        Cl.stringAscii(destAddress),
        Cl.buffer(txId),
      ],
      user,
    );
  }

  /** Submit a validator signature for a bridge transaction */
  static validateBridgeTransaction(
    txId: Uint8Array,
    signature: Uint8Array,
    isValid: boolean,
    validator: string,
  ) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'validate-bridge-transaction',
      [Cl.buffer(txId), Cl.buffer(signature), Cl.bool(isValid)],
      validator,
    );
  }

  /** Mark a bridge transaction as completed */
  static completeBridgeTransaction(txId: Uint8Array, deployer: string) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'complete-bridge-transaction',
      [Cl.buffer(txId)],
      deployer,
    );
  }

  // -------------------------------------------------------------------------
  // Read-only queries
  // -------------------------------------------------------------------------

  /** Fetch bridge configuration for a chain */
  static getBridgeConfig(chainId: number) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-config',
      [Cl.uint(chainId)],
      simnet.deployer,
    );
  }

  /** Fetch a bridge transaction by its ID */
  static getBridgeTransaction(txId: Uint8Array) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-transaction',
      [Cl.buffer(txId)],
      simnet.deployer,
    );
  }

  /** Fetch validator info for a chain/validator pair */
  static getValidatorInfo(chainId: number, validator: string) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-validator-info',
      [Cl.uint(chainId), Cl.principal(validator)],
      simnet.deployer,
    );
  }

  /** Fetch bridge statistics for a chain */
  static getBridgeStats(chainId: number) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-stats',
      [Cl.uint(chainId)],
      simnet.deployer,
    );
  }

  /** Calculate the bridge fee for a given token, amount, and destination chain */
  static calculateBridgeFee(tokenId: number, amount: number, destChain: number) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'calculate-bridge-fee',
      [Cl.uint(tokenId), Cl.uint(amount), Cl.uint(destChain)],
      simnet.deployer,
    );
  }

  /** Fetch the global bridge overview */
  static getBridgeOverview() {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-overview',
      [],
      simnet.deployer,
    );
  }

  // -------------------------------------------------------------------------
  // Test data generators
  // -------------------------------------------------------------------------

  /** Generate a random 32-byte transaction ID */
  static generateTxId(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /** Generate a random 65-byte validator signature */
  static generateSignature(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(65));
  }

  /** Return a random chain ID from the configured test chains */
  static getRandomChainId(): number {
    const chains = Object.values(this.CONFIG.TEST_CHAINS);
    return chains[Math.floor(Math.random() * chains.length)];
  }

  /** Return the test destination address for a given chain ID */
  static getAddressForChain(chainId: number): string {
    const map: Record<number, string> = {
      [this.CONFIG.TEST_CHAINS.ETHEREUM]: this.CONFIG.TEST_ADDRESSES.ETHEREUM,
      [this.CONFIG.TEST_CHAINS.BITCOIN]: this.CONFIG.TEST_ADDRESSES.BITCOIN,
      [this.CONFIG.TEST_CHAINS.POLYGON]: this.CONFIG.TEST_ADDRESSES.POLYGON,
      [this.CONFIG.TEST_CHAINS.BSC]: this.CONFIG.TEST_ADDRESSES.BSC,
    };
    return map[chainId] ?? this.CONFIG.TEST_ADDRESSES.ETHEREUM;
  }

  // -------------------------------------------------------------------------
  // Setup helpers
  // -------------------------------------------------------------------------

  /** Configure all four test chains with default parameters */
  static setupDefaultBridgeConfig(deployer: string): void {
    for (const chainId of Object.values(this.CONFIG.TEST_CHAINS)) {
      this.configureBridge(
        chainId,
        true,
        this.CONFIG.MIN_BRIDGE_AMOUNT,
        this.CONFIG.MAX_BRIDGE_AMOUNT,
        this.CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer,
      );
    }
  }

  /** Register validators on all four test chains */
  static setupValidators(validators: string[], deployer: string): void {
    for (const chainId of Object.values(this.CONFIG.TEST_CHAINS)) {
      for (const validator of validators) {
        this.addValidator(chainId, validator, this.CONFIG.MIN_STAKE_AMOUNT, deployer);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Assertion helpers
  // -------------------------------------------------------------------------

  /** Assert a result is Ok and return its inner value */
  static expectOk(result: any): any {
    if (!result.result || result.result.type !== 'ok') {
      throw new Error(`Expected ok result, got: ${JSON.stringify(result)}`);
    }
    return result.result.value;
  }

  /** Assert a result is Err, optionally checking the error code */
  static expectErr(result: any, expectedError?: number): any {
    if (!result.result || result.result.type !== 'err') {
      throw new Error(`Expected error result, got: ${JSON.stringify(result)}`);
    }
    if (expectedError !== undefined) {
      const actual = result.result.value;
      if (actual.type === 'uint' && actual.value !== BigInt(expectedError)) {
        throw new Error(`Expected error ${expectedError}, got: ${actual.value}`);
      }
    }
    return result.result.value;
  }

  /** Assert a result is Some and return its inner value */
  static expectSome(result: any): any {
    if (!result.result || result.result.type !== 'some') {
      throw new Error(`Expected some result, got: ${JSON.stringify(result)}`);
    }
    return result.result.value;
  }

  /** Assert a result is None */
  static expectNone(result: any): void {
    if (!result.result || result.result.type !== 'none') {
      throw new Error(`Expected none result, got: ${JSON.stringify(result)}`);
    }
  }
}
