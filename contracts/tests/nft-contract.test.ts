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
  it('should verify token ID assignment and ownership tracking', () => {
    // Mint 5 tokens
    for (let i = 1; i <= 5; i++) {
      const recipient = i % 2 === 1 ? user1 : user2; // Alternate between users
      const result = simnet.callPublicFn(
        'nft-contract',
        'mint',
        [principal(recipient)],
        deployer
      );

      expect(result.isOk()).toBe(true);
      expectEqual(result.value, Cl.ok(uint(i)));

      // Verify last-token-id is updated
      const lastTokenId = simnet.callReadOnlyFn(
        'nft-contract',
        'get-last-token-id',
        [],
        deployer
      );

      expectEqual(lastTokenId.value, Cl.ok(uint(i)));

      // Verify ownership
      const owner = simnet.callReadOnlyFn(
        'nft-contract',
        'get-owner',
        [uint(i)],
        deployer
      );

      expectEqual(owner.value, Cl.ok(some(principal(recipient))));
    }
  });
describe('NFT Contract - Minting Access Control', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should reject minting from non-owner', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user2)],
      user1 // Non-owner trying to mint
    );

    expect(result.isErr()).toBe(true);
    expectEqual(result.value, Cl.error(uint(100))); // ERR-OWNER-ONLY
  });
  it('should allow contract owner to mint successfully', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer // Contract owner
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(1)));

    // Verify token was actually minted
    const owner = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expectEqual(owner.value, Cl.ok(some(principal(user1))));
  });

  it('should verify ERR-OWNER-ONLY error code consistency', () => {
    // Test multiple non-owners get same error
    const result1 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      user1
    );

    const result2 = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user2)],
      user2
    );

    expect(result1.isErr()).toBe(true);
    expect(result2.isErr()).toBe(true);
    expectEqual(result1.value, Cl.error(uint(100)));
    expectEqual(result2.value, Cl.error(uint(100)));
  });
describe('NFT Contract - Transfer Operations', () => {
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

    // Mint a token to user1 for transfer tests
    simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );
  });

  it('should transfer token between two users', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user2)],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify ownership changed
    const owner = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expectEqual(owner.value, Cl.ok(some(principal(user2))));
  });
  it('should handle multiple transfers of same token', () => {
    // Transfer from user1 to user2
    const result1 = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user2)],
      user1
    );

    expect(result1.isOk()).toBe(true);

    // Transfer from user2 to user3
    const result2 = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user2), principal(user3)],
      user2
    );

    expect(result2.isOk()).toBe(true);

    // Verify final ownership
    const owner = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expectEqual(owner.value, Cl.ok(some(principal(user3))));
  });
  it('should transfer token to contract owner', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(deployer)],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify deployer now owns the token
    const owner = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expectEqual(owner.value, Cl.ok(some(principal(deployer))));
  });

  it('should verify ownership changes immediately after transfer', () => {
    // Check initial ownership
    const initialOwner = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expectEqual(initialOwner.value, Cl.ok(some(principal(user1))));

    // Transfer token
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user2)],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Check ownership changed immediately
    const newOwner = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expectEqual(newOwner.value, Cl.ok(some(principal(user2))));
  });
describe('NFT Contract - Transfer Access Control', () => {
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

    // Mint a token to user1 for transfer tests
    simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );
  });

  it('should reject transfer from non-owner', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user3)],
      user2 // user2 trying to transfer user1's token
    );

    expect(result.isErr()).toBe(true);
    expectEqual(result.value, Cl.error(uint(101))); // ERR-NOT-TOKEN-OWNER
  });
  it('should reject transfer of non-existent token', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(999), principal(user1), principal(user2)],
      user1
    );

    expect(result.isErr()).toBe(true);
    // The contract should handle this gracefully
  });

  it('should verify ERR-NOT-TOKEN-OWNER error code consistency', () => {
    // Test multiple non-owners get same error
    const result1 = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user3)],
      user2
    );

    const result2 = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user2)],
      user3
    );

    expect(result1.isErr()).toBe(true);
    expect(result2.isErr()).toBe(true);
    expectEqual(result1.value, Cl.error(uint(101)));
    expectEqual(result2.value, Cl.error(uint(101)));
  });
