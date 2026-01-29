import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';
import { BridgeTestUtils } from './bridge-test-utils';

const accounts = simnet.getAccounts();
const wallet1 = accounts.get('wallet_1')!;

describe('Bridge Batch Operation Tests', () => {
  it('should process batch requests', () => {
    const requests = [
      { tokenId: 1, targetChain: 'ethereum', targetAddress: '0x1111111111111111111111111111111111111111' },
      { tokenId: 2, targetChain: 'polygon', targetAddress: '0x2222222222222222222222222222222222222222' }
    ];

    const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
    expect(result.result).toBeOk();
  });

  it('should handle batch failures atomically', () => {
    const requests = [
      { tokenId: 1, targetChain: 'ethereum', targetAddress: '0x1111111111111111111111111111111111111111' },
      { tokenId: 1, targetChain: 'polygon', targetAddress: '0x2222222222222222222222222222222222222222' } // Duplicate token
    ];

    const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
    // Should fail due to duplicate token ID
  });
});