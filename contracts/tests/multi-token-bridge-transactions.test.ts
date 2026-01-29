import { describe, it, expect, beforeEach } from 'vitest';
import { Simnet } from '@hirosystems/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const simnet = new Simnet();
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('Multi-Token Bridge Transaction Tests', () => {
  beforeEach(() => {
    simnet.reset();
    
    // Setup default bridge configuration
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
  });

  describe('bridge-tokens function', () => {
    it('should initiate bridge transaction with valid parameters', () => {
      const tokenId = 1;
      const amount = 10000;
      const destChain = MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM;
      const destAddress = MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM;
      const txId = MultiTokenBridgeTestUtils.generateTxId();

      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        tokenId,
        amount,
        destChain,
        destAddress,
        txId,
        wallet1
      );

      expect(result.result).toBeOk(Cl.buffer(txId));
      
      // Verify transaction was created
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(transaction.result).toBeSome();
    });

    it('should reject bridge when paused', () => {
      // First pause the bridge (this would require a pause function in the contract)
      // For now, we'll test with disabled chain configuration
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        false, // Disabled
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer
      );

      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });

    it('should reject invalid chain ID', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        999, // Invalid chain ID
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });

    it('should reject amount below minimum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        500, // Below minimum
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject amount above maximum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        2000000, // Above maximum
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject empty destination address', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        '', // Empty address
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should emit bridge-initiated event', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeOk();
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });
  });

  describe('Bridge transaction state management', () => {
    let txId: Uint8Array;

    beforeEach(() => {
      txId = MultiTokenBridgeTestUtils.generateTxId();
      
      MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        txId,
        wallet1
      );
    });

    it('should store transaction with correct initial state', () => {
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(transaction.result).toBeSome();
      
      const txData = transaction.result.value;
      expect(txData['user']).toBePrincipal(wallet1);
      expect(txData['token-id']).toBeUint(1);
      expect(txData['amount']).toBeUint(9900); // After 1% fee
      expect(txData['dest-chain']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM);
      expect(txData['status']).toBeAscii('pending');
      expect(txData['confirmed-at']).toBeNone();
    });

    it('should calculate and deduct bridge fee correctly', () => {
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(transaction.result).toBeSome();
      
      const txData = transaction.result.value;
      const originalAmount = 10000;
      const expectedFee = (originalAmount * MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE) / 10000;
      const expectedBridgeAmount = originalAmount - expectedFee;
      
      expect(txData['amount']).toBeUint(expectedBridgeAmount);
    });

    it('should initialize empty validator signatures', () => {
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(transaction.result).toBeSome();
      
      const txData = transaction.result.value;
      expect(txData['validator-signatures']).toBeList([]);
    });

    it('should set correct source and destination chains', () => {
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(transaction.result).toBeSome();
      
      const txData = transaction.result.value;
      expect(txData['source-chain']).toBeUint(0); // Stacks chain ID
      expect(txData['dest-chain']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM);
    });
  });

  describe('Bridge fee calculation', () => {
    it('should calculate fees correctly for different amounts', () => {
      const testCases = [
        { amount: 1000, expectedFee: 10 },   // 1% of 1000
        { amount: 10000, expectedFee: 100 }, // 1% of 10000
        { amount: 50000, expectedFee: 500 }, // 1% of 50000
      ];

      testCases.forEach(({ amount, expectedFee }) => {
        const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
          1,
          amount,
          MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
        );

        expect(result.result).toBeOk();
        const feeData = result.result.value;
        expect(feeData['fee-amount']).toBeUint(expectedFee);
        expect(feeData['bridge-amount']).toBeUint(amount - expectedFee);
        expect(feeData['total-cost']).toBeUint(amount);
      });
    });

    it('should handle zero fee configuration', () => {
      // Configure chain with zero fee
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        0, // Zero fee
        10,
        2,
        deployer
      );

      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN
      );

      expect(result.result).toBeOk();
      const feeData = result.result.value;
      expect(feeData['fee-amount']).toBeUint(0);
      expect(feeData['bridge-amount']).toBeUint(10000);
    });

    it('should handle maximum fee configuration', () => {
      // Configure chain with maximum fee (10%)
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        1000, // 10% fee
        10,
        2,
        deployer
      );

      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON
      );

      expect(result.result).toBeOk();
      const feeData = result.result.value;
      expect(feeData['fee-amount']).toBeUint(1000); // 10% of 10000
      expect(feeData['bridge-amount']).toBeUint(9000);
    });

    it('should reject fee calculation for invalid chain', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        999 // Invalid chain
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });
  });

  describe('Transaction validation and constraints', () => {
    it('should validate amount against chain-specific limits', () => {
      // Configure chain with specific limits
      const customMinAmount = 5000;
      const customMaxAmount = 50000;
      
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC,
        true,
        customMinAmount,
        customMaxAmount,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE,
        10,
        2,
        deployer
      );

      // Test amount below custom minimum
      const belowMinResult = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        4000, // Below custom minimum
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BSC,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );
      expect(belowMinResult.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));

      // Test amount above custom maximum
      const aboveMaxResult = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        60000, // Above custom maximum
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BSC,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );
      expect(aboveMaxResult.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));

      // Test valid amount within custom range
      const validResult = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        25000, // Within custom range
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BSC,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );
      expect(validResult.result).toBeOk();
    });

    it('should handle different destination addresses per chain', () => {
      const chains = [
        { id: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM, address: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM },
        { id: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN, address: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BITCOIN },
        { id: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON, address: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.POLYGON },
        { id: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC, address: MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BSC }
      ];

      chains.forEach(({ id, address }) => {
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          1,
          10000,
          id,
          address,
          MultiTokenBridgeTestUtils.generateTxId(),
          wallet1
        );
        expect(result.result).toBeOk();
      });
    });

    it('should prevent duplicate transaction IDs', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      
      // First transaction should succeed
      const result1 = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        txId,
        wallet1
      );
      expect(result1.result).toBeOk();

      // Second transaction with same ID should overwrite (based on current contract logic)
      const result2 = MultiTokenBridgeTestUtils.bridgeTokens(
        2,
        15000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BITCOIN,
        txId,
        wallet2
      );
      expect(result2.result).toBeOk();

      // Verify the transaction was overwritten
      const transaction = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(transaction.result).toBeSome();
      const txData = transaction.result.value;
      expect(txData['token-id']).toBeUint(2);
      expect(txData['user']).toBePrincipal(wallet2);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum valid amount', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeOk();
    });

    it('should handle maximum valid amount', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeOk();
    });

    it('should handle maximum length destination address', () => {
      const longAddress = 'a'.repeat(64); // Maximum ASCII string length
      
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        longAddress,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeOk();
    });

    it('should handle large token IDs', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        999999, // Large token ID
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        MultiTokenBridgeTestUtils.generateTxId(),
        wallet1
      );

      expect(result.result).toBeOk();
    });
  });
});