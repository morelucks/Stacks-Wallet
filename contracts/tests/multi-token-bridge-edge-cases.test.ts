/**
 * Multi-Token Bridge Edge Cases
 * Validates boundary conditions and edge-case inputs for the multi-token
 * bridge on Stacks Network.
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

describe('Multi-Token Bridge Edge Cases', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet1], deployer);
  });

  // -------------------------------------------------------------------------
  // Configuration boundary values
  // -------------------------------------------------------------------------

  describe('Configuration boundary values', () => {
    it('should accept minimum valid configuration parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1, 2, 0, 1, 1, deployer,
      );
      expect(result.result).toBeOk();
    });

    it('should accept maximum valid configuration parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 999_999, 1_000_000, CFG.MAX_BRIDGE_FEE, 1_000, CFG.MAX_VALIDATORS, deployer,
      );
      expect(result.result).toBeOk();
    });
  });

  // -------------------------------------------------------------------------
  // Fee calculation edge cases
  // -------------------------------------------------------------------------

  describe('Fee calculation edge cases', () => {
    it('should return zero fee when fee rate is 0', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT, 0, 10, 2, deployer,
      );
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, CFG.TEST_CHAINS.ETHEREUM);
      expect((result.result as any).value['fee-amount']).toBeUint(0);
    });
  });

  // -------------------------------------------------------------------------
  // Transaction amount edge cases
  // -------------------------------------------------------------------------

  describe('Transaction amount edge cases', () => {
    it('should accept the maximum bridge amount', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, CFG.MAX_BRIDGE_AMOUNT, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeOk();
    });

    it('should accept the minimum bridge amount', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, CFG.MIN_BRIDGE_AMOUNT, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeOk();
    });
  });

  // -------------------------------------------------------------------------
  // Signature edge cases
  // -------------------------------------------------------------------------

  describe('Signature edge cases', () => {
    it('should handle an empty signature buffer', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, new Uint8Array(0), true, wallet1,
      );
      expect(result.result).toBeOk();
    });

    it('should handle a maximum-length (65-byte) signature buffer', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const maxSig = new Uint8Array(65).fill(0xff);
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, maxSig, true, wallet1,
      );
      expect(result.result).toBeOk();
    });
  });
});
