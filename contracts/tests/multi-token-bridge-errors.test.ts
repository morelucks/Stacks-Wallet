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

describe('Multi-Token Bridge Error Handling Tests', () => {
  beforeEach(() => {
    simnet.reset();
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  describe('Authorization errors', () => {
    it('should reject unauthorized bridge configuration', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        true, 1000, 100000, 100, 10, 2,
        wallet1 // Not deployer
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.UNAUTHORIZED));
    });

    it('should reject unauthorized validator addition', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1, 5000, wallet1 // Not deployer
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.UNAUTHORIZED));
    });

    it('should reject validation from non-validator', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, wallet1);
      
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet1
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.UNAUTHORIZED));
    });
  });

  describe('Invalid parameter errors', () => {
    it('should reject invalid bridge configuration parameters', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        1, true, 1000, 500, 100, 10, 2, deployer // max < min
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject excessive bridge fees', () => {
      const result = MultiTokenBridgeTestUtils.configureBridge(
        1, true, 1000, 100000, 1500, 10, 2, deployer // 15% fee
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject zero stake amount for validators', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(1, wallet1, 0, deployer);
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject bridge amounts below minimum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 500, 1, 'addr', MultiTokenBridgeTestUtils.generateTxId(), wallet1
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject bridge amounts above maximum', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 2000000, 1, 'addr', MultiTokenBridgeTestUtils.generateTxId(), wallet1
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject empty destination address', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10000, 1, '', MultiTokenBridgeTestUtils.generateTxId(), wallet1
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });
  });

  describe('Invalid chain errors', () => {
    it('should reject bridge to unconfigured chain', () => {
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10000, 999, 'addr', MultiTokenBridgeTestUtils.generateTxId(), wallet1
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });

    it('should reject bridge to disabled chain', () => {
      MultiTokenBridgeTestUtils.configureBridge(2, false, 1000, 100000, 100, 10, 2, deployer);
      const result = MultiTokenBridgeTestUtils.bridgeTokens(
        1, 10000, 2, 'addr', MultiTokenBridgeTestUtils.generateTxId(), wallet1
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });

    it('should reject fee calculation for invalid chain', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, 10000, 999);
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });
  });

  describe('Not found errors', () => {
    it('should reject validation of non-existent transaction', () => {
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId(),
        MultiTokenBridgeTestUtils.generateSignature(),
        true, wallet2
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.NOT_FOUND));
    });

    it('should reject completion of non-existent transaction', () => {
      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId(), deployer
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.NOT_FOUND));
    });
  });

  describe('State validation errors', () => {
    it('should reject validation of failed transaction', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, wallet1);
      
      // First validator rejects
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), false, wallet2
      );
      
      // Second validator tries to validate failed transaction
      const result = MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId, MultiTokenBridgeTestUtils.generateSignature(), true, wallet2
      );
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should reject completion of non-confirmed transaction', () => {
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(1, 10000, 1, 'addr', txId, wallet1);
      
      const result = MultiTokenBridgeTestUtils.completeBridgeTransaction(txId, deployer);
      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });
  });

  describe('Error code consistency', () => {
    it('should return consistent error codes across functions', () => {
      // Test that same error conditions return same error codes
      const unauthorizedResults = [
        MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 100000, 100, 10, 2, wallet1),
        MultiTokenBridgeTestUtils.addValidator(1, wallet1, 5000, wallet1)
      ];
      
      unauthorizedResults.forEach(result => {
        expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.UNAUTHORIZED));
      });
    });

    it('should maintain error state without corruption', () => {
      // Trigger multiple errors and verify system remains stable
      MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 500, 100, 10, 2, deployer); // Invalid
      MultiTokenBridgeTestUtils.addValidator(1, wallet1, 0, deployer); // Invalid
      MultiTokenBridgeTestUtils.bridgeTokens(1, 0, 999, '', MultiTokenBridgeTestUtils.generateTxId(), wallet1); // Multiple errors
      
      // System should still work normally
      const validResult = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(validResult.result).toBeOk();
    });
  });
});