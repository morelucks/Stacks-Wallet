import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5', wallet2: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' };

describe('Multi-Token Bridge Integration Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet2], accounts.deployer);
  });

  it('should complete full bridge workflow', () => {
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    
    // Initiate bridge
    const bridgeResult = MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    expect(bridgeResult.result).toBeOk();
    
    // Validate
    const validateResult = MultiTokenBridgeTestUtils.validateBridgeTransaction(
      txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2
    );
    expect(validateResult.result).toBeOk();
    
    // Complete
    const completeResult = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, accounts.deployer);
    expect(completeResult.result).toBeOk();
  });

  it('should handle multi-validator consensus', () => {
    MultiTokenBridgeTestUtils.addValidator(1, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP', 5000, accounts.deployer);
    
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, accounts.wallet1);
    
    // Multiple validators sign
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2);
    MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP');
    
    const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
    expect(tx.result.value.value['status']).toBeAscii('confirmed');
  });
});