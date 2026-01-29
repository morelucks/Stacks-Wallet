import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('Bridge Error Handling Tests', () => {
  it('should handle invalid chain errors', () => {
    const result = BridgeTestUtils.createBridgeRequest(1, 'invalid-chain', '0x1234567890123456789012345678901234567890', wallet1);
    expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.INVALID_CHAIN));
  });

  it('should handle unauthorized access', () => {
    const result = simnet.callPublicFn('sip-009-bridge', 'add-validator', [Cl.principal(wallet1)], wallet1);
    expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.NOT_AUTHORIZED));
  });

  it('should handle bridge disabled state', () => {
    BridgeTestUtils.setBridgeEnabled(false, deployer);
    const result = BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.BRIDGE_DISABLED));
    BridgeTestUtils.setBridgeEnabled(true, deployer);
  });
});