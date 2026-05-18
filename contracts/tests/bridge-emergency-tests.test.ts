/**
 * Bridge Emergency Tests
 * Validates emergency pause and token unlock operations for the
 * SIP-009 cross-chain bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('Bridge Emergency Tests', () => {
  // -------------------------------------------------------------------------
  // Emergency pause
  // -------------------------------------------------------------------------

  describe('Emergency Pause', () => {
    afterEach(() => {
      // Always re-enable the bridge so subsequent tests are not affected
      BridgeTestUtils.setBridgeEnabled(true, deployer);
    });

    it('should pause the bridge via emergency-pause', () => {
      const result = simnet.callPublicFn('sip-009-bridge', 'emergency-pause', [], deployer);
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should prevent new bridge requests while paused', () => {
      simnet.callPublicFn('sip-009-bridge', 'emergency-pause', [], deployer);

      const result = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.BRIDGE_DISABLED));
    });

    it('should reject emergency-pause from a non-owner', () => {
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
  // Emergency token unlock
  // -------------------------------------------------------------------------

  describe('Emergency Token Unlock', () => {
    beforeEach(() => {
      BridgeTestUtils.setupValidators([wallet2], deployer);
    });

    it('should unlock a token that is stuck in the bridge', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(true);

      const unlockResult = BridgeTestUtils.emergencyUnlockToken(1, deployer);
      expect(unlockResult.result).toBeOk(Cl.bool(true));

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
    });

    it('should reject emergency unlock from a non-owner', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const result = BridgeTestUtils.emergencyUnlockToken(1, wallet1); // non-owner
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });

    it('should return INVALID_REQUEST when unlocking a non-locked token', () => {
      const result = BridgeTestUtils.emergencyUnlockToken(9_999, deployer);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_REQUEST));
    });
  });
});
