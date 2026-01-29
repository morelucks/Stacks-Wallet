import { describe, it, expect } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5', wallet2: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' };

describe('Multi-Token Bridge Complete Transaction Tests', () => {
  it('should complete bridge transaction successfully', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet2], accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    
    // Bridge tokens
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    
    // Get enough signatures to meet threshold
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2);
    MultiTokenBridgeTestUtils.addValidator(1, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP', 5000, accounts.deployer);
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP');
    
    // Complete transaction
    const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, accounts.deployer);
    expect(result.result).toBeOk();
    
    // Verify completion
    const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
    expect(tx.result.value.value['status']).toBeAscii('completed');
  });

  it('should reject completion without enough signatures', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet2], accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    
    // Only one signature (threshold is 2)
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2);
    
    const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, accounts.deployer);
    expect(result.result).toBeErr();
  });

  it('should update statistics on completion', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet2], accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    
    // Meet threshold
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2);
    MultiTokenBridgeTestUtils.addValidator(1, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP', 5000, accounts.deployer);
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP');
    
    MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, accounts.deployer);
    
    const stats = MultiTokenBridgeTestUtils.getBridgeStats(1);
    expect(stats.result.value).toBeSome();
  });
});