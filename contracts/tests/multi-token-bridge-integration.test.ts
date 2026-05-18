/**
 * Multi-Token Bridge Integration Tests
 * End-to-end workflow tests for the multi-token bridge on Stacks Network.
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
const wallet3 = accounts.get('wallet_3')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Integration Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2, wallet3], deployer);
  });

  // -------------------------------------------------------------------------
  // Full bridge workflow
  // -------------------------------------------------------------------------

  describe('Full bridge workflow', () => {
    it('should complete the full bridge-tokens → validate → complete lifecycle', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      const bridgeResult = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
      expect(bridgeResult.result).toBeOk();

      const sig = MultiTokenBridgeTestUtils.generateSignature();
      const validateResult = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, sig, true, wallet2,
      );
      expect(validateResult.result).toBeOk();

      const completeResult = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);
      expect(completeResult.result).toBeOk();
    });
  });

  // -------------------------------------------------------------------------
  // Multi-validator consensus
  // -------------------------------------------------------------------------

  describe('Multi-validator consensus', () => {
    it('should confirm a transaction after two validators sign', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet3,
      );

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('confirmed');
    });

    it('should remain pending with only one validator signature', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('pending');
    });
  });

  // -------------------------------------------------------------------------
  // Multi-chain integration
  // -------------------------------------------------------------------------

  describe('Multi-chain integration', () => {
    it('should process concurrent transactions on different chains', () => {
      const chains = [
        { id: CFG.TEST_CHAINS.ETHEREUM, addr: CFG.TEST_ADDRESSES.ETHEREUM },
        { id: CFG.TEST_CHAINS.POLYGON, addr: CFG.TEST_ADDRESSES.POLYGON },
      ];

      for (const { id, addr } of chains) {
        const txId = MultiTokenBridgeTestUtils.generateTxId();
        const result = MultiTokenBridgeTestUtils.bridgeTokens(1, 10_000, id, addr, txId, wallet1);
        expect(result.result).toBeOk();
      }
    });
  });
});
