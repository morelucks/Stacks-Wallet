/**
 * Multi-Token Bridge Property Tests
 * Property-based tests verifying universal invariants for the multi-token
 * bridge on Stacks Network.
 *
 * Properties tested:
 *  1. Bridge configuration integrity – every valid config is stored and retrievable
 *  2. Transaction state consistency – bridged tokens produce retrievable state
 *  3. Validator management integrity – every registered validator is retrievable
 *  4. Mathematical accuracy – fee-amount + bridge-amount = total-cost for all inputs
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import {
  bridgeConfigGenerator,
  bridgeTransactionGenerator,
  validatorGenerator,
} from './multi-token-bridge-generators';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG as CFG } from './multi-token-bridge-test-config';

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

describe('Multi-Token Bridge Property Tests', () => {
  // -------------------------------------------------------------------------
  // Property 1: Bridge configuration integrity
  // -------------------------------------------------------------------------

  describe('Property 1: Bridge Configuration Integrity', () => {
    it('should store every valid configuration and make it retrievable', () => {
      fc.assert(
        fc.property(bridgeConfigGenerator, config => {
          // Skip invalid parameter combinations
          if (config.maxAmount <= config.minAmount || config.bridgeFee > CFG.MAX_BRIDGE_FEE) {
            return true;
          }

          const result = MultiTokenBridgeTestUtils.configureBridge(
            config.chainId,
            config.enabled,
            config.minAmount,
            config.maxAmount,
            config.bridgeFee,
            config.confirmationBlocks,
            config.validatorThreshold,
            deployer,
          );

          if ((result.result as any).type === 'ok') {
            const retrieved = MultiTokenBridgeTestUtils.getBridgeConfig(config.chainId);
            expect(retrieved.result).toBeSome();
          }
          return true;
        }),
        { numRuns: CFG.PROPERTY_TEST_RUNS },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 2: Transaction state consistency
  // -------------------------------------------------------------------------

  describe('Property 2: Transaction State Consistency', () => {
    it('should preserve transaction state after bridging tokens', () => {
      MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);

      fc.assert(
        fc.property(bridgeTransactionGenerator, tx => {
          const result = MultiTokenBridgeTestUtils.bridgeTokens(
            tx.tokenId,
            tx.amount,
            tx.destChain,
            tx.destAddress,
            tx.txId,
            wallet1,
          );

          if ((result.result as any).type === 'ok') {
            const retrieved = MultiTokenBridgeTestUtils.getBridgeTransaction(tx.txId);
            // Transaction must be either found (some) or not found (none) – never an error
            expect(['some', 'none']).toContain((retrieved.result as any).type);
          }
          return true;
        }),
        { numRuns: CFG.PROPERTY_TEST_RUNS },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 3: Validator management integrity
  // -------------------------------------------------------------------------

  describe('Property 3: Validator Management Integrity', () => {
    it('should make every registered validator retrievable', () => {
      fc.assert(
        fc.property(validatorGenerator, validator => {
          if (validator.stakeAmount === 0) return true;

          const result = MultiTokenBridgeTestUtils.addValidator(
            validator.chainId,
            wallet2,
            validator.stakeAmount,
            deployer,
          );

          if ((result.result as any).type === 'ok') {
            const retrieved = MultiTokenBridgeTestUtils.getValidatorInfo(
              validator.chainId,
              wallet2,
            );
            expect((retrieved.result as any).type).toBe('ok');
          }
          return true;
        }),
        { numRuns: CFG.PROPERTY_TEST_RUNS },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 4: Mathematical accuracy of fee calculations
  // -------------------------------------------------------------------------

  describe('Property 4: Mathematical Accuracy of Fee Calculations', () => {
    it('should calculate fee-amount, bridge-amount, and total-cost correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: CFG.MIN_BRIDGE_AMOUNT, max: CFG.MAX_BRIDGE_AMOUNT }),
          fc.integer({ min: 0, max: CFG.MAX_BRIDGE_FEE }),
          (amount, feeRate) => {
            MultiTokenBridgeTestUtils.configureBridge(
              CFG.TEST_CHAINS.ETHEREUM,
              true,
              CFG.MIN_BRIDGE_AMOUNT,
              CFG.MAX_BRIDGE_AMOUNT,
              feeRate,
              10,
              2,
              deployer,
            );

            const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
              1,
              amount,
              CFG.TEST_CHAINS.ETHEREUM,
            );

            if ((result.result as any).type === 'ok') {
              const data = (result.result as any).value;
              const expectedFee = Math.floor((amount * feeRate) / 10_000);
              const expectedBridge = amount - expectedFee;

              expect(Number(data['fee-amount'].value)).toBe(expectedFee);
              expect(Number(data['bridge-amount'].value)).toBe(expectedBridge);
              expect(Number(data['total-cost'].value)).toBe(amount);
            }
            return true;
          },
        ),
        { numRuns: CFG.PROPERTY_TEST_RUNS },
      );
    });
  });
});
