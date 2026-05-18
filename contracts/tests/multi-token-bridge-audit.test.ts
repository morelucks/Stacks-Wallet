/**
 * Multi-Token Bridge Audit Tests
 * Validates event emission, transaction history, and statistics tracking
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
const wallet2 = accounts.get('wallet_2')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Audit Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Event emission
  // -------------------------------------------------------------------------

  describe('Event emission', () => {
    it('should emit a print event on bridge configuration', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, 100, 10, 2, deployer,
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });

    it('should emit a print event on validator addition', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet2, 5_000, deployer,
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });

    it('should emit a print event on bridge-tokens', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });
  });

  // -------------------------------------------------------------------------
  // Transaction history
  // -------------------------------------------------------------------------

  describe('Transaction history', () => {
    it('should retain history for multiple transactions', () => {
      const txId1 = MultiTokenBridgeTestUtils.generateTxId();
      const txId2 = MultiTokenBridgeTestUtils.generateTxId();

      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId1, wallet1,
      );
      MultiTokenBridgeTestUtils.bridgeTokens(
        2, 20_000, CFG.TEST_CHAINS.POLYGON, CFG.TEST_ADDRESSES.POLYGON, txId2, wallet1,
      );

      expect(MultiTokenBridgeTestUtils.getBridgeTransaction(txId1).result).toBeSome();
      expect(MultiTokenBridgeTestUtils.getBridgeTransaction(txId2).result).toBeSome();
    });
  });

  // -------------------------------------------------------------------------
  // Statistics tracking
  // -------------------------------------------------------------------------

  describe('Statistics tracking', () => {
    it('should increment total-transactions after a bridge call', () => {
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );

      const stats = MultiTokenBridgeTestUtils.getBridgeStats(CFG.TEST_CHAINS.ETHEREUM);
      expect(stats.result).toBeSome();
      expect((stats.result as any).value?.value?.['total-transactions']).toBeUint(1);
    });
  });

  // -------------------------------------------------------------------------
  // Complete audit trail
  // -------------------------------------------------------------------------

  describe('Complete audit trail', () => {
    it('should provide a full audit trail after a bridge workflow', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      const validator = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      const stats = MultiTokenBridgeTestUtils.getBridgeStats(CFG.TEST_CHAINS.ETHEREUM);

      expect(tx.result).toBeSome();
      expect(validator.result).toBeSome();
      expect(stats.result).toBeSome();
    });
  });
});
