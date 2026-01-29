import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;

describe('Bridge Configuration Tests', () => {
  it('should update chain configurations', () => {
    const result = BridgeTestUtils.updateChainConfig('ethereum', true, 20, 2000000, deployer);
    expect(result.result).toBeOk(Cl.bool(true));

    const config = BridgeTestUtils.getChainConfig('ethereum', deployer);
    expect(config.result.value['bridge-fee']).toBeUint(2000000);
  });

  it('should set validator thresholds', () => {
    const result = simnet.callPublicFn('sip-009-bridge', 'set-min-validator-signatures', [Cl.uint(5)], deployer);
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it('should set bridge timeouts', () => {
    const result = simnet.callPublicFn('sip-009-bridge', 'set-bridge-timeout', [Cl.uint(200)], deployer);
    expect(result.result).toBeOk(Cl.bool(true));
  });
});