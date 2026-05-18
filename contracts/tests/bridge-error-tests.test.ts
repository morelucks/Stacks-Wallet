/**
 * Bridge Error Handling Tests
 * Validates that the SIP-009 cross-chain bridge on Stacks Network returns
 * the correct error codes for all invalid-input and access-control scenarios.
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

const ETH_ADDRESS = BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Bridge Error Handling Tests', () => {
  // -------------------------------------------------------------------------
  // Invalid chain
  // -------------------------------------------------------------------------

  describe('Invalid Chain Errors', () => {
    it('should return INVALID_CHAIN for an unsupported chain name', () => {
      const result = BridgeTestUtils.createBridgeRequest(
        1,
        'invalid-chain',
        ETH_ADDRESS,
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_CHAIN));
    });

    it('should return INVALID_CHAIN for an empty chain name', () => {
      const result = BridgeTestUtils.createBridgeRequest(1, '', ETH_ADDRESS, wallet1);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_CHAIN));
    });
  });

  // -------------------------------------------------------------------------
  // Authorisation errors
  // -------------------------------------------------------------------------

  describe('Authorisation Errors', () => {
    it('should return NOT_AUTHORIZED when a non-owner calls add-validator', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'add-validator',
        [Cl.principal(wallet2)],
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });

    it('should return NOT_AUTHORIZED when a non-owner disables the bridge', () => {
      const result = BridgeTestUtils.setBridgeEnabled(false, wallet1);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });

    it('should return NOT_AUTHORIZED when a non-owner calls emergency-pause', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'emergency-pause',
        [],
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });
  });

  // -------------------------------------------------------------------------
  // Bridge disabled
  // -------------------------------------------------------------------------

  describe('Bridge Disabled Errors', () => {
    beforeEach(() => {
      BridgeTestUtils.setBridgeEnabled(false, deployer);
    });

    it('should return BRIDGE_DISABLED when creating a request while paused', () => {
      const result = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.BRIDGE_DISABLED));
    });

    it('should allow requests again after re-enabling the bridge', () => {
      BridgeTestUtils.setBridgeEnabled(true, deployer);
      BridgeTestUtils.setupValidators([wallet2], deployer);

      const result = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(result.result).toBeOk(Cl.uint(1));
    });
  });

  // -------------------------------------------------------------------------
  // Token locked
  // -------------------------------------------------------------------------

  describe('Token Locked Errors', () => {
    beforeEach(() => {
      BridgeTestUtils.setupValidators([wallet2], deployer);
    });

    it('should return TOKEN_LOCKED when bridging an already-locked token', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const duplicate = BridgeTestUtils.createBridgeRequest(1, 'polygon', ETH_ADDRESS, wallet1);
      expect(duplicate.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.TOKEN_LOCKED));
    });
  });

  // -------------------------------------------------------------------------
  // Invalid request
  // -------------------------------------------------------------------------

  describe('Invalid Request Errors', () => {
    it('should return INVALID_REQUEST for a non-existent request ID', () => {
      const result = BridgeTestUtils.cancelBridgeRequest(9_999, wallet1);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_REQUEST));
    });
  });
});
