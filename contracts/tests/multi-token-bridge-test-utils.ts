import { Simnet } from '@hirosystems/clarinet-sdk';
import { Cl, ClarityValue } from '@stacks/transactions';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const simnet = new Simnet();

export class MultiTokenBridgeTestUtils {
  static readonly CONFIG = MULTI_TOKEN_BRIDGE_TEST_CONFIG;
  static readonly ERRORS = MULTI_TOKEN_BRIDGE_TEST_CONFIG.ERRORS;

  // Bridge configuration utilities
  static configureBridge(
    chainId: number,
    enabled: boolean,
    minAmount: number,
    maxAmount: number,
    bridgeFee: number,
    confirmationBlocks: number,
    validatorThreshold: number,
    deployer: string
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
        Cl.uint(validatorThreshold)
      ],
      deployer
    );
  }

  static addValidator(chainId: number, validator: string, stakeAmount: number, deployer: string) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'add-validator',
      [
        Cl.uint(chainId),
        Cl.principal(validator),
        Cl.uint(stakeAmount)
      ],
      deployer
    );
  }

  // Bridge transaction utilities
  static bridgeTokens(
    tokenId: number,
    amount: number,
    destChain: number,
    destAddress: string,
    txId: Uint8Array,
    user: string
  ) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'bridge-tokens',
      [
        Cl.uint(tokenId),
        Cl.uint(amount),
        Cl.uint(destChain),
        Cl.stringAscii(destAddress),
        Cl.buffer(txId)
      ],
      user
    );
  }

  static validateBridgeTransaction(
    txId: Uint8Array,
    signature: Uint8Array,
    isValid: boolean,
    validator: string
  ) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'validate-bridge-transaction',
      [
        Cl.buffer(txId),
        Cl.buffer(signature),
        Cl.bool(isValid)
      ],
      validator
    );
  }

  static completeBridgeTransaction(txId: Uint8Array, deployer: string) {
    return simnet.callPublicFn(
      'multi-token-bridge',
      'complete-bridge-transaction',
      [Cl.buffer(txId)],
      deployer
    );
  }

  // Query utilities
  static getBridgeConfig(chainId: number) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-config',
      [Cl.uint(chainId)],
      simnet.deployer
    );
  }

  static getBridgeTransaction(txId: Uint8Array) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-transaction',
      [Cl.buffer(txId)],
      simnet.deployer
    );
  }

  static getValidatorInfo(chainId: number, validator: string) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-validator-info',
      [Cl.uint(chainId), Cl.principal(validator)],
      simnet.deployer
    );
  }

  static getBridgeStats(chainId: number) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-stats',
      [Cl.uint(chainId)],
      simnet.deployer
    );
  }

  static calculateBridgeFee(tokenId: number, amount: number, destChain: number) {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'calculate-bridge-fee',
      [Cl.uint(tokenId), Cl.uint(amount), Cl.uint(destChain)],
      simnet.deployer
    );
  }

  static getBridgeOverview() {
    return simnet.callReadOnlyFn(
      'multi-token-bridge',
      'get-bridge-overview',
      [],
      simnet.deployer
    );
  }

  // Test data generators
  static generateTxId(): Uint8Array {
    const txId = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      txId[i] = Math.floor(Math.random() * 256);
    }
    return txId;
  }

  static generateSignature(): Uint8Array {
    const signature = new Uint8Array(65);
    for (let i = 0; i < 65; i++) {
      signature[i] = Math.floor(Math.random() * 256);
    }
    return signature;
  }

  static getRandomChainId(): number {
    const chains = Object.values(this.CONFIG.TEST_CHAINS);
    return chains[Math.floor(Math.random() * chains.length)];
  }

  static getRandomAddress(chainId: number): string {
    switch (chainId) {
      case this.CONFIG.TEST_CHAINS.ETHEREUM:
        return this.CONFIG.TEST_ADDRESSES.ETHEREUM;
      case this.CONFIG.TEST_CHAINS.BITCOIN:
        return this.CONFIG.TEST_ADDRESSES.BITCOIN;
      case this.CONFIG.TEST_CHAINS.POLYGON:
        return this.CONFIG.TEST_ADDRESSES.POLYGON;
      case this.CONFIG.TEST_CHAINS.BSC:
        return this.CONFIG.TEST_ADDRESSES.BSC;
      default:
        return this.CONFIG.TEST_ADDRESSES.ETHEREUM;
    }
  }

  // Setup utilities
  static setupDefaultBridgeConfig(deployer: string) {
    const chains = Object.values(this.CONFIG.TEST_CHAINS);
    chains.forEach(chainId => {
      this.configureBridge(
        chainId,
        true,
        this.CONFIG.MIN_BRIDGE_AMOUNT,
        this.CONFIG.MAX_BRIDGE_AMOUNT,
        this.CONFIG.DEFAULT_BRIDGE_FEE,
        10, // confirmation blocks
        2,  // validator threshold
        deployer
      );
    });
  }

  static setupValidators(validators: string[], deployer: string) {
    const chains = Object.values(this.CONFIG.TEST_CHAINS);
    chains.forEach(chainId => {
      validators.forEach(validator => {
        this.addValidator(chainId, validator, this.CONFIG.MIN_STAKE_AMOUNT, deployer);
      });
    });
  }

  // Assertion helpers
  static expectOk(result: any): any {
    if (!result.result || result.result.type !== 'ok') {
      throw new Error(`Expected ok result, got: ${JSON.stringify(result)}`);
    }
    return result.result.value;
  }

  static expectErr(result: any, expectedError?: number): any {
    if (!result.result || result.result.type !== 'err') {
      throw new Error(`Expected error result, got: ${JSON.stringify(result)}`);
    }
    if (expectedError !== undefined) {
      const actualError = result.result.value;
      if (actualError.type === 'uint' && actualError.value !== BigInt(expectedError)) {
        throw new Error(`Expected error ${expectedError}, got: ${actualError.value}`);
      }
    }
    return result.result.value;
  }

  static expectSome(result: any): any {
    if (!result.result || result.result.type !== 'some') {
      throw new Error(`Expected some result, got: ${JSON.stringify(result)}`);
    }
    return result.result.value;
  }

  static expectNone(result: any): void {
    if (!result.result || result.result.type !== 'none') {
      throw new Error(`Expected none result, got: ${JSON.stringify(result)}`);
    }
  }
}