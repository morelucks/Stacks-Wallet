/**
 * Bridge Batch Operation Tests
 * Validates batch bridge request processing for the SIP-009 cross-chain
 * bridge on Stacks Network.
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Bridge Batch Operation Tests', () => {
  beforeEach(() => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Successful batch processing
  // -------------------------------------------------------------------------

  describe('Successful Batch Processing', () => {
    it('should process a batch of requests for different tokens and chains', () => {
      const requests = [
        {
          tokenId: 1,
          targetChain: 'ethereum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        },
        {
          tokenId: 2,
          targetChain: 'polygon',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon,
        },
      ];

      const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
      expect(result.result).toBeOk();
    });

    it('should lock all tokens in a successful batch', () => {
      const requests = [
        {
          tokenId: 10,
          targetChain: 'ethereum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        },
        {
          tokenId: 11,
          targetChain: 'arbitrum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.arbitrum,
        },
      ];

      BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);

      expect(BridgeTestUtils.isTokenLocked(10, wallet1).result).toBeBool(true);
      expect(BridgeTestUtils.isTokenLocked(11, wallet1).result).toBeBool(true);
    });

    it('should charge the correct total fee for a batch', () => {
      const requests = [
        {
          tokenId: 20,
          targetChain: 'ethereum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        },
        {
          tokenId: 21,
          targetChain: 'polygon',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon,
        },
        {
          tokenId: 22,
          targetChain: 'arbitrum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.arbitrum,
        },
      ];

      const expectedFee =
        BRIDGE_TEST_CONFIG.CHAIN_FEES.ethereum +
        BRIDGE_TEST_CONFIG.CHAIN_FEES.polygon +
        BRIDGE_TEST_CONFIG.CHAIN_FEES.arbitrum;

      const before = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
      BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
      const after = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;

      expect(before - after).toBe(expectedFee);
    });
  });

  // -------------------------------------------------------------------------
  // Atomic failure
  // -------------------------------------------------------------------------

  describe('Atomic Failure', () => {
    it('should reject the entire batch when a duplicate token ID is included', () => {
      const requests = [
        {
          tokenId: 1,
          targetChain: 'ethereum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        },
        {
          tokenId: 1, // duplicate – should cause the whole batch to fail
          targetChain: 'polygon',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon,
        },
      ];

      const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
      expect(result.result).toBeErr();
    });

    it('should not lock any tokens when a batch fails', () => {
      // First lock token 1 individually
      BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );

      // Batch that includes the already-locked token 1
      const requests = [
        {
          tokenId: 30,
          targetChain: 'polygon',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon,
        },
        {
          tokenId: 1, // already locked
          targetChain: 'arbitrum',
          targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.arbitrum,
        },
      ];

      BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);

      // Token 30 should NOT be locked because the batch failed atomically
      expect(BridgeTestUtils.isTokenLocked(30, wallet1).result).toBeBool(false);
    });
  });
});
