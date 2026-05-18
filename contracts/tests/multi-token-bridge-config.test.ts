/**
 * Multi-Token Bridge Configuration Tests
 * Validates configure-bridge, storage/retrieval, and chain-specific parameter
 * handling for the multi-token bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG as CFG } from './multi-token-bridge-test-config';

// ---------------------------------------------------------------------------
// Test account setup
// ---------------------------------------------------------------------------
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Configuration Tests', () => {
  // -------------------------------------------------------------------------
  // configure-bridge function
  // -------------------------------------------------------------------------

  describe('configure-bridge', () => {
    it('should configure a bridge with valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        true,
        CFG.MIN_BRIDGE_AMOUNT,
        CFG.MAX_BRIDGE_AMOUNT,
        CFG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const config = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      expect(config.result).toBeSome();
    });

    it('should reject configuration from a non-owner', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        true,
        CFG.MIN_BRIDGE_AMOUNT,
        CFG.MAX_BRIDGE_AMOUNT,
        CFG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        wallet1, // not the deployer
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should reject when max-amount is less than min-amount', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        true,
        1_000,
        500, // less than min
        CFG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should reject a bridge fee above the 10 % cap', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        true,
        CFG.MIN_BRIDGE_AMOUNT,
        CFG.MAX_BRIDGE_AMOUNT,
        1_500, // 15 % – exceeds limit
        10,
        2,
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should emit a bridge-configured print event', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        true,
        CFG.MIN_BRIDGE_AMOUNT,
        CFG.MAX_BRIDGE_AMOUNT,
        CFG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });
  });

  // -------------------------------------------------------------------------
  // Storage and retrieval
  // -------------------------------------------------------------------------

  describe('Configuration storage and retrieval', () => {
    it('should store and retrieve all configuration fields correctly', () => {
      const chainId = CFG.TEST_CHAINS.POLYGON;
      const params = {
        minAmount: 2_000,
        maxAmount: 500_000,
        bridgeFee: 200,
        confirmationBlocks: 15,
        validatorThreshold: 3,
      };

      MultiTokenBridgeTestUtils.configureBridge(
        chainId,
        true,
        params.minAmount,
        params.maxAmount,
        params.bridgeFee,
        params.confirmationBlocks,
        params.validatorThreshold,
        deployer,
      );

      const config = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
      expect(config.result).toBeSome();

      const d = (config.result as any).value;
      expect(d['enabled']).toBeBool(true);
      expect(d['min-bridge-amount']).toBeUint(params.minAmount);
      expect(d['max-bridge-amount']).toBeUint(params.maxAmount);
      expect(d['bridge-fee']).toBeUint(params.bridgeFee);
      expect(d['confirmation-blocks']).toBeUint(params.confirmationBlocks);
      expect(d['validator-threshold']).toBeUint(params.validatorThreshold);
    });

    it('should return none for an unconfigured chain', () => {
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(999);
      expect(config.result).toBeOk(Cl.none());
    });

    it('should allow configuration updates', () => {
      const chainId = CFG.TEST_CHAINS.BSC;

      MultiTokenBridgeTestUtils.configureBridge(
        chainId, true, 1_000, 100_000, 100, 10, 2, deployer,
      );

      MultiTokenBridgeTestUtils.configureBridge(
        chainId, false, 2_000, 200_000, 150, 20, 3, deployer,
      );

      const config = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
      const d = (config.result as any).value;
      expect(d['enabled']).toBeBool(false);
      expect(d['min-bridge-amount']).toBeUint(2_000);
      expect(d['max-bridge-amount']).toBeUint(200_000);
      expect(d['bridge-fee']).toBeUint(150);
      expect(d['confirmation-blocks']).toBeUint(20);
      expect(d['validator-threshold']).toBeUint(3);
    });
  });

  // -------------------------------------------------------------------------
  // Chain-specific parameter handling
  // -------------------------------------------------------------------------

  describe('Chain-specific parameter handling', () => {
    it('should store independent configurations for each chain', () => {
      const chains = Object.values(CFG.TEST_CHAINS);

      chains.forEach((chainId, i) => {
        MultiTokenBridgeTestUtils.configureBridge(
          chainId,
          true,
          CFG.MIN_BRIDGE_AMOUNT,
          CFG.MAX_BRIDGE_AMOUNT,
          100 + i * 50,
          10,
          2 + i,
          deployer,
        );
      });

      chains.forEach((chainId, i) => {
        const config = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
        const d = (config.result as any).value;
        expect(d['bridge-fee']).toBeUint(100 + i * 50);
        expect(d['validator-threshold']).toBeUint(2 + i);
      });
    });

    it('should validate chain-specific limits independently', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 5_000, 50_000, 500, 20, 5, deployer,
      );
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.BITCOIN, true, 1_000, 1_000_000, 50, 5, 1, deployer,
      );

      const eth = (MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM).result as any).value;
      const btc = (MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.BITCOIN).result as any).value;

      expect(eth['min-bridge-amount']).toBeUint(5_000);
      expect(btc['min-bridge-amount']).toBeUint(1_000);
      expect(eth['max-bridge-amount']).toBeUint(50_000);
      expect(btc['max-bridge-amount']).toBeUint(1_000_000);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases and boundary conditions
  // -------------------------------------------------------------------------

  describe('Edge cases and boundary conditions', () => {
    it('should accept minimum valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1, 2, 0, 1, 1, deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should accept maximum valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        true,
        999_999,
        1_000_000,
        CFG.MAX_BRIDGE_FEE,
        1_000,
        CFG.MAX_VALIDATORS,
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should store disabled state correctly', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM,
        false,
        CFG.MIN_BRIDGE_AMOUNT,
        CFG.MAX_BRIDGE_AMOUNT,
        CFG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer,
      );

      const config = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      expect((config.result as any).value['enabled']).toBeBool(false);
    });
  });
});
