import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;
const wallet4 = accounts.get('wallet_4')!;

describe('Bridge Integration Tests', () => {
  it('should complete full bridge workflow', () => {
    // Setup validators
    const validators = [wallet2, wallet3, wallet4];
    BridgeTestUtils.setupValidators(validators, deployer);

    // Create bridge request
    const createResult = BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    expect(createResult.result).toBeOk(Cl.uint(1));

    // Validate with multiple validators
    const signature = BridgeTestUtils.generateMockSignature();
    for (const validator of validators) {
      const validateResult = simnet.callPublicFn('sip-009-bridge', 'validate-bridge-request', [Cl.uint(1), Cl.buffer(signature)], validator);
      expect(validateResult.result).toBeOk();
    }

    // Complete the request
    const completeResult = BridgeTestUtils.completeBridgeRequest(1, 'tx123', deployer);
    expect(completeResult.result).toBeOk(Cl.bool(true));

    // Verify final state
    const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
    expect(request.result.value['status']).toStrictEqual(Cl.stringAscii('completed'));
  });

  it('should handle multi-chain operations', () => {
    const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
    
    for (let i = 0; i < chains.length; i++) {
      const result = BridgeTestUtils.createBridgeRequest(
        i + 10, 
        chains[i], 
        `0x${(i + 1).toString().repeat(40)}`, 
        wallet1
      );
      expect(result.result).toBeOk();
    }
  });
});