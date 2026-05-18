/**
 * Multi-Token Bridge Complete Transaction Tests
 * Validates the full bridge-tokens → validate → complete lifecycle for the
 * multi-token bridge on Stacks Network.
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
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Complete Transaction Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2, wallet3], deployer);
  });

  // -------------------------------------------------------------------------
  // Successful completion
  // -------------------------------------------------------------------------

  describe('Successful completion', () => {
    it('should complete a bridge transaction after meeting the validator threshold', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const sig = MultiTokenBridgeTestUtils.generateSignature();
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet3);

      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);
      expect(result.result).toBeOk();

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('completed');
    });

    it('should update bridge statistics after completion', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const sig = MultiTokenBridgeTestUtils.generateSignature();
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet3);
      MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);

      const stats = MultiTokenBridgeTestUtils.getBridgeStats(CFG.TEST_CHAINS.ETHEREUM);
      expect(stats.result).toBeSome();
    });
  });

  // -------------------------------------------------------------------------
  // Insufficient signatures
  // -------------------------------------------------------------------------

  describe('Insufficient signatures', () => {
    it('should reject completion when below the validator threshold', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      // Only one signature – threshold is 2
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );

      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);
      expect(result.result).toBeErr();
    });
  });

  // -------------------------------------------------------------------------
  // Non-owner completion
  // -------------------------------------------------------------------------

  describe('Access control', () => {
    it('should reject completion from a non-owner', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const sig = MultiTokenBridgeTestUtils.generateSignature();
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet3);

      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, wallet1);
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });
  });
});
