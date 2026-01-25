/**
 * NFT Contract Tests
 * Tests for SIP-009 compliant NFT contract
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { simnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import {
  principal,
  uint,
  str,
  buffer,
  some,
  none,
  assertOk,
  assertErr,
  getValue,
  expectEqual
} from './helpers';

describe('NFT Contract - Test Setup', () => {
  let deployer: string;
  let user1: string;
  let user2: string;
  let user3: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
    user3 = accounts.get('wallet_3')!;
  });

  it('should have test accounts configured', () => {
    expect(deployer).toBeDefined();
    expect(user1).toBeDefined();
    expect(user2).toBeDefined();
    expect(user3).toBeDefined();
  });
});

describe('NFT Contract - Minting Operations', () => {
  let deployer: string;
  let user1: string;
  let user2: string;
  let user3: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
    user3 = accounts.get('wallet_3')!;
  });

  it('should mint first token to recipient', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(1)));

    // Verify ownership
    const ownerResult = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expect(ownerResult.isOk()).toBe(true);
    expectEqual(ownerResult.value, Cl.ok(some(principal(user1))));
  });
});