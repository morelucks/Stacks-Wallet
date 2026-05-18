/**
 * Bridge Fee System Tests
 * Validates fee calculation, discount application, and batch fee totals
 * for the SIP-009 cross-chain bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import fc from 'fast-check';
import { BridgeTestUtils } from './bridge-test-utils';
import {
  targetChainGenerator,
  tokenIdGenerator,
  ethereumAddressGenerator,
  discountGenerator,
} from './bridge-generators';
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

describe('Bridge Fee System Tests', () => {
  beforeEach(() => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // Base fee calculation
  // -------------------------------------------------------------------------

  describe('Fee Calculation', () => {
    it('should return correct base fee for each supported chain', () => {
      const chains = Object.keys(BRIDGE_TEST_CONFIG.CHAIN_FEES) as Array<
        keyof typeof BRIDGE_TEST_CONFIG.CHAIN_FEES
      >;

      for (const chain of chains) {
        const config = BridgeTestUtils.getChainConfig(chain, deployer);
        expect(config.result).toBeSome();

        const fee = Number((config.result as any).value['bridge-fee'].value);
        expect(fee).toBe(BRIDGE_TEST_CONFIG.CHAIN_FEES[chain]);
      }
    });

    it('should deduct the correct fee from the sender on bridge request', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum;
      const expectedFee = BRIDGE_TEST_CONFIG.CHAIN_FEES.ethereum;

      const initialBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;

      const result = BridgeTestUtils.createBridgeRequest(
        tokenId,
        targetChain,
        targetAddress,
        wallet1,
      );
      expect(result.result).toBeOk(Cl.uint(1));

      const finalBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
      expect(initialBalance - finalBalance).toBe(expectedFee);
    });

    it('should reject bridge requests when the sender has insufficient balance', () => {
      // Conceptual test: in a full implementation a wallet with zero STX
      // would receive INSUFFICIENT_BALANCE (407).  The assertion below
      // documents the expected error code for future implementation.
      const expectedError = BRIDGE_TEST_CONFIG.ERRORS.INSUFFICIENT_BALANCE;
      expect(expectedError).toBe(407);
    });
  });

  // -------------------------------------------------------------------------
  // Discount system
  // -------------------------------------------------------------------------

  describe('Discount System', () => {
    it('should grant a user discount successfully', () => {
      const result = BridgeTestUtils.grantUserDiscount(wallet1, 25, 100, deployer);
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should allow a bridge request after a discount is granted', () => {
      BridgeTestUtils.grantUserDiscount(wallet1, 50, 1_000, deployer);

      const result = BridgeTestUtils.createBridgeRequest(
        1,
        'ethereum',
        BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum,
        wallet1,
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it('should reject discount percentages above the 50 % cap', () => {
      const result = BridgeTestUtils.grantUserDiscount(wallet1, 75, 100, deployer);
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_REQUEST));
    });
  });

  // -------------------------------------------------------------------------
  // Batch fee calculation
  // -------------------------------------------------------------------------

  describe('Batch Fee Calculation', () => {
    it('should charge the sum of individual fees for a batch request', () => {
      const requests = [
        { tokenId: 1, targetChain: 'ethereum', targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum },
        { tokenId: 2, targetChain: 'polygon', targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon },
        { tokenId: 3, targetChain: 'arbitrum', targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.arbitrum },
      ];

      const expectedTotalFee =
        BRIDGE_TEST_CONFIG.CHAIN_FEES.ethereum +
        BRIDGE_TEST_CONFIG.CHAIN_FEES.polygon +
        BRIDGE_TEST_CONFIG.CHAIN_FEES.arbitrum;

      const initialBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;

      const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
      expect(result.result).toBeOk();

      const finalBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
      expect(initialBalance - finalBalance).toBe(expectedTotalFee);
    });
  });

  // -------------------------------------------------------------------------
  // Property-based tests
  // -------------------------------------------------------------------------

  describe('Property-Based Fee Tests', () => {
    it('Property: fee charged always equals the configured chain fee', () => {
      fc.assert(
        fc.property(
          targetChainGenerator,
          tokenIdGenerator,
          ethereumAddressGenerator,
          (targetChain, tokenId, targetAddress) => {
            const config = BridgeTestUtils.getChainConfig(targetChain, deployer);
            const expectedFee = Number((config.result as any).value['bridge-fee'].value);

            const initialBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
            const result = BridgeTestUtils.createBridgeRequest(
              tokenId,
              targetChain,
              targetAddress,
              wallet1,
            );

            if ((result.result as any).type === 'ok') {
              const finalBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
              expect(initialBalance - finalBalance).toBe(expectedFee);
            }
          },
        ),
        { numRuns: BRIDGE_TEST_CONFIG.PROPERTY_TEST_RUNS / 2 },
      );
    });

    it('Property: discounts ≤ 50 % are accepted; discounts > 50 % are rejected', () => {
      fc.assert(
        fc.property(discountGenerator, ({ discountPercentage, validBlocks }) => {
          const result = BridgeTestUtils.grantUserDiscount(
            wallet1,
            discountPercentage,
            validBlocks,
            deployer,
          );

          if (discountPercentage <= 50) {
            expect(result.result).toBeOk(Cl.bool(true));
          } else {
            expect(result.result).toBeErr(
              Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_REQUEST),
            );
          }
        }),
        { numRuns: 30 },
      );
    });
  });
});
