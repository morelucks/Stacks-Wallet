import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('Bridge Emergency Tests', () => {
  it('should perform emergency pause', () => {
    const result = simnet.callPublicFn('sip-009-bridge', 'emergency-pause', [], deployer);
    expect(result.result).toBeOk(Cl.bool(true));
    
    BridgeTestUtils.setBridgeEnabled(true, deployer); // Reset for other tests
  });

  it('should emergency unlock tokens', () => {
    BridgeTestUtils.createBridgeRequest(1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1);
    
    const unlockResult = BridgeTestUtils.emergencyUnlockToken(1, deployer);
    expect(unlockResult.result).toBeOk(Cl.bool(true));
    
    expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
  });
});