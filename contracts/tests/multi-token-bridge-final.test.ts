/**
 * Multi-Token Bridge Final Integration Tests
 * Comprehensive end-to-end system tests verifying that all bridge components
 * work together correctly on Stacks Network.
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

describe('Multi-Token Bridge Final Integration Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Comprehensive system test
  // -------------------------------------------------------------------------

  describe('Comprehensive bridge system test', () => {
    it('should exercise all major bridge functions in a single workflow', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      // Bridge tokens
      const bridgeResult = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
      expect(bridgeResult.result).toBeOk();

      // Validate
      const validateResult = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );
      expect(validateResult.result).toBeOk();

      // Query all data
      const config = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      const validator = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      const stats = MultiTokenBridgeTestUtils.getBridgeStats(CFG.TEST_CHAINS.ETHEREUM);
      const overview = MultiTokenBridgeTestUtils.getBridgeOverview();

      expect(config.result).toBeSome();
      expect(transaction.result).toBeSome();
      expect(validator.result).toBeSome();
      expect(stats.result).toBeSome();
      expect(overview.result).toBeOk();
    });
  });

  // -------------------------------------------------------------------------
  // System integrity under load
  // -------------------------------------------------------------------------

  describe('System integrity under load', () => {
    it('should remain responsive after 20 sequential bridge transactions', () => {
      for (let i = 0; i < 20; i++) {
        MultiTokenBridgeTestUtils.bridgeTokens(
          i, CFG.MIN_BRIDGE_AMOUNT + i * 100, CFG.TEST_CHAINS.ETHEREUM,
          CFG.TEST_ADDRESSES.ETHEREUM, MultiTokenBridgeTestUtils.generateTxId(), wallet1,
        );
      }

      const overview = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(overview.result).toBeOk();
      expect(Number((overview.result as any).value?.['total-volume']?.value ?? 0)).toBeGreaterThan(0);
    });
  });
});
