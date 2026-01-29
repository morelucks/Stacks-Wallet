import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import fc from 'fast-check';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;

describe('Bridge Validator Tests', () => {
  describe('Validator Management', () => {
    it('should add and remove validators', () => {
      const result = simnet.callPublicFn('sip-009-bridge', 'add-validator', [Cl.principal(wallet2)], deployer);
      expect(result.result).toBeOk(Cl.bool(true));

      const removeResult = simnet.callPublicFn('sip-009-bridge', 'remove-validator', [Cl.principal(wallet2)], deployer);
      expect(removeResult.result).toBeOk(Cl.bool(true));
    });

    it('should track validator reputation', () => {
      simnet.callPublicFn('sip-009-bridge', 'add-validator', [Cl.principal(wallet2)], deployer);
      
      const info = BridgeTestUtils.getValidatorInfo(wallet2, deployer);
      expect(info.result).toBeSome();
      expect(info.result.value['reputation-score']).toBeUint(100);
    });
  });

  describe('Signature Validation', () => {
    it('should validate signatures correctly', () => {
      BridgeTestUtils.setupValidators([wallet2, wallet3], deployer);
      
      const createResult = BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
      expect(createResult.result).toBeOk(Cl.uint(1));

      const signature = BridgeTestUtils.generateMockSignature();
      const validateResult = simnet.callPublicFn('sip-009-bridge', 'validate-bridge-request', [Cl.uint(1), Cl.buffer(signature)], wallet2);
      expect(validateResult.result).toBeOk();
    });
  });
});