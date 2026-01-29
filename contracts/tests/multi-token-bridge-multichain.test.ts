import { describe, it, expect } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5' };

describe('Multi-Chain Bridge Tests', () => {
  it('should handle all supported chains', () => {
    const chains = Object.values(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS);
    
    chains.forEach(chainId => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        chainId, true, 1000, 100000, 100, 10, 2, accounts.deployer
      );
      expect(result.result).toBeOk();
    });
  });

  it('should apply chain-specific parameters', () => {
    MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 100000, 100, 10, 2, accounts.deployer);
    MultiTokenBridgeTestUtils.configureBridge(2, true, 2000, 200000, 200, 20, 3, accounts.deployer);
    
    const config1 = MultiTokenBridgeTestUtils.getBridgeConfig(1);
    const config2 = MultiTokenBridgeTestUtils.getBridgeConfig(2);
    
    expect(config1.result.value.value['bridge-fee']).toBeUint(100);
    expect(config2.result.value.value['bridge-fee']).toBeUint(200);
  });

  it('should maintain separate validator states per chain', () => {
    MultiTokenBridgeTestUtils.addValidator(1, accounts.wallet1, 10000, accounts.deployer);
    MultiTokenBridgeTestUtils.addValidator(2, accounts.wallet1, 20000, accounts.deployer);
    
    const validator1 = MultiTokenBridgeTestUtils.getValidatorInfo(1, accounts.wallet1);
    const validator2 = MultiTokenBridgeTestUtils.getValidatorInfo(2, accounts.wallet1);
    
    expect(validator1.result.value.value['stake-amount']).toBeUint(10000);
    expect(validator2.result.value.value['stake-amount']).toBeUint(20000);
  });
});