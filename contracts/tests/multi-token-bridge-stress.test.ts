/**
 * Multi-Token Bridge Stress Tests
 * Validates high-volume transaction processing and performance under load
 * for the multi-token bridge on Stacks Network.
 *
 * Stress scenarios:
 *  - 100 sequential bridge transactions
 *  - 20 transactions across all four chains
 *  - 200 read-only getBridgeConfig calls
 *  - 50 sequential configuration updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG as CFG } from './multi-token-bridge-test-config';

// ---------------------------------------------------------------------------
// Test account setup
// ---------------------------------------------------------------------------
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Stress Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
  });

  // -------------------------------------------------------------------------
  // High-volume transactions
  // -------------------------------------------------------------------------

  describe('High-volume transactions', () => {
    it('should process 100 sequential bridge transactions', () => {
      for (let i = 0; i < 100; i++) {
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          i,
          CFG.MIN_BRIDGE_AMOUNT,
          CFG.TEST_CHAINS.ETHEREUM,
          CFG.TEST_ADDRESSES.ETHEREUM,
          MultiTokenBridgeTestUtils.generateTxId(),
          wallet1,
        );
        expect(result.result).toBeOk();
      }
    });

    it('should process transactions across all chains under load', () => {
      const chains = Object.values(CFG.TEST_CHAINS);
      for (let i = 0; i < 20; i++) {
        const chainId = chains[i % chains.length];
        const addr = MultiTokenBridgeTestUtils.getAddressForChain(chainId);
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          i, CFG.MIN_BRIDGE_AMOUNT, chainId, addr,
          MultiTokenBridgeTestUtils.generateTxId(), wallet1,
        );
        expect(result.result).toBeOk();
      }
    });
  });

  // -------------------------------------------------------------------------
  // Concurrent validator operations
  // -------------------------------------------------------------------------

  describe('Concurrent validator operations', () => {
    it('should register multiple validators in sequence', () => {
      const validators = [wallet1, wallet2];

      validators.forEach((validator, i) => {
        const result = MultiTokenBridgeTestUtils.addValidator(
          CFG.TEST_CHAINS.ETHEREUM, validator, CFG.MIN_STAKE_AMOUNT + i * 1_000, deployer,
        );
        expect(result.result).toBeOk();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Read-only performance
  // -------------------------------------------------------------------------

  describe('Read-only performance', () => {
    it('should complete 200 getBridgeConfig calls within 10 seconds', () => {
      const start = Date.now();
      for (let i = 0; i < 200; i++) {
        MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      }
      expect(Date.now() - start).toBeLessThan(10_000);
    });

    it('should complete 50 calculateBridgeFee calls within 5 seconds', () => {
      const start = Date.now();
      for (let i = 0; i < 50; i++) {
        MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, CFG.TEST_CHAINS.ETHEREUM);
      }
      expect(Date.now() - start).toBeLessThan(5_000);
    });
  });

  // -------------------------------------------------------------------------
  // Rapid configuration changes
  // -------------------------------------------------------------------------

  describe('Rapid configuration changes', () => {
    it('should handle 50 sequential configuration updates', () => {
      for (let i = 0; i < 50; i++) {
        const result = MultiTokenBridgeTestUtils.configureBridge(
          CFG.TEST_CHAINS.ETHEREUM,
          i % 2 === 0,
          CFG.MIN_BRIDGE_AMOUNT + i,
          CFG.MAX_BRIDGE_AMOUNT + i * 1_000,
          100 + i,
          10 + i,
          2,
          deployer,
        );
        expect(result.result).toBeOk();
      }
    });
  });
});
