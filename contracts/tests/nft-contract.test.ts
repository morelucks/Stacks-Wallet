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
  it('should mint multiple tokens to same recipient', () => {
    // Mint first token
    const result1 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );

    expect(result1.isOk()).toBe(true);
    expectEqual(result1.value, Cl.ok(uint(1)));

    // Mint second token to same recipient
    const result2 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );

    expect(result2.isOk()).toBe(true);
    expectEqual(result2.value, Cl.ok(uint(2)));

    // Verify both tokens owned by user1
    const owner1 = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    const owner2 = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(2)],
      deployer
    );

    expectEqual(owner1.value, Cl.ok(some(principal(user1))));
    expectEqual(owner2.value, Cl.ok(some(principal(user1))));
  });
  it('should mint tokens to different recipients', () => {
    // Mint to user1
    const result1 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );

    // Mint to user2
    const result2 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user2)],
      deployer
    );

    // Mint to user3
    const result3 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user3)],
      deployer
    );

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);
    expect(result3.isOk()).toBe(true);

    expectEqual(result1.value, Cl.ok(uint(1)));
    expectEqual(result2.value, Cl.ok(uint(2)));
    expectEqual(result3.value, Cl.ok(uint(3)));

    // Verify ownership
    const owner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);
    const owner3 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(3)], deployer);

    expectEqual(owner1.value, Cl.ok(some(principal(user1))));
    expectEqual(owner2.value, Cl.ok(some(principal(user2))));
    expectEqual(owner3.value, Cl.ok(some(principal(user3))));
  });