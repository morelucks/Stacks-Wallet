/**
 * Bridge Timeout Tests
 * Validates request expiry behaviour for the SIP-009 cross-chain bridge
 * on Stacks Network.
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
/** Number of blocks to advance to guarantee a request has expired */
const TIMEOUT_BLOCKS = BRIDGE_TEST_CONFIG.DEFAULT_TIMEOUT + 10;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Bridge Timeout Tests', () => {
  beforeEach(() => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Expired request validation
  // -------------------------------------------------------------------------

  describe('Expired Request Validation', () => {
    it('should reject validation of an expired request', () => {
      const createResult = BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        ETH_ADDRESS,
        wallet1,
      );
      expect(createResult.result).toBeOk(Cl.uint(1));

      BridgeTestUtils.advanceBlocks(TIMEOUT_BLOCKS);

      const sig = BridgeTestUtils.generateMockSignature();
      const validateResult = simnet.callPublicFn(
        'sip-009-bridge',
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(sig)],
        wallet2,
      );
      expect(validateResult.result).toBeErr(
        Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.REQUEST_EXPIRED),
      );
    });

    it('should accept validation before the timeout window elapses', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      // Advance only half the timeout
      BridgeTestUtils.advanceBlocks(Math.floor(BRIDGE_TEST_CONFIG.DEFAULT_TIMEOUT / 2));

      const sig = BridgeTestUtils.generateMockSignature();
      const validateResult = simnet.callPublicFn(
        'sip-009-bridge',
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(sig)],
        wallet2,
      );
      expect(validateResult.result).toBeOk();
    });
  });

  // -------------------------------------------------------------------------
  // Cancellation of expired requests
  // -------------------------------------------------------------------------

  describe('Cancellation of Expired Requests', () => {
    it('should allow the requester to cancel an expired request', () => {
      const createResult = BridgeTestUtils.createBridgeRequest(
        2,
        'ethereum',
        ETH_ADDRESS,
        wallet1,
      );
      expect(createResult.result).toBeOk(Cl.uint(2));

      BridgeTestUtils.advanceBlocks(TIMEOUT_BLOCKS);

      const cancelResult = BridgeTestUtils.cancelBridgeRequest(2, wallet1);
      expect(cancelResult.result).toBeOk(Cl.bool(true));
    });

    it('should unlock the token after cancelling an expired request', () => {
      BridgeTestUtils.createBridgeRequest(3, 'ethereum', ETH_ADDRESS, wallet1);
      BridgeTestUtils.advanceBlocks(TIMEOUT_BLOCKS);
      BridgeTestUtils.cancelBridgeRequest(3, wallet1);

      expect(BridgeTestUtils.isTokenLocked(3, wallet1).result).toBeBool(false);
    });
  });
});
