/**
 * Multi-Token Bridge Query Function Tests
 * Validates all read-only query functions for the multi-token bridge on
 * Stacks Network: get-bridge-config, get-bridge-transaction,
 * get-validator-info, get-bridge-stats, calculate-bridge-fee,
 * and get-bridge-overview.
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Token Bridge Query Function Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  // -------------------------------------------------------------------------
  // get-bridge-config
  // -------------------------------------------------------------------------

  describe('get-bridge-config', () => {
    it('should return the configuration for a configured chain', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      expect(result.result).toBeOk();
      expect(result.result).toBeSome();

      const d = (result.result as any).value?.value;
      expect(d['enabled']).toBeBool(true);
      expect(d['min-bridge-amount']).toBeUint(CFG.MIN_BRIDGE_AMOUNT);
      expect(d['max-bridge-amount']).toBeUint(CFG.MAX_BRIDGE_AMOUNT);
      expect(d['bridge-fee']).toBeUint(CFG.DEFAULT_BRIDGE_FEE);
    });

    it('should return none for an unconfigured chain', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeConfig(999);
      expect(result.result).toBeOk();
      expect((result.result as any).value).toBeNone();
    });

    it('should reflect updated configuration after a change', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.POLYGON, false, 2_000, CFG.MAX_BRIDGE_AMOUNT, 200, 15, 3, deployer,
      );

      const result = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.POLYGON);
      const d = (result.result as any).value?.value;
      expect(d['enabled']).toBeBool(false);
      expect(d['min-bridge-amount']).toBeUint(2_000);
      expect(d['bridge-fee']).toBeUint(200);
    });

    it('should return configurations for all four supported chains', () => {
      for (const chainId of Object.values(CFG.TEST_CHAINS)) {
        const result = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
        expect(result.result).toBeOk();
        expect(result.result).toBeSome();
      }
    });
  });

  // -------------------------------------------------------------------------
  // get-bridge-transaction
  // -------------------------------------------------------------------------

  describe('get-bridge-transaction', () => {
    let txId: Uint8Array;

    beforeEach(() => {
      txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
    });

    it('should return complete transaction data', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(result.result).toBeSome();

      const d = (result.result as any).value?.value;
      expect(d['user']).toBePrincipal(wallet1);
      expect(d['token-id']).toBeUint(1);
      expect(d['dest-chain']).toBeUint(CFG.TEST_CHAINS.ETHEREUM);
      expect(d['status']).toBeAscii('pending');
      expect(d['validator-signatures']).toBeList([]);
    });

    it('should return none for a non-existent transaction', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId(),
      );
      expect((result.result as any).value).toBeNone();
    });

    it('should reflect added signatures after validation', () => {
      const sig = MultiTokenBridgeTestUtils.generateSignature();
      MultiTokenBridgeTestUtils.validateBridgeTransaction(txId, sig, true, wallet2);

      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((result.result as any).value?.value?.['validator-signatures']).toBeList([
        Cl.buffer(sig),
      ]);
    });

    it('should show failed status after a validator rejection', () => {
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2,
      );

      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((result.result as any).value?.value?.['status']).toBeAscii('failed');
    });
  });

  // -------------------------------------------------------------------------
  // get-validator-info
  // -------------------------------------------------------------------------

  describe('get-validator-info', () => {
    it('should return complete validator information', () => {
      const result = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      expect(result.result).toBeSome();

      const d = (result.result as any).value?.value;
      expect(d['active']).toBeBool(true);
      expect(d['stake-amount']).toBeUint(CFG.MIN_STAKE_AMOUNT);
      expect(d['reputation-score']).toBeUint(100);
      expect(d['total-validations']).toBeUint(0);
    });

    it('should return none for a non-registered validator', () => {
      const result = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      expect((result.result as any).value).toBeNone();
    });

    it('should reflect updated total-validations after activity', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2,
      );

      const result = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      expect((result.result as any).value?.value?.['total-validations']).toBeUint(1);
    });

    it('should return separate info per chain for the same validator', () => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.BITCOIN, wallet2, 20_000, deployer);

      const eth = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet2);
      const btc = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.BITCOIN, wallet2);

      expect((eth.result as any).value?.value?.['stake-amount']).toBeUint(CFG.MIN_STAKE_AMOUNT);
      expect((btc.result as any).value?.value?.['stake-amount']).toBeUint(20_000);
    });
  });

  // -------------------------------------------------------------------------
  // get-bridge-stats
  // -------------------------------------------------------------------------

  describe('get-bridge-stats', () => {
    beforeEach(() => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
    });

    it('should return statistics for an active chain', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeStats(CFG.TEST_CHAINS.ETHEREUM);
      expect(result.result).toBeSome();

      const d = (result.result as any).value?.value;
      expect(d['total-transactions']).toBeUint(1);
    });

    it('should return none for a chain with no activity', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeStats(999);
      expect((result.result as any).value).toBeNone();
    });

    it('should accumulate statistics across multiple transactions', () => {
      for (let i = 0; i < 3; i++) {
        MultiTokenBridgeTestUtils.bridgeTokens(
          i + 2, 5_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
          MultiTokenBridgeTestUtils.generateTxId(), wallet1,
        );
      }

      const result = MultiTokenBridgeTestUtils.getBridgeStats(CFG.TEST_CHAINS.ETHEREUM);
      expect((result.result as any).value?.value?.['total-transactions']).toBeUint(4);
    });
  });

  // -------------------------------------------------------------------------
  // calculate-bridge-fee
  // -------------------------------------------------------------------------

  describe('calculate-bridge-fee', () => {
    it('should calculate the correct fee for a standard amount', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM,
      );
      expect(result.result).toBeOk();

      const d = (result.result as any).value;
      expect(d['fee-amount']).toBeUint(100);
      expect(d['bridge-amount']).toBeUint(9_900);
      expect(d['total-cost']).toBeUint(10_000);
    });

    it('should return INVALID_CHAIN for an unconfigured chain', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, 999);
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });

    it('should calculate different fees for different chain configurations', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.BITCOIN, true,
        CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT, 500, 10, 2, deployer,
      );

      const eth = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, CFG.TEST_CHAINS.ETHEREUM);
      const btc = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, CFG.TEST_CHAINS.BITCOIN);

      expect((eth.result as any).value['fee-amount']).toBeUint(100);
      expect((btc.result as any).value['fee-amount']).toBeUint(500);
    });

    it('should handle zero fee correctly', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.POLYGON, true,
        CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT, 0, 10, 2, deployer,
      );

      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, CFG.TEST_CHAINS.POLYGON);
      const d = (result.result as any).value;
      expect(d['fee-amount']).toBeUint(0);
      expect(d['bridge-amount']).toBeUint(10_000);
    });

    it('should handle the maximum bridge amount without overflow', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1, CFG.MAX_BRIDGE_AMOUNT, CFG.TEST_CHAINS.ETHEREUM,
      );
      expect(result.result).toBeOk();
      const expectedFee = Math.floor((CFG.MAX_BRIDGE_AMOUNT * CFG.DEFAULT_BRIDGE_FEE) / 10_000);
      expect((result.result as any).value['fee-amount']).toBeUint(expectedFee);
    });
  });

  // -------------------------------------------------------------------------
  // get-bridge-overview
  // -------------------------------------------------------------------------

  describe('get-bridge-overview', () => {
    it('should return a valid overview tuple', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(result.result).toBeOk();
      expect(typeof (result.result as any).value).toBe('object');
    });

    it('should reflect the current bridge-paused state', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect((result.result as any).value?.['bridge-paused']).toBeBool(false);
    });

    it('should list all four supported chains', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect((result.result as any).value?.['supported-chains']).toHaveLength(4);
    });
  });

  // -------------------------------------------------------------------------
  // Query error handling
  // -------------------------------------------------------------------------

  describe('Query error handling', () => {
    it('should return ok (not throw) for all queries with edge-case parameters', () => {
      expect(MultiTokenBridgeTestUtils.getBridgeConfig(0).result).toBeOk();
      expect(MultiTokenBridgeTestUtils.getValidatorInfo(0, deployer).result).toBeOk();
      expect(MultiTokenBridgeTestUtils.getBridgeStats(0).result).toBeOk();
    });
  });
});
