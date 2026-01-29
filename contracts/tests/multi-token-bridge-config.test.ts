import { describe, it, expect, beforeEach } from 'vitest';
import { Simnet } from '@hirosystems/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const simnet = new Simnet();
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('Multi-Token Bridge Configuration Tests', () => {
  beforeEach(() => {
    // Reset simnet state before each test
    simnet.reset();
  });

  describe('configure-bridge function', () => {
    it('should configure bridge with valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      
      // Verify configuration was stored
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );
      expect(config.result).toBeSome();
    });

    it('should reject unauthorized configuration attempts', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        wallet1 // Not the deployer
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.UNAUTHORIZED));
    });

    it('should reject invalid parameter combinations', () => {
      // Test max amount less than min amount
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        1000, // min amount
        500,  // max amount (less than min)
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject excessive bridge fees', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        1500, // 15% fee (exceeds 10% limit)
        10,
        2,
        deployer
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should emit bridge-configured event', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });
  });

  describe('Bridge configuration storage and retrieval', () => {
    it('should store and retrieve configuration correctly', () => {
      const chainId = MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON;
      const minAmount = 2000;
      const maxAmount = 500000;
      const bridgeFee = 200;
      const confirmationBlocks = 15;
      const validatorThreshold = 3;

      // Configure bridge
      MultiTokenBridgeTestUtils.configureBridge(
        chainId,
        true,
        minAmount,
        maxAmount,
        bridgeFee,
        confirmationBlocks,
        validatorThreshold,
        deployer
      );

      // Retrieve and verify configuration
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
      expect(config.result).toBeSome();
      
      const configData = config.result.value;
      expect(configData['enabled']).toBeBool(true);
      expect(configData['min-bridge-amount']).toBeUint(minAmount);
      expect(configData['max-bridge-amount']).toBeUint(maxAmount);
      expect(configData['bridge-fee']).toBeUint(bridgeFee);
      expect(configData['confirmation-blocks']).toBeUint(confirmationBlocks);
      expect(configData['validator-threshold']).toBeUint(validatorThreshold);
    });

    it('should return none for unconfigured chains', () => {
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(999); // Non-existent chain
      expect(config.result).toBeOk(Cl.none());
    });

    it('should allow configuration updates', () => {
      const chainId = MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC;
      
      // Initial configuration
      MultiTokenBridgeTestUtils.configureBridge(
        chainId,
        true,
        1000,
        100000,
        100,
        10,
        2,
        deployer
      );

      // Update configuration
      MultiTokenBridgeTestUtils.configureBridge(
        chainId,
        false, // Disable bridge
        2000,  // New min amount
        200000, // New max amount
        150,   // New fee
        20,    // New confirmation blocks
        3,     // New validator threshold
        deployer
      );

      // Verify updated configuration
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
      expect(config.result).toBeSome();
      
      const configData = config.result.value;
      expect(configData['enabled']).toBeBool(false);
      expect(configData['min-bridge-amount']).toBeUint(2000);
      expect(configData['max-bridge-amount']).toBeUint(200000);
      expect(configData['bridge-fee']).toBeUint(150);
      expect(configData['confirmation-blocks']).toBeUint(20);
      expect(configData['validator-threshold']).toBeUint(3);
    });
  });

  describe('Chain-specific parameter handling', () => {
    it('should handle different configurations for different chains', () => {
      const chains = Object.values(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS);
      
      chains.forEach((chainId, index) => {
        const uniqueFee = 100 + (index * 50); // Different fee for each chain
        const uniqueThreshold = 2 + index; // Different threshold for each chain
        
        MultiTokenBridgeTestUtils.configureBridge(
          chainId,
          true,
          MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
          MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
          uniqueFee,
          10,
          uniqueThreshold,
          deployer
        );
      });

      // Verify each chain has its unique configuration
      chains.forEach((chainId, index) => {
        const config = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
        expect(config.result).toBeSome();
        
        const configData = config.result.value;
        expect(configData['bridge-fee']).toBeUint(100 + (index * 50));
        expect(configData['validator-threshold']).toBeUint(2 + index);
      });
    });

    it('should validate chain-specific limits independently', () => {
      // Configure Ethereum with strict limits
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        5000,  // Higher min amount
        50000, // Lower max amount
        500,   // Higher fee
        20,
        5,
        deployer
      );

      // Configure Bitcoin with relaxed limits
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        true,
        1000,   // Lower min amount
        1000000, // Higher max amount
        50,     // Lower fee
        5,
        1,
        deployer
      );

      // Verify configurations are independent
      const ethConfig = MultiTokenBridgeTestUtils.getBridgeConfig(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );
      const btcConfig = MultiTokenBridgeTestUtils.getBridgeConfig(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN
      );

      expect(ethConfig.result).toBeSome();
      expect(btcConfig.result).toBeSome();

      const ethData = ethConfig.result.value;
      const btcData = btcConfig.result.value;

      expect(ethData['min-bridge-amount']).toBeUint(5000);
      expect(btcData['min-bridge-amount']).toBeUint(1000);
      expect(ethData['max-bridge-amount']).toBeUint(50000);
      expect(btcData['max-bridge-amount']).toBeUint(1000000);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        1,    // Minimum amount
        2,    // Just above minimum
        0,    // Zero fee
        1,    // Minimum confirmation blocks
        1,    // Minimum validator threshold
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should handle maximum valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true,
        999999,  // Large min amount
        1000000, // Maximum amount
        1000,    // Maximum fee (10%)
        1000,    // Large confirmation blocks
        10,      // Maximum validator threshold
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should handle disabled bridge configuration', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        false, // Disabled
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );
      expect(config.result).toBeSome();
      expect(config.result.value['enabled']).toBeBool(false);
    });
  });
});