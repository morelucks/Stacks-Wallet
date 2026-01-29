import { describe, it, expect } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';

describe('Multi-Token Bridge Final Integration Tests', () => {
  it('should pass comprehensive bridge system test', () => {
    const accounts = { 
      deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 
      wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
      wallet2: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    };
    
    // Setup complete bridge system
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    MultiTokenBridgeTestUtils.setupValidators([accounts.wallet2], accounts.deployer);
    
    // Test all major functions work together
    const txId = MultiTokenBridgeTestUtils.generateTxId();
    
    // Bridge
    const bridgeResult = MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'test-addr', txId, accounts.wallet1);
    expect(bridgeResult.result).toBeOk();
    
    // Validate
    const validateResult = MultiTokenBridgeTestUtils.validateBridgeTransaction(
      txId, MultiTokenBridgeTestUtils.generateSignature(), true, accounts.wallet2
    );
    expect(validateResult.result).toBeOk();
    
    // Query all data
    const config = MultiTokenBridgeTestUtils.getBridgeConfig(1);
    const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
    const validator = MultiTokenBridgeTestUtils.getValidatorInfo(1, accounts.wallet2);
    const stats = MultiTokenBridgeTestUtils.getBridgeStats(1);
    const overview = MultiTokenBridgeTestUtils.getBridgeOverview();
    
    expect(config.result.value).toBeSome();
    expect(transaction.result.value).toBeSome();
    expect(validator.result.value).toBeSome();
    expect(stats.result.value).toBeSome();
    expect(overview.result).toBeOk();
  });

  it('should maintain system integrity after all operations', () => {
    const accounts = { 
      deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 
      wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5'
    };
    
    // Perform many operations
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    
    for (let i = 0; i < 20; i++) {
      MultiTokenBridgeTestUtils.bridgeTokens(
        i, 5000 + i * 100, 1, `addr-${i}`, 
        MultiTokenBridgeTestUtils.generateTxId(), accounts.wallet1
      );
    }
    
    // System should still be responsive
    const overview = MultiTokenBridgeTestUtils.getBridgeOverview();
    expect(overview.result).toBeOk();
    expect(Number(overview.result.value['total-volume'].value)).toBeGreaterThan(0);
  });
});