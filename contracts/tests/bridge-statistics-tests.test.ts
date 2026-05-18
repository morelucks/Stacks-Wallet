/**
 * Bridge Statistics Tests
 * Validates statistics tracking and analytics read-only functions for the
 * SIP-009 cross-chain bridge on Stacks Network.
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

describe('Bridge Statistics Tests', () => {
  beforeEach(() => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Per-chain statistics
  // -------------------------------------------------------------------------

  describe('Per-Chain Statistics', () => {
    it('should return statistics for a configured chain', () => {
      const stats = BridgeTestUtils.getBridgeStats('ethereum', deployer);
      expect(stats.result).toBeSome();
    });

    it('should return statistics for all supported chains', () => {
      const chains = Object.keys(BRIDGE_TEST_CONFIG.CHAIN_FEES);
      for (const chain of chains) {
        const stats = BridgeTestUtils.getBridgeStats(chain, deployer);
        expect(stats.result).toBeSome();
      }
    });

    it('should increment request count after a bridge request is created', () => {
      const before = BridgeTestUtils.getBridgeStats('ethereum', deployer);
      const beforeCount = Number(
        (before.result as any).value?.['total-requests']?.value ?? 0,
      );

      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const after = BridgeTestUtils.getBridgeStats('ethereum', deployer);
      const afterCount = Number(
        (after.result as any).value?.['total-requests']?.value ?? 0,
      );

      expect(afterCount).toBe(beforeCount + 1);
    });
  });

  // -------------------------------------------------------------------------
  // Global bridge status
  // -------------------------------------------------------------------------

  describe('Global Bridge Status', () => {
    it('should return a tuple with an enabled field', () => {
      const status = BridgeTestUtils.getBridgeStatus(deployer);
      expect(status.result).toBeTuple();
      expect((status.result as any)['enabled']).toBeBool(true);
    });

    it('should reflect disabled state after bridge is paused', () => {
      BridgeTestUtils.setBridgeEnabled(false, deployer);

      const status = BridgeTestUtils.getBridgeStatus(deployer);
      expect((status.result as any)['enabled']).toBeBool(false);

      // Restore
      BridgeTestUtils.setBridgeEnabled(true, deployer);
    });
  });

  // -------------------------------------------------------------------------
  // Bridge analytics
  // -------------------------------------------------------------------------

  describe('Bridge Analytics', () => {
    it('should return a tuple from get-bridge-analytics', () => {
      const analytics = simnet.callReadOnlyFn(
        'sip-009-bridge',
        'get-bridge-analytics',
        [],
        deployer,
      );
      expect(analytics.result).toBeTuple();
    });

    it('should return analytics after multiple requests', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      BridgeTestUtils.createBridgeRequest(2, 'polygon', BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon, wallet1);

      const analytics = simnet.callReadOnlyFn(
        'sip-009-bridge',
        'get-bridge-analytics',
        [],
        deployer,
      );
      expect(analytics.result).toBeTuple();
    });
  });
});
