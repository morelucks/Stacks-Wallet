/**
 * Multi-Token Bridge Transaction Tests
 * Validates bridge-tokens, fee calculation, and transaction state management
 * for the multi-token bridge on Stacks Network.
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

describe('Multi-Token Bridge Transaction Tests', () => {
  beforeEach(() => {
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
  });

  // -------------------------------------------------------------------------
  // bridge-tokens function
  // -------------------------------------------------------------------------

  describe('bridge-tokens', () => {
    it('should initiate a bridge transaction with valid parameters', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
      expect(result.result).toBeOk(Cl.buffer(txId));

      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(tx.result).toBeSome();
    });

    it('should reject bridging when the chain is disabled', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, false,
        CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT,
        CFG.DEFAULT_BRIDGE_FEE, 10, 2, deployer,
      );

      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });

    it('should reject an invalid chain ID', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, 999, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });

    it('should reject an amount below the chain minimum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 500, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should reject an amount above the chain maximum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 2_000_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should reject an empty destination address', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, '',
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_PARAMETER));
    });

    it('should emit a bridge-initiated print event', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeOk();
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });
  });

  // -------------------------------------------------------------------------
  // Transaction state management
  // -------------------------------------------------------------------------

  describe('Transaction state management', () => {
    let txId: Uint8Array;

    beforeEach(() => {
      txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM, txId, wallet1,
      );
    });

    it('should store the transaction with correct initial state', () => {
      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(tx.result).toBeSome();

      const d = (tx.result as any).value;
      expect(d['user']).toBePrincipal(wallet1);
      expect(d['token-id']).toBeUint(1);
      expect(d['dest-chain']).toBeUint(CFG.TEST_CHAINS.ETHEREUM);
      expect(d['status']).toBeAscii('pending');
    });

    it('should deduct the bridge fee from the bridged amount', () => {
      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      const d = (tx.result as any).value;
      const expectedFee = Math.floor((10_000 * CFG.DEFAULT_BRIDGE_FEE) / 10_000);
      expect(d['amount']).toBeUint(10_000 - expectedFee);
    });

    it('should initialise validator-signatures as an empty list', () => {
      const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect((tx.result as any).value['validator-signatures']).toBeList([]);
    });
  });

  // -------------------------------------------------------------------------
  // Fee calculation
  // -------------------------------------------------------------------------

  describe('Bridge fee calculation', () => {
    it('should calculate fees correctly for standard amounts', () => {
      const cases = [
        { amount: 1_000, expectedFee: 10 },
        { amount: 10_000, expectedFee: 100 },
        { amount: 50_000, expectedFee: 500 },
      ];

      for (const { amount, expectedFee } of cases) {
        const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
          1, amount, CFG.TEST_CHAINS.ETHEREUM,
        );
        expect(result.result).toBeOk();
        const d = (result.result as any).value;
        expect(d['fee-amount']).toBeUint(expectedFee);
        expect(d['bridge-amount']).toBeUint(amount - expectedFee);
        expect(d['total-cost']).toBeUint(amount);
      }
    });

    it('should return zero fee when fee rate is 0', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.BITCOIN, true,
        CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT, 0, 10, 2, deployer,
      );

      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1, 10_000, CFG.TEST_CHAINS.BITCOIN,
      );
      const d = (result.result as any).value;
      expect(d['fee-amount']).toBeUint(0);
      expect(d['bridge-amount']).toBeUint(10_000);
    });

    it('should calculate 10 % fee correctly at maximum fee rate', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.POLYGON, true,
        CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT, 1_000, 10, 2, deployer,
      );

      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1, 10_000, CFG.TEST_CHAINS.POLYGON,
      );
      const d = (result.result as any).value;
      expect(d['fee-amount']).toBeUint(1_000);
      expect(d['bridge-amount']).toBeUint(9_000);
    });

    it('should return INVALID_CHAIN for an unconfigured chain', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10_000, 999);
      expect(result.result).toBeErr(Cl.uint(CFG.ERRORS.INVALID_CHAIN));
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('Edge cases', () => {
    it('should accept the minimum valid amount', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, CFG.MIN_BRIDGE_AMOUNT, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeOk();
    });

    it('should accept the maximum valid amount', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, CFG.MAX_BRIDGE_AMOUNT, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeOk();
    });

    it('should accept a large token ID', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        999_999, 10_000, CFG.TEST_CHAINS.ETHEREUM, CFG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(), wallet1,
      );
      expect(result.result).toBeOk();
    });

    it('should accept destination addresses for all supported chains', () => {
      const chains = [
        { id: CFG.TEST_CHAINS.ETHEREUM, addr: CFG.TEST_ADDRESSES.ETHEREUM },
        { id: CFG.TEST_CHAINS.BITCOIN, addr: CFG.TEST_ADDRESSES.BITCOIN },
        { id: CFG.TEST_CHAINS.POLYGON, addr: CFG.TEST_ADDRESSES.POLYGON },
        { id: CFG.TEST_CHAINS.BSC, addr: CFG.TEST_ADDRESSES.BSC },
      ];

      for (const { id, addr } of chains) {
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          1, 10_000, id, addr, MultiTokenBridgeTestUtils.generateTxId(), wallet1,
        );
        expect(result.result).toBeOk();
      }
    });
  });
});
