/**
 * Multi-Token Bridge Security Tests
 * Validates authorisation boundaries, input validation, and replay-attack
 * prevention for the multi-token bridge on Stacks Network.
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Security Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Authorisation boundaries
  // -------------------------------------------------------------------------

  describe('Authorisation boundaries', () => {
    it('should reject bridge configuration from a non-owner', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, 100, 10, 2, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should reject validator addition from a non-owner', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 5_000, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should reject transaction completion from a non-owner', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const sig = MultiTokenBridgeTestUtils.generateSignature();
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);

      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, wallet1);
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  describe('Input validation', () => {
    it('should reject invalid bridge configuration (max < min)', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 500, 100, 10, 2, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should reject a bridge fee above the maximum', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, CFG.MAX_BRIDGE_FEE + 1, 10, 2, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should reject a zero validator stake', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 0, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });
  });

  // -------------------------------------------------------------------------
  // Replay attack prevention
  // -------------------------------------------------------------------------

  describe('Replay attack prevention', () => {
    it('should reject a duplicate signature from the same validator', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const sig = MultiTokenBridgeTestUtils.generateSignature();
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);

      // Reuse the same signature from the same validator
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);
      expect(result.result).toBeErr();
    });
  });

  // -------------------------------------------------------------------------
  // Transaction state integrity
  // -------------------------------------------------------------------------

  describe('Transaction state integrity', () => {
    it('should reject validation of a failed transaction', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2,
      );

      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );
      expect(result.result).toBeErr();
    });

    it('should reject completion of a non-confirmed transaction', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);
      expect(result.result).toBeErr();
    });
  });
});
