/**
 * Bridge Configuration Tests
 * Validates chain configuration updates, validator thresholds, and timeout
 * settings for the SIP-009 cross-chain bridge on Stacks Network.
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Bridge Configuration Tests', () => {
  // -------------------------------------------------------------------------
  // Chain configuration
  // -------------------------------------------------------------------------

  describe('Chain Configuration', () => {
    it('should update chain fee and confirmation settings', () => {
      const newFee = 2_000_000;
      const newConfirmations = 20;

      const result = BridgeTestUtils.updateChainConfig(
        'ethereum',
        true,
        newConfirmations,
        newFee,
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const config = BridgeTestUtils.getChainConfig('ethereum', deployer);
      expect((config.result as any).value['bridge-fee']).toBeUint(newFee);
    });

    it('should reject chain config update from non-owner', () => {
      const result = BridgeTestUtils.updateChainConfig(
        'ethereum',
        true,
        12,
        1_000_000,
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });

    it('should deactivate a chain', () => {
      const result = BridgeTestUtils.updateChainConfig(
        'polygon',
        false, // deactivate
        20,
        BRIDGE_TEST_CONFIG.CHAIN_FEES.polygon,
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const config = BridgeTestUtils.getChainConfig('polygon', deployer);
      expect((config.result as any).value['active']).toBeBool(false);
    });
  });

  // -------------------------------------------------------------------------
  // Validator threshold
  // -------------------------------------------------------------------------

  describe('Validator Threshold', () => {
    it('should update the minimum validator signature count', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'set-min-validator-signatures',
        [Cl.uint(5)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should reject threshold update from non-owner', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'set-min-validator-signatures',
        [Cl.uint(5)],
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });
  });

  // -------------------------------------------------------------------------
  // Bridge timeout
  // -------------------------------------------------------------------------

  describe('Bridge Timeout', () => {
    it('should update the bridge request timeout', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'set-bridge-timeout',
        [Cl.uint(200)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should reject timeout update from non-owner', () => {
      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'set-bridge-timeout',
        [Cl.uint(200)],
        wallet1, // non-owner
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });
  });
});
