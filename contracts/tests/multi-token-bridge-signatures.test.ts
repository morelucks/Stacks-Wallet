/**
 * Multi-Token Bridge Signature Validation Tests
 * Validates signature collection, threshold checking, validator reputation
 * updates, and cross-chain signature independence for the multi-token bridge
 * on Stacks Network.
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
const wallet4 = accounts.get('wallet_4')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Signature Validation Tests', () => {
  let txId: Uint8Array;

  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2, wallet3, wallet4], deployer);

    txId = MultiTokenBridgeTestUtils.generateTxId();
    MultiTokenBridgeTestUtils.bridgeTokens(
      1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
    );
  });

  // -------------------------------------------------------------------------
  // validate-bridge-transaction function
  // -------------------------------------------------------------------------

  describe('validate-bridge-transaction', () => {
    it('should accept a valid signature from an authorised validator', () => {
      const sig = MultiTokenBridgeTestUtils.generateSignature();
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);
      expect(result.result).toBeOk(Cl.bool(true));

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['validator-signatures']).toBeList([Cl.buffer(sig)]);
    });

    it('should return UNAUTHORIZED for a non-validator', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should return NOT_FOUND for a non-existent transaction', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId(),
        MultiTokenBridgeTestUtils.generateSignature(),
        true, wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.NOT_FOUND));
    });

    it('should mark the transaction as failed when a validator rejects', () => {
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2,
      );

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('failed');
    });

    it('should accept an empty signature buffer', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, new Uint8Array(0), true, wallet2,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should accept a maximum-length (65-byte) signature buffer', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, new Uint8Array(65).fill(0xff), true, wallet2,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  // -------------------------------------------------------------------------
  // Signature collection and threshold
  // -------------------------------------------------------------------------

  describe('Signature collection and threshold', () => {
    it('should collect signatures from multiple validators', () => {
      const sig1 = MultiTokenBridgeTestUtils.generateSignature();
      const sig2 = MultiTokenBridgeTestUtils.generateSignature();

      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig1, true, wallet2);
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig2, true, wallet3);

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['validator-signatures']).toBeList([
        Cl.buffer(sig1),
        Cl.buffer(sig2),
      ]);
    });

    it('should confirm the transaction when the threshold is met', () => {
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet3,
      );

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('confirmed');
    });

    it('should remain pending with only one signature', () => {
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('pending');
    });

    it('should respect a higher validator threshold on a different chain', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.BITCOIN, true,
        CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT,
        CFG.DEFAULT_BRIDGE_FEE, 10, 3, deployer,
      );

      const btcTxId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.BITCOIN, CFG.TEST_ADDRESSES.BITCOIN, btcTxId, wallet1,
      );

      MultiTokenBridgeTestUtils.validateBridgeTransaction(btcTxId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2);
      MultiTokenBridgeTestUtils.validateBridgeTransaction(btcTxId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet3);

      let tx = MultiTokenBridgeTestUtils.getBridgeTransaction(btcTxId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('pending');

      MultiTokenBridgeTestUtils.validateBridgeTransaction(btcTxId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet4);

      tx = MultiTokenBridgeTestUtils.getBridgeTransaction(btcTxId);
      expect((tx.result as any).value?.value?.['status']).toBeAscii('confirmed');
    });
  });

  // -------------------------------------------------------------------------
  // Validator reputation updates
  // -------------------------------------------------------------------------

  describe('Validator reputation updates', () => {
    it('should increment total-validations after a successful validation', () => {
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );

      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      expect((info.result as any).value?.['total-validations']).toBeUint(1);
    });

    it('should decrease reputation score after a rejection', () => {
      const before = Number(
        (MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2).result as any)
          .value?.['reputation-score']?.value ?? 100,
      );

      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2,
      );

      const after = Number(
        (MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2).result as any)
          .value?.['reputation-score']?.value ?? 0,
      );

      expect(after).toBeLessThan(before);
    });

    it('should not allow reputation to drop below zero', () => {
      for (let i = 0; i < 25; i++) {
        const tempTxId = MultiTokenBridgeTestUtils.generateTxId();
        MultiTokenBridgeTestUtils.bridgeTokens(
          i + 10, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, tempTxId, wallet1,
        );
        MultiTokenBridgeTestUtils.validateBridgeTransaction(
          tempTxId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2,
        );
      }

      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      const score = Number((info.result as any).value?.['reputation-score']?.value ?? 0);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should start validators at maximum reputation (100)', () => {
      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      expect((info.result as any).value?.['reputation-score']).toBeUint(100);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-chain signature independence
  // -------------------------------------------------------------------------

  describe('Cross-chain signature independence', () => {
    it('should validate signatures independently on different chains', () => {
      const btcTxId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.BITCOIN, CFG.TEST_ADDRESSES.BITCOIN, btcTxId, wallet1,
      );

      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2);
      MultiTokenBridgeTestUtils.validateBridgeTransaction(btcTxId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2);

      const ethTx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      const btcTx = MultiTokenBridgeTestUtils.getBridgeTransaction(btcTxId);

      expect((ethTx.result as any).value?.value?.['validator-signatures']).toHaveLength(1);
      expect((btcTx.result as any).value?.value?.['validator-signatures']).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('Signature validation error handling', () => {
    it('should return INVALID_PARAMETER when validating an already-failed transaction', () => {
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2,
      );

      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet3,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return UNAUTHORIZED when the deployer (non-validator) submits a signature', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });
  });
});
