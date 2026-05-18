/**
 * Multi-Token Bridge Performance Tests
 * Validates gas consumption, batch efficiency, and read-only performance
 * for the multi-token bridge on Stacks Network.
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Performance Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
  });

  // -------------------------------------------------------------------------
  // Single transaction performance
  // -------------------------------------------------------------------------

  describe('Single transaction performance', () => {
    it('should complete a bridge-tokens call within acceptable time', () => {
      const start = Date.now();
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      const elapsed = Date.now() - start;

      expect(result.result).toBeOk();
      expect(elapsed).toBeLessThan(2_000);
    });
  });

  // -------------------------------------------------------------------------
  // Batch processing efficiency
  // -------------------------------------------------------------------------

  describe('Batch processing efficiency', () => {
    it('should process 10 sequential transactions within 10 seconds', () => {
      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          i, CFG.MIN_BRIDGE_AMOUNT, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
          MultiTokenBridgeTestUtils.generateTxId(), wallet1,
        );
        expect(result.result).toBeOk();
      }

      expect(Date.now() - start).toBeLessThan(10_000);
    });
  });

  // -------------------------------------------------------------------------
  // Read-only performance
  // -------------------------------------------------------------------------

  describe('Read-only performance', () => {
    it('should complete 50 fee calculations within 5 seconds', () => {
      const start = Date.now();

      for (let i = 0; i < 50; i++) {
        MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, CFG.TEST_CHAINS.ETHEREUM);
      }

      expect(Date.now() - start).toBeLessThan(5_000);
    });

    it('should complete 50 getBridgeConfig calls within 5 seconds', () => {
      const start = Date.now();

      for (let i = 0; i < 50; i++) {
        MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      }

      expect(Date.now() - start).toBeLessThan(5_000);
    });
  });
});
