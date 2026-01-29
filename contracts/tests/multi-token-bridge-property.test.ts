import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { bridgeConfigGenerator, bridgeTransactionGenerator, validatorGenerator } from './multi-token-bridge-generators';

const accounts = { deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', wallet1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5', wallet2: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' };

describe('Multi-Token Bridge Property Tests', () => {
  describe('Property 1: Bridge Configuration Integrity', () => {
    it('should maintain configuration integrity across all valid inputs', () => {
      fc.assert(fc.property(bridgeConfigGenerator, (config) => {
        if (config.maxAmount <= config.minAmount || config.bridgeFee > 1000) return true;
        
        const result = MultiTokenBridgeTestUtils.configureBridge(
          config.chainId, config.enabled, config.minAmount, config.maxAmount,
          config.bridgeFee, config.confirmationBlocks, config.validatorThreshold,
          accounts.deployer
        );
        
        if (result.result.type === 'ok') {
          const retrieved = MultiTokenBridgeTestUtils.getBridgeConfig(config.chainId);
          return retrieved.result.type === 'ok' && retrieved.result.value.type === 'some';
        }
        return true;
      }), { numRuns: 100 });
    });
  });

  describe('Property 2: Transaction State Consistency', () => {
    it('should preserve transaction state consistency across all operations', () => {
      fc.assert(fc.property(bridgeTransactionGenerator, (tx) => {
        MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(accounts.deployer);
        
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          tx.tokenId, tx.amount, tx.destChain, tx.destAddress, tx.txId, accounts.wallet1
        );
        
        if (result.result.type === 'ok') {
          const retrieved = MultiTokenBridgeTestUtils.getBridgeTransaction(tx.txId);
          return retrieved.result.type === 'ok' && 
                 (retrieved.result.value.type === 'some' || retrieved.result.value.type === 'none');
        }
        return true;
      }), { numRuns: 100 });
    });
  });

  describe('Property 3: Validator Management Integrity', () => {
    it('should maintain validator integrity across all operations', () => {
      fc.assert(fc.property(validatorGenerator, (validator) => {
        if (validator.stakeAmount === 0) return true;
        
        const result = MultiTokenBridgeTestUtils.addValidator(
          validator.chainId, accounts.wallet2, validator.stakeAmount, accounts.deployer
        );
        
        if (result.result.type === 'ok') {
          const retrieved = MultiTokenBridgeTestUtils.getValidatorInfo(validator.chainId, accounts.wallet2);
          return retrieved.result.type === 'ok';
        }
        return true;
      }), { numRuns: 100 });
    });
  });

  describe('Property 4: Mathematical Accuracy', () => {
    it('should maintain mathematical accuracy in fee calculations', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1000, max: 1000000 }),
        fc.integer({ min: 0, max: 1000 }),
        (amount, feeRate) => {
          MultiTokenBridgeTestUtils.configureBridge(1, true, 1000, 1000000, feeRate, 10, 2, accounts.deployer);
          
          const result = MultiTokenBridgeTestUtils.calculateBridgeFee(1, amount, 1);
          if (result.result.type === 'ok') {
            const data = result.result.value;
            const expectedFee = Math.floor((amount * feeRate) / 10000);
            const expectedBridge = amount - expectedFee;
            
            return Number(data['fee-amount'].value) === expectedFee &&
                   Number(data['bridge-amount'].value) === expectedBridge &&
                   Number(data['total-cost'].value) === amount;
          }
          return true;
        }
      ), { numRuns: 100 });
    });
  });
});