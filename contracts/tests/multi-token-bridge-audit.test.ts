import { describe, it, expect } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5', wallet2: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' };

describe('Multi-Token Bridge Audit Tests', () => {
  it('should emit events for all state changes', () => {
    const configResult = MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 100000, 100, 10, 2, accounts.deployer);
    expect(configResult.events).toHaveLength(1);
    
    const validatorResult = MultiTokenBridgeTestUtils.addValidator(1, accounts.wallet2, 5000, accounts.deployer);
    expect(validatorResult.events).toHaveLength(1);
    
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    const bridgeResult = MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', MultiTokenBridgeTestUtils.generateTxId(), accounts.wallet1);
    expect(bridgeResult.events).toHaveLength(1);
  });

  it('should maintain transaction history', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    
    const txId1 = MultiTokenBridgeTestUtils.generateTxId();
    const txId2 = MultiTokenBridgeTestUtils.generateTxId();
    
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr1', txId1, accounts.wallet1);
    MultiTokenBridgeTestUtils.bridgeTokens(2, 20000, 1, 'addr2', txId2, accounts.wallet1);
    
    const tx1 = MultiTokenBridgeTestUtils.getBridgeTransaction(txId1);
    const tx2 = MultiTokenBridgeTestUtils.getBridgeTransaction(txId2);
    
    expect(tx1.result.value).toBeSome();
    expect(tx2.result.value).toBeSome();
  });

  it('should track bridge statistics', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', MultiTokenBridgeTestUtils.generateTxId(), accounts.wallet1);
    
    const stats = MultiTokenBridgeTestUtils.getBridgeStats(1);
    expect(stats.result.value).toBeSome();
    expect(stats.result.value.value['total-transactions']).toBeUint(1);
  });

  it('should provide complete audit trail', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet2], accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2);
    
    const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
    const validator = MultiTokenBridgeTestUtils.getValidatorInfo(1, accounts.wallet2);
    const stats = MultiTokenBridgeTestUtils.getBridgeStats(1);
    
    expect(tx.result.value).toBeSome();
    expect(validator.result.value).toBeSome();
    expect(stats.result.value).toBeSome();
  });
});