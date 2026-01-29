import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('Bridge Lifecycle Tests', () => {
  it('should handle request cancellation', () => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
    const createResult = BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    expect(createResult.result).toBeOk(Cl.uint(1));

    const cancelResult = BridgeTestUtils.cancelBridgeRequest(1, wallet1);
    expect(cancelResult.result).toBeOk(Cl.bool(true));

    expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
  });

  it('should complete bridge requests', () => {
    BridgeTestUtils.setupValidators([wallet2], deployer);
    const createResult = BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    expect(createResult.result).toBeOk(Cl.uint(1));

    // Add signatures to confirm
    const signature = BridgeTestUtils.generateMockSignature();
    for (let i = 0; i < 3; i++) {
      simnet.callPublicFn('sip-009-bridge', 'validate-bridge-request', [Cl.uint(1), Cl.buffer(signature)], wallet2);
    }

    const completeResult = BridgeTestUtils.completeBridgeRequest(1, 'tx123', deployer);
    expect(completeResult.result).toBeOk(Cl.bool(true));
  });
});