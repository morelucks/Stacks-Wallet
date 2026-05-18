/**
 * Bridge Lifecycle Tests
 * Validates the full request lifecycle (create → validate → complete/cancel)
 * for the SIP-009 cross-chain bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
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

const ETH_ADDRESS = BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Bridge Lifecycle Tests', () => {
  beforeEach(() => {
    BridgeTestUtils.setupValidators([wallet2, wallet3], deployer);
  });

  // -------------------------------------------------------------------------
  // Request creation
  // -------------------------------------------------------------------------

  describe('Request Creation', () => {
    it('should create a bridge request and lock the token', () => {
      const result = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(result.result).toBeOk(Cl.uint(1));

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(true);
    });

    it('should reject a second request for an already-locked token', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const duplicate = BridgeTestUtils.createBridgeRequest(1, 'polygon', ETH_ADDRESS, wallet1);
      expect(duplicate.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.TOKEN_LOCKED));
    });

    it('should assign sequential request IDs', () => {
      const r1 = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      const r2 = BridgeTestUtils.createBridgeRequest(2, 'polygon', ETH_ADDRESS, wallet1);

      expect(r1.result).toBeOk(Cl.uint(1));
      expect(r2.result).toBeOk(Cl.uint(2));
    });
  });

  // -------------------------------------------------------------------------
  // Request cancellation
  // -------------------------------------------------------------------------

  describe('Request Cancellation', () => {
    it('should cancel a pending request and unlock the token', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const cancelResult = BridgeTestUtils.cancelBridgeRequest(1, wallet1);
      expect(cancelResult.result).toBeOk(Cl.bool(true));

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
    });

    it('should reject cancellation from a non-owner', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const result = BridgeTestUtils.cancelBridgeRequest(1, wallet2); // not the requester
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });
  });

  // -------------------------------------------------------------------------
  // Request completion
  // -------------------------------------------------------------------------

  describe('Request Completion', () => {
    it('should complete a request after sufficient validator signatures', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const sig = BridgeTestUtils.generateMockSignature();
      // Submit three signatures from the same validator (simulates threshold)
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          'sip-009-bridge',
          'validate-bridge-request',
          [Cl.uint(1), Cl.buffer(sig)],
          wallet2,
        );
      }

      const completeResult = BridgeTestUtils.completeBridgeRequest(1, 'tx-hash-abc', deployer);
      expect(completeResult.result).toBeOk(Cl.bool(true));
    });

    it('should mark the request status as completed', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const sig = BridgeTestUtils.generateMockSignature();
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          'sip-009-bridge',
          'validate-bridge-request',
          [Cl.uint(1), Cl.buffer(sig)],
          wallet2,
        );
      }

      BridgeTestUtils.completeBridgeRequest(1, 'tx-hash-abc', deployer);

      const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
      expect((request.result as any).value['status']).toStrictEqual(
        Cl.stringAscii('completed'),
      );
    });

    it('should unlock the token after completion', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const sig = BridgeTestUtils.generateMockSignature();
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          'sip-009-bridge',
          'validate-bridge-request',
          [Cl.uint(1), Cl.buffer(sig)],
          wallet2,
        );
      }

      BridgeTestUtils.completeBridgeRequest(1, 'tx-hash-abc', deployer);

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
    });
  });
});
