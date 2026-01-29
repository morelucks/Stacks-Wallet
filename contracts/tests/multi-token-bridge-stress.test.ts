import { describe, it, expect } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5' };

describe('Multi-Token Bridge Stress Tests', () => {
  it('should handle high volume transactions', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    
    for (let i = 0; i < 100; i++) {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        i, 5000, 1, `addr${i}`, MultiTokenBridgeTestUtils.generateTxId(), accounts.wallet1
      );
      expect(result.result).toBeOk();
    }
  });

  it('should handle concurrent validator operations', () => {
    const validators = ['ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP'];
    
    validators.forEach((validator, i) => {
      const result = MultiTokenBridgeTestUtils.addValidator(1, validator, 5000 + i * 1000, accounts.deployer);
      expect(result.result).toBeOk();
    });
  });

  it('should maintain performance under load', () => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
    
    const startTime = Date.now();
    for (let i = 0; i < 200; i++) {
      MultiTokenBridgeTestUtils.getBridgeConfig(1);
    }
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(10000);
  });

  it('should handle rapid configuration changes', () => {
    for (let i = 0; i < 50; i++) {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        1, i % 2 === 0, 1000 + i, 100000 + i * 1000, 100 + i, 10 + i, 2, accounts.deployer
      );
      expect(result.result).toBeOk();
    }
  });
});