import { describe, it, expect } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5' };

describe('Multi-Token Bridge Edge Cases', () => {
  it('should handle minimum values', () => {
    const result = MultiTokenBridgeTestUtils.configureBridge(1, true, 1, 2, 0, 1, 1, accounts.deployer);
    expect(result.result).toBeOk();
  });

  it('should handle maximum values', () => {
    const result = MultiTokenBridgeTestUtils.configureBridge(1, true, 999999, 1000000, 1000, 1000, 10, accounts.deployer);
    expect(result.result).toBeOk();
  });

  it('should handle zero fee calculations', () => {
    MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 100000, 0, 10, 2, accounts.deployer);
    const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10000, 1);
    expect(result.result.value['fee-amount']).toBeUint(0);
  });

  it('should handle large transaction amounts', () => {
    MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 1000000, 100, 10, 2, accounts.deployer);
    const result = MultiTokenBridgeTestUtils.bridgeTokens(1, 1000000, 1, 'addr', MultiTokenBridgeTestUtils.generateTxId(), accounts.wallet1);
    expect(result.result).toBeOk();
  });

  it('should handle empty signature buffers', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet1], accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    
    const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, new Uint8Array(0), true, accounts.wallet1);
    expect(result.result).toBeOk();
  });

  it('should handle maximum signature buffers', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet1], accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    
    const maxSig = new Uint8Array(65).fill(255);
    const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, maxSig, true, accounts.wallet1);
    expect(result.result).toBeOk();
  });
});