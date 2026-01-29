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
const wallet3 = accounts.get('wallet_3')!;

describe('Multi-Token Bridge Validator Management Tests', () => {
  beforeEach(() => {
    simnet.reset();
  });

  describe('add-validator function', () => {
    it('should add validator with valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      
      // Verify validator was added
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      expect(validatorInfo.result).toBeSome();
    });

    it('should reject unauthorized validator addition', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT,
        wallet1 // Not the deployer
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.UNAUTHORIZED));
    });

    it('should reject zero stake amount', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        0, // Zero stake
        deployer
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_PARAMETER));
    });

    it('should emit validator-added event', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event).toBe('print');
    });

    it('should initialize validator with correct default values', () => {
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        5000,
        deployer
      );

      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      const data = validatorInfo.result.value;
      
      expect(data['active']).toBeBool(true);
      expect(data['stake-amount']).toBeUint(5000);
      expect(data['reputation-score']).toBeUint(100); // Perfect initial score
      expect(data['total-validations']).toBeUint(0);
    });
  });

  describe('Validator state tracking', () => {
    beforeEach(() => {
      // Add some validators for testing
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        10000,
        deployer
      );
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2,
        15000,
        deployer
      );
    });

    it('should track multiple validators per chain', () => {
      const validator1Info = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      const validator2Info = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2
      );

      expect(validator1Info.result).toBeSome();
      expect(validator2Info.result).toBeSome();
      
      expect(validator1Info.result.value['stake-amount']).toBeUint(10000);
      expect(validator2Info.result.value['stake-amount']).toBeUint(15000);
    });

    it('should maintain separate validator states per chain', () => {
      // Add same validator to different chains
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet1,
        20000, // Different stake amount
        deployer
      );

      const ethValidator = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      const btcValidator = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet1
      );

      expect(ethValidator.result).toBeSome();
      expect(btcValidator.result).toBeSome();
      
      expect(ethValidator.result.value['stake-amount']).toBeUint(10000);
      expect(btcValidator.result.value['stake-amount']).toBeUint(20000);
    });

    it('should return none for non-existent validators', () => {
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet3 // Not added as validator
      );

      expect(validatorInfo.result).toBeOk(Cl.none());
    });

    it('should allow validator updates by re-adding', () => {
      // Re-add validator with different stake amount
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        25000, // Updated stake amount
        deployer
      );

      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      expect(validatorInfo.result.value['stake-amount']).toBeUint(25000);
    });
  });

  describe('Validator authorization and permissions', () => {
    beforeEach(() => {
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT,
        deployer
      );
    });

    it('should verify validator is active by default', () => {
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      expect(validatorInfo.result.value['active']).toBeBool(true);
    });

    it('should track validator reputation scores', () => {
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      expect(validatorInfo.result.value['reputation-score']).toBeUint(100);
    });

    it('should initialize validation counters', () => {
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      expect(validatorInfo.result.value['total-validations']).toBeUint(0);
    });
  });

  describe('Multi-chain validator management', () => {
    it('should handle validators across all supported chains', () => {
      const chains = Object.values(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS);
      
      chains.forEach((chainId, index) => {
        const stakeAmount = MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT + (index * 1000);
        
        MultiTokenBridgeTestUtils.addValidator(
          chainId,
          wallet1,
          stakeAmount,
          deployer
        );
      });

      // Verify validator exists on all chains with correct stake amounts
      chains.forEach((chainId, index) => {
        const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(chainId, wallet1);
        expect(validatorInfo.result).toBeSome();
        
        const expectedStake = MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT + (index * 1000);
        expect(validatorInfo.result.value['stake-amount']).toBeUint(expectedStake);
      });
    });

    it('should maintain independent validator sets per chain', () => {
      // Add different validators to different chains
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        10000,
        deployer
      );
      
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet2,
        15000,
        deployer
      );

      // Verify validators exist only on their respective chains
      const ethValidator1 = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      const ethValidator2 = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2
      );
      const btcValidator1 = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet1
      );
      const btcValidator2 = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet2
      );

      expect(ethValidator1.result).toBeSome();
      expect(ethValidator2.result).toBeOk(Cl.none());
      expect(btcValidator1.result).toBeOk(Cl.none());
      expect(btcValidator2.result).toBeSome();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle minimum stake amount', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        1, // Minimum possible stake
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });

    it('should handle maximum stake amount', () => {
      const result = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_STAKE_AMOUNT,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      expect(validatorInfo.result.value['stake-amount']).toBeUint(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_STAKE_AMOUNT
      );
    });

    it('should handle adding same validator multiple times', () => {
      // Add validator first time
      const result1 = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        10000,
        deployer
      );
      expect(result1.result).toBeOk(Cl.bool(true));

      // Add same validator again with different stake
      const result2 = MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1,
        20000,
        deployer
      );
      expect(result2.result).toBeOk(Cl.bool(true));

      // Verify latest stake amount is used
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1
      );
      
      expect(validatorInfo.result).toBeSome();
      expect(validatorInfo.result.value['stake-amount']).toBeUint(20000);
    });

    it('should handle validator addition to non-standard chain IDs', () => {
      const customChainId = 999;
      
      const result = MultiTokenBridgeTestUtils.addValidator(
        customChainId,
        wallet1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT,
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));
      
      const validatorInfo = MultiTokenBridgeTestUtils.getValidatorInfo(customChainId, wallet1);
      expect(validatorInfo.result).toBeSome();
    });
  });
});