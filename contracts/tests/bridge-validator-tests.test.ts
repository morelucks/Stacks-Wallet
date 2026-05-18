/**
 * Bridge Validator Tests
 * Validates validator management and signature verification for the
 * SIP-009 cross-chain bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import fc from 'fast-check';
import { BridgeTestUtils } from './bridge-test-utils';
import { BRIDGE_TEST_CONFIG } from './bridge-test-config';

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

describe('Bridge Validator Tests', () => {
  // -------------------------------------------------------------------------
  // Validator management
  // -------------------------------------------------------------------------

  describe('Validator Management', () => {
    it('should add a validator successfully', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'add-validator',
        [Cl.principal(wallet2)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should remove a validator successfully', () => {
      simnet.callPublicFn(
        'sip-009-bridge',
        'add-validator',
        [Cl.principal(wallet2)],
        deployer,
      );

      const removeResult = simnet.callPublicFn(
        'sip-009-bridge',
        'remove-validator',
        [Cl.principal(wallet2)],
        deployer,
      );
      expect(removeResult.result).toBeOk(Cl.bool(true));
    });

    it('should initialise validator reputation at 100', () => {
      simnet.callPublicFn(
        'sip-009-bridge',
        'add-validator',
        [Cl.principal(wallet2)],
        deployer,
      );

      const info = BridgeTestUtils.getValidatorInfo(wallet2, deployer);
      expect(info.result).toBeSome();
      expect((info.result as any).value['reputation-score']).toBeUint(100);
    });

    it('should reject add-validator from non-owner', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'add-validator',
        [Cl.principal(wallet3)],
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });

    it('should reject remove-validator from non-owner', () => {
      BridgeTestUtils.setupValidators([wallet2], deployer);

      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'remove-validator',
        [Cl.principal(wallet2)],
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });
  });

  // -------------------------------------------------------------------------
  // Signature validation
  // -------------------------------------------------------------------------

  describe('Signature Validation', () => {
    beforeEach(() => {
      BridgeTestUtils.setupValidators([wallet2, wallet3], deployer);
    });

    it('should accept a valid signature from a registered validator', () => {
      const createResult = BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );
      expect(createResult.result).toBeOk(Cl.uint(1));

      const signature = BridgeTestUtils.generateMockSignature();
      const validateResult = simnet.callPublicFn(
        'sip-009-bridge',
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(signature)],
        wallet2,
      );
      expect(validateResult.result).toBeOk();
    });

    it('should reject a signature from an unregistered validator', () => {
      BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );

      const signature = BridgeTestUtils.generateMockSignature();
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(signature)],
        wallet1, // not a validator
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });

    it('should allow multiple validators to sign the same request', () => {
      BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );

      const sig = BridgeTestUtils.generateMockSignature();

      const r1 = simnet.callPublicFn(
        'sip-009-bridge',
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(sig)],
        wallet2,
      );
      const r2 = simnet.callPublicFn(
        'sip-009-bridge',
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(sig)],
        wallet3,
      );

      expect(r1.result).toBeOk();
      expect(r2.result).toBeOk();
    });
  });
});
