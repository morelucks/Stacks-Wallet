import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('Bridge Statistics Tests', () => {
  it('should track bridge statistics', () => {
    const stats = BridgeTestUtils.getBridgeStats('ethereum', deployer);
    expect(stats.result).toBeSome();
  });

  it('should get bridge status', () => {
    const status = BridgeTestUtils.getBridgeStatus(deployer);
    expect(status.result).toBeTuple();
    expect(status.result['enabled']).toBeBool(true);
  });

  it('should get bridge analytics', () => {
    const analytics = simnet.callReadOnlyFn('sip-009-bridge', 'get-bridge-analytics', [], deployer);
    expect(analytics.result).toBeTuple();
  });
});