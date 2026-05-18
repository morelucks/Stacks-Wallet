/**
 * Bridge Integration Tests
 * End-to-end workflow tests for the SIP-009 cross-chain bridge on Stacks Network.
 * These tests exercise the full request lifecycle across multiple chains and users.
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
const wallet4 = accounts.get('wallet_4')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Bridge Integration Tests', () => {
  beforeEach(() => {
    BridgeTestUtils.setupValidators([wallet2, wallet3, wallet4], deployer);
  });

  // -------------------------------------------------------------------------
  // Full bridge workflow
  // -------------------------------------------------------------------------

  describe('Full Bridge Workflow', () => {
    it('should complete the full create → validate → complete lifecycle', () => {
      // Step 1: Create bridge request
      const createResult = BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );
      expect(createResult.result).toBeOk(Cl.uint(1));

      // Step 2: Validators sign the request
      const sig = BridgeTestUtils.generateMockSignature();
      for (const validator of [wallet2, wallet3, wallet4]) {
        const validateResult = simnet.callPublicFn(
          'sip-009-bridge',
          'validate-bridge-request',
          [Cl.uint(1), Cl.buffer(sig)],
          validator,
        );
        expect(validateResult.result).toBeOk();
      }

      // Step 3: Complete the request
      const completeResult = BridgeTestUtils.completeBridgeRequest(
        1,
        'eth-tx-hash-0xabc',
        deployer,
      );
      expect(completeResult.result).toBeOk(Cl.bool(true));

      // Step 4: Verify final state
      const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
      expect((request.result as any).value['status']).toStrictEqual(
        Cl.stringAscii('completed'),
      );
      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
    });

    it('should complete the full create → cancel lifecycle', () => {
      BridgeTestUtils.createBridgeRequest(
        2,
        'polygon',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon,
        wallet1,
      );

      const cancelResult = BridgeTestUtils.cancelBridgeRequest(2, wallet1);
      expect(cancelResult.result).toBeOk(Cl.bool(true));

      expect(BridgeTestUtils.isTokenLocked(2, wallet1).result).toBeBool(false);
    });
  });

  // -------------------------------------------------------------------------
  // Multi-chain operations
  // -------------------------------------------------------------------------

  describe('Multi-Chain Operations', () => {
    it('should create requests for all four supported chains', () => {
      const chains = Object.keys(BRIDGE_TEST_CONFIG.CHAIN_FEES) as Array<
        keyof typeof BRIDGE_TEST_CONFIG.CHAIN_FEES
      >;

      chains.forEach((chain, i) => {
        const result = BridgeTestUtils.createBridgeRequest(
          i + 10,
          chain,
          BRIDGE_TEST_CONFIG.TEST_ADDRESSES[chain],
          wallet1,
        );
        expect(result.result).toBeOk(Cl.uint(i + 1));
      });
    });

    it('should maintain independent state for each chain', () => {
      BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );
      BridgeTestUtils.createBridgeRequest(
        2,
        'polygon',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon,
        wallet1,
      );

      // Cancelling the ethereum request should not affect the polygon request
      BridgeTestUtils.cancelBridgeRequest(1, wallet1);

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
      expect(BridgeTestUtils.isTokenLocked(2, wallet1).result).toBeBool(true);
    });
  });

  // -------------------------------------------------------------------------
  // Concurrent users
  // -------------------------------------------------------------------------

  describe('Concurrent Users', () => {
    it('should handle requests from multiple users simultaneously', () => {
      const users = [wallet1, wallet2, wallet3];

      users.forEach((user, i) => {
        const result = BridgeTestUtils.createBridgeRequest(
          i + 100,
          'ethereum',
          BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
          user,
        );
        expect(result.result).toBeOk();
      });

      // Verify each token is locked under its respective user
      users.forEach((user, i) => {
        expect(BridgeTestUtils.isTokenLocked(i + 100, user).result).toBeBool(true);
      });
    });
  });
});
