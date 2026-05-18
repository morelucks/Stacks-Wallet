/**
 * Multi-Token Bridge Error Handling Tests
 * Validates that the multi-token bridge on Stacks Network returns the correct
 * error codes for all invalid-input, access-control, and state-validation scenarios.
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

describe('Multi-Token Bridge Error Handling Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Authorisation errors
  // -------------------------------------------------------------------------

  describe('Authorisation errors', () => {
    it('should return UNAUTHORIZED for non-owner bridge configuration', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, 100, 10, 2, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should return UNAUTHORIZED for non-owner validator addition', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 5_000, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should return UNAUTHORIZED when a non-validator submits a signature', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should return consistent UNAUTHORIZED codes across all admin functions', () => {
      const results = [
        MultiTokenBridgeTestUtils.configureBridge(
          CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, 100, 10, 2, wallet1,
        ),
        MultiTokenBridgeTestUtils.addValidator(
          CFG.TEST_CHAINS.ETHEREUM, wallet1, 5_000, wallet1,
        ),
      ];

      for (const result of results) {
        expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
      }
    });
  });

  // -------------------------------------------------------------------------
  // Invalid parameter errors
  // -------------------------------------------------------------------------

  describe('Invalid parameter errors', () => {
    it('should return INVALID_PARAMETER when max-amount < min-amount', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 500, 100, 10, 2, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return INVALID_PARAMETER for a fee above 10 %', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, 1_500, 10, 2, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return INVALID_PARAMETER for a zero validator stake', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 0, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return INVALID_PARAMETER for an amount below the chain minimum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 500, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return INVALID_PARAMETER for an amount above the chain maximum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 2_000_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return INVALID_PARAMETER for an empty destination address', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, '',
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });
  });

  // -------------------------------------------------------------------------
  // Invalid chain errors
  // -------------------------------------------------------------------------

  describe('Invalid chain errors', () => {
    it('should return INVALID_CHAIN for an unconfigured chain ID', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, 999, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });

    it('should return INVALID_CHAIN for a disabled chain', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.BITCOIN, false, 1_000, 100_000, 100, 10, 2, deployer,
      );
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.BITCOIN, CFG.TEST_ADDRESSES.BITCOIN,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });

    it('should return INVALID_CHAIN for fee calculation on an invalid chain', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, 999);
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });
  });

  // -------------------------------------------------------------------------
  // Not found errors
  // -------------------------------------------------------------------------

  describe('Not found errors', () => {
    it('should return NOT_FOUND when validating a non-existent transaction', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId(),
        MultiTokenBridgeTestUtils.generateSignature(),
        true, wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.NOT_FOUND));
    });

    it('should return NOT_FOUND when completing a non-existent transaction', () => {
      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId(), deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.NOT_FOUND));
    });
  });

  // -------------------------------------------------------------------------
  // State validation errors
  // -------------------------------------------------------------------------

  describe('State validation errors', () => {
    it('should return INVALID_PARAMETER when validating a failed transaction', () => {
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
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should return INVALID_PARAMETER when completing a non-confirmed transaction', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );

      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });
  });

  // -------------------------------------------------------------------------
  // Error state stability
  // -------------------------------------------------------------------------

  describe('Error state stability', () => {
    it('should remain stable after multiple consecutive errors', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 500, 100, 10, 2, deployer,
      );
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet1, 0, deployer);
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 0, 999, '', MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );

      const overview = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(overview.result).toBeOk();
    });
  });
});