describe('NFT Contract - Ownership Queries', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should get owner of existing token', () => {
    // Mint a token
    simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(some(principal(user1))));
  });
  it('should return none for non-existent token', () => {
    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(999)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(none()));
  });

  it('should get owner after transfers', () => {
    // Mint token to user1
    simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      deployer
    );

    // Transfer to user2
    simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user2)],
      user1
    );

    // Check owner is now user2
    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(1)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(some(principal(user2))));
  });
  it('should verify correct principal returned for multiple tokens', () => {
    // Mint tokens to different users
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    simnet.callPublicFn('nft-contract', 'mint', [principal(user2)], deployer);
    simnet.callPublicFn('nft-contract', 'mint', [principal(deployer)], deployer);

    // Check each token's owner
    const owner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);
    const owner3 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(3)], deployer);

    expectEqual(owner1.value, Cl.ok(some(principal(user1))));
    expectEqual(owner2.value, Cl.ok(some(principal(user2))));
    expectEqual(owner3.value, Cl.ok(some(principal(deployer))));
  });
describe('NFT Contract - Token ID Tracking', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should return zero for initial state', () => {
    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-last-token-id',
      [],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(0)));
  });
  it('should return correct ID after minting tokens', () => {
    // Mint first token
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    let result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(result.value, Cl.ok(uint(1)));

    // Mint second token
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(result.value, Cl.ok(uint(2)));
  });

  it('should track ID correctly after multiple minting operations', () => {
    // Mint 5 tokens
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

      const result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
      expectEqual(result.value, Cl.ok(uint(i)));
    }
  });
  it('should verify accurate token ID tracking across operations', () => {
    // Initial state
    let result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(result.value, Cl.ok(uint(0)));

    // Mint and transfer operations
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(result.value, Cl.ok(uint(1)));

    // Transfer shouldn't affect last-token-id
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(deployer)], user1);
    result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(result.value, Cl.ok(uint(1))); // Should still be 1

    // Mint another token
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    result = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(result.value, Cl.ok(uint(2)));
  });
describe('NFT Contract - Token URI', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should return none for token URI (current implementation)', () => {
    // Mint a token first
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-token-uri',
      [uint(1)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(none()));
  });

  it('should return none for non-existent token URI', () => {
    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-token-uri',
      [uint(999)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(none()));
  });
describe('NFT Contract - Error Handling', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should test all defined error codes', () => {
    // ERR-OWNER-ONLY (u100) - Non-owner trying to mint
    const mintError = simnet.callPublicFn(
      'nft-contract',
      'mint',
      [principal(user1)],
      user1
    );
    expect(mintError.isErr()).toBe(true);
    expectEqual(mintError.value, Cl.error(uint(100)));

    // Mint a token for transfer tests
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // ERR-NOT-TOKEN-OWNER (u101) - Non-owner trying to transfer
    const transferError = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user2)],
      user2
    );
    expect(transferError.isErr()).toBe(true);
    expectEqual(transferError.value, Cl.error(uint(101)));
  });
  it('should maintain error consistency across functions', () => {
    // Test ERR-OWNER-ONLY consistency
    const mint1 = simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], user1);
    const mint2 = simnet.callPublicFn('nft-contract', 'mint', [principal(user2)], user2);

    expect(mint1.isErr()).toBe(true);
    expect(mint2.isErr()).toBe(true);
    expectEqual(mint1.value, Cl.error(uint(100)));
    expectEqual(mint2.value, Cl.error(uint(100)));

    // Mint a token for transfer error tests
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // Test ERR-NOT-TOKEN-OWNER consistency
    const transfer1 = simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(user2)], user2);
    const transfer2 = simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(deployer)], deployer);

    expect(transfer1.isErr()).toBe(true);
    expect(transfer2.isErr()).toBe(true);
    expectEqual(transfer1.value, Cl.error(uint(101)));
    expectEqual(transfer2.value, Cl.error(uint(101)));
  });

  it('should preserve state after error conditions', () => {
    // Check initial state
    let lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(0)));

    // Failed mint should not change state
    const failedMint = simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], user1);
    expect(failedMint.isErr()).toBe(true);

    lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(0))); // Should still be 0

    // Successful mint should change state
    const successMint = simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    expect(successMint.isOk()).toBe(true);

    lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(1))); // Should now be 1
  });