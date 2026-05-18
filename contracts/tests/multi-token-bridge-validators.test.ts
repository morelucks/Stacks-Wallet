/**
 * Multi-Token Bridge Validator Management Tests
 * Validates add-validator, validator state tracking, and multi-chain
 * validator management for the multi-token bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG as CFG } from './multi-token-bridge-test-config';

// ---------------------------------------------------------------------------
// Test account setup
// ---------------------------------------------------------------------------
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Validator Management Tests', () => {
  // -------------------------------------------------------------------------
  // add-validator function
  // -------------------------------------------------------------------------

  describe('add-validator', () => {
    it('should add a validator with valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, CFG.MIN_STAKE_AMOUNT, deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      expect(info.result).toBeSome();
    });

    it('should reject add-validator from a non-owner', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet2, CFG.MIN_STAKE_AMOUNT, wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.UNAUTHORIZED));
    });

    it('should reject a zero stake amount', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 0, deployer,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should emit a validator-added print event', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, CFG.MIN_STAKE_AMOUNT, deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });

    it('should initialise validator with correct default values', () => {
      MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 5_000, deployer,
      );

      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      expect(info.result).toBeSome();

      const d = (info.result as any).value;
      expect(d['active']).toBeBool(true);
      expect(d['stake-amount']).toBeUint(5_000);
      expect(d['reputation-score']).toBeUint(100);
      expect(d['total-validations']).toBeUint(0);
    });
  });

  // -------------------------------------------------------------------------
  // Validator state tracking
  // -------------------------------------------------------------------------

  describe('Validator state tracking', () => {
    beforeEach(() => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet1, 10_000, deployer);
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet2, 15_000, deployer);
    });

    it('should track multiple validators on the same chain', () => {
      const v1 = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      const v2 = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);

      expect(v1.result).toBeSome();
      expect(v2.result).toBeSome();
      expect((v1.result as any).value['stake-amount']).toBeUint(10_000);
      expect((v2.result as any).value['stake-amount']).toBeUint(15_000);
    });

    it('should maintain separate validator states per chain', () => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.BITCOIN, wallet1, 20_000, deployer);

      const eth = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      const btc = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.BITCOIN, wallet1);

      expect((eth.result as any).value['stake-amount']).toBeUint(10_000);
      expect((btc.result as any).value['stake-amount']).toBeUint(20_000);
    });

    it('should return none for a non-registered validator', () => {
      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet3);
      expect(info.result).toBeOk(Cl.none());
    });

    it('should update stake amount when re-adding an existing validator', () => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet1, 25_000, deployer);

      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      expect((info.result as any).value['stake-amount']).toBeUint(25_000);
    });
  });

  // -------------------------------------------------------------------------
  // Multi-chain validator management
  // -------------------------------------------------------------------------

  describe('Multi-chain validator management', () => {
    it('should register a validator on all supported chains', () => {
      const chains = Object.values(CFG.TEST_CHAINS);

      chains.forEach((chainId, i) => {
        MultiTokenBridgeTestUtils.addValidator(
          chainId, wallet1, CFG.MIN_STAKE_AMOUNT + i * 1_000, deployer,
        );
      });

      chains.forEach((chainId, i) => {
        const info = MultiTokenBridgeTestUtils.getValidatorInfo(chainId, wallet1);
        expect(info.result).toBeSome();
        expect((info.result as any).value['stake-amount']).toBeUint(
          CFG.MIN_STAKE_AMOUNT + i * 1_000,
        );
      });
    });

    it('should maintain independent validator sets per chain', () => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet1, 10_000, deployer);
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.BITCOIN, wallet2, 15_000, deployer);

      // wallet1 only on Ethereum
      expect(MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1).result).toBeSome();
      expect(MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2).result).toBeOk(Cl.none());

      // wallet2 only on Bitcoin
      expect(MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.BITCOIN, wallet1).result).toBeOk(Cl.none());
      expect(MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.BITCOIN, wallet2).result).toBeSome();
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('Edge cases', () => {
    it('should accept the minimum stake amount of 1', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, 1, deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should accept the maximum stake amount', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        CFG.TEST_CHAINS.ETHEREUM, wallet1, CFG.MAX_STAKE_AMOUNT, deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
      const info = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      expect((info.result as any).value['stake-amount']).toBeUint(CFG.MAX_STAKE_AMOUNT);
    });

    it('should allow adding a validator to a non-standard chain ID', () => {
      const customChainId = 999;
      const result = MultiTokenBridgeTestUtils.addValidator(
        customChainId, wallet1, CFG.MIN_STAKE_AMOUNT, deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const info = MultiTokenBridgeTestUtils.getValidatorInfo(customChainId, wallet1);
      expect(info.result).toBeSome();
    });
  });
});
