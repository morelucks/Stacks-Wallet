import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('Bridge Timeout Tests', () => {
  it('should handle request timeouts', () => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
    
    const createResult = BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    expect(createResult.result).toBeOk(Cl.uint(1));

    // Advance blocks to simulate timeout
    BridgeTestUtils.advanceBlocks(200);

    // Try to validate expired request
    const signature = BridgeTestUtils.generateMockSignature();
    const validateResult = simnet.callPublicFn('sip-009-bridge', 'validate-bridge-request', [Cl.uint(1), Cl.buffer(signature)], wallet2);
    expect(validateResult.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.REQUEST_EXPIRED));
  });

  it('should allow cancellation of expired requests', () => {
    const createResult = BridgeTestUtils.createBridgeRequest(2, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    expect(createResult.result).toBeOk(Cl.uint(2));

    BridgeTestUtils.advanceBlocks(200);

    const cancelResult = BridgeTestUtils.cancelBridgeRequest(2, wallet1);
    expect(cancelResult.result).toBeOk(Cl.bool(true));
  });
});