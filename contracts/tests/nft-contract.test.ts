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
describe('NFT Contract - Edge Cases and Boundaries', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should handle zero token ID queries', () => {
    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(0)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(none()));
  });

  it('should handle large token ID queries', () => {
    const largeId = 999999999;
    const result = simnet.callReadOnlyFn(
      'nft-contract',
      'get-owner',
      [uint(largeId)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(none()));
  });
  it('should handle empty contract state consistently', () => {
    // Test all read functions on empty contract
    const lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    const owner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const uri = simnet.callReadOnlyFn('nft-contract', 'get-token-uri', [uint(1)], deployer);

    expectEqual(lastTokenId.value, Cl.ok(uint(0)));
    expectEqual(owner.value, Cl.ok(none()));
    expectEqual(uri.value, Cl.ok(none()));
  });

  it('should handle boundary conditions for all functions', () => {
    // Test transfer with zero token ID
    const transferZero = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(0), principal(user1), principal(deployer)],
      user1
    );
    expect(transferZero.isErr()).toBe(true);

    // Test get-token-uri with zero
    const uriZero = simnet.callReadOnlyFn('nft-contract', 'get-token-uri', [uint(0)], deployer);
    expectEqual(uriZero.value, Cl.ok(none()));

    // Test operations after minting first token
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // Now token 1 exists, but 0 still shouldn't
    const ownerZero = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(0)], deployer);
    const ownerOne = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);

    expectEqual(ownerZero.value, Cl.ok(none()));
    expectEqual(ownerOne.value, Cl.ok(some(principal(user1))));
  });
describe('NFT Contract - Integration Tests', () => {
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

  it('should handle mint then transfer sequences', () => {
    // Mint 3 tokens to different users
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    simnet.callPublicFn('nft-contract', 'mint', [principal(user2)], deployer);
    simnet.callPublicFn('nft-contract', 'mint', [principal(user3)], deployer);

    // Verify initial state
    let lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(3)));

    // Transfer tokens in a chain: user1 -> user2, user2 -> user3, user3 -> user1
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(user2)], user1);
    simnet.callPublicFn('nft-contract', 'transfer', [uint(2), principal(user2), principal(user3)], user2);
    simnet.callPublicFn('nft-contract', 'transfer', [uint(3), principal(user3), principal(user1)], user3);

    // Verify final ownership
    const owner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);
    const owner3 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(3)], deployer);

    expectEqual(owner1.value, Cl.ok(some(principal(user2))));
    expectEqual(owner2.value, Cl.ok(some(principal(user3))));
    expectEqual(owner3.value, Cl.ok(some(principal(user1))));

    // Verify last-token-id unchanged by transfers
    lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(3)));
  });
  it('should handle multiple users with multiple tokens', () => {
    // Mint 6 tokens alternating between users
    for (let i = 1; i <= 6; i++) {
      const recipient = i % 3 === 1 ? user1 : i % 3 === 2 ? user2 : user3;
      simnet.callPublicFn('nft-contract', 'mint', [principal(recipient)], deployer);
    }

    // Verify initial ownership pattern
    // user1: tokens 1, 4
    // user2: tokens 2, 5  
    // user3: tokens 3, 6
    const owners = [];
    for (let i = 1; i <= 6; i++) {
      const owner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(i)], deployer);
      owners.push(owner.value);
    }

    const expectedUsers = [user1, user2, user3, user1, user2, user3];
    for (let i = 0; i < 6; i++) {
      expectEqual(owners[i], Cl.ok(some(principal(expectedUsers[i]))));
    }

    // Perform some transfers
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(user2)], user1);
    simnet.callPublicFn('nft-contract', 'transfer', [uint(6), principal(user3), principal(user1)], user3);

    // Verify updated ownership
    const newOwner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const newOwner6 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(6)], deployer);

    expectEqual(newOwner1.value, Cl.ok(some(principal(user2))));
    expectEqual(newOwner6.value, Cl.ok(some(principal(user1))));
  });
  it('should handle complex ownership chains', () => {
    // Create a complex ownership scenario
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // Create ownership chain: user1 -> user2 -> user3 -> deployer
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(user2)], user1);
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user2), principal(user3)], user2);
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user3), principal(deployer)], user3);

    // Verify final ownership
    const finalOwner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    expectEqual(finalOwner.value, Cl.ok(some(principal(deployer))));

    // Verify other tokens still owned by user1
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);
    const owner3 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(3)], deployer);

    expectEqual(owner2.value, Cl.ok(some(principal(user1))));
    expectEqual(owner3.value, Cl.ok(some(principal(user1))));
  });

  it('should verify state consistency across operations', () => {
    // Perform mixed operations and verify consistency
    const operations = [
      () => simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer),
      () => simnet.callPublicFn('nft-contract', 'mint', [principal(user2)], deployer),
      () => simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(user3)], user1),
      () => simnet.callPublicFn('nft-contract', 'mint', [principal(user3)], deployer),
      () => simnet.callPublicFn('nft-contract', 'transfer', [uint(2), principal(user2), principal(user1)], user2)
    ];

    // Execute operations and verify state after each
    for (let i = 0; i < operations.length; i++) {
      operations[i]();
      
      // Verify last-token-id is correct (should be number of mints so far)
      const expectedMints = i < 2 ? i + 1 : i < 3 ? 2 : i < 4 ? 3 : 3;
      const lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
      expectEqual(lastTokenId.value, Cl.ok(uint(expectedMints)));
    }

    // Verify final ownership state
    const owner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);
    const owner3 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(3)], deployer);

    expectEqual(owner1.value, Cl.ok(some(principal(user3)))); // Transferred from user1 to user3
    expectEqual(owner2.value, Cl.ok(some(principal(user1)))); // Transferred from user2 to user1
    expectEqual(owner3.value, Cl.ok(some(principal(user3)))); // Minted to user3
  });
/**
 * Test execution configuration
 */
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per test
  propertyIterations: 100,
  maxRetries: 3
};

// Configure test timeouts
describe.configure({ timeout: TEST_CONFIG.timeout });

describe('NFT Contract - Performance and Reliability', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should handle rapid sequential operations', () => {
    // Test rapid minting
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const result = simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
      expect(result.isOk()).toBe(true);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 5 seconds)
    expect(duration).toBeLessThan(5000);
    
    // Verify final state
    const lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(10)));
  });

  it('should maintain consistency under stress', () => {
    // Create multiple tokens and perform many transfers
    const tokenCount = 5;
    const transferCount = 20;
    
    // Mint tokens
    for (let i = 1; i <= tokenCount; i++) {
      simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    }
    
    // Perform many transfers
    for (let i = 0; i < transferCount; i++) {
      const tokenId = (i % tokenCount) + 1;
      const recipient = i % 2 === 0 ? deployer : user1;
      const sender = i % 2 === 0 ? user1 : deployer;
      
      const result = simnet.callPublicFn(
        'nft-contract',
        'transfer',
        [uint(tokenId), principal(sender), principal(recipient)],
        sender
      );
      
      expect(result.isOk()).toBe(true);
    }
    
    // Verify all tokens still exist and have valid owners
    for (let i = 1; i <= tokenCount; i++) {
      const owner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(i)], deployer);
      expect(owner.isOk()).toBe(true);
      expect(owner.value.value.value).toBeDefined(); // Should have an owner
    }
  });
describe('NFT Contract - Additional Minting Tests', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should mint token with correct return value', () => {
    const result = simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    
    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(1)));
  });
  it('should mint to contract owner successfully', () => {
    const result = simnet.callPublicFn('nft-contract', 'mint', [principal(deployer)], deployer);
    
    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(1)));

    const owner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    expectEqual(owner.value, Cl.ok(some(principal(deployer))));
  });
describe('NFT Contract - Transfer Edge Cases', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;

    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
  });

  it('should handle self-transfer', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user1), principal(user1)],
      user1
    );

    expect(result.isOk()).toBe(true);

    const owner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    expectEqual(owner.value, Cl.ok(some(principal(user1))));
  });
  it('should reject transfer with wrong sender parameter', () => {
    const result = simnet.callPublicFn(
      'nft-contract',
      'transfer',
      [uint(1), principal(user2), principal(user2)], // Wrong sender in params
      user1 // Actual caller
    );

    expect(result.isErr()).toBe(true);
    expectEqual(result.value, Cl.error(uint(101)));
  });
describe('NFT Contract - Ownership Query Variations', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should handle ownership queries from different callers', () => {
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // Query from deployer
    const result1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    expectEqual(result1.value, Cl.ok(some(principal(user1))));

    // Query from user1
    const result2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], user1);
    expectEqual(result2.value, Cl.ok(some(principal(user1))));
  });
  it('should return consistent results for same token', () => {
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // Multiple queries should return same result
    for (let i = 0; i < 5; i++) {
      const result = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
      expectEqual(result.value, Cl.ok(some(principal(user1))));
    }
  });
describe('NFT Contract - Token URI Variations', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should return consistent URI format', () => {
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    const result = simnet.callReadOnlyFn('nft-contract', 'get-token-uri', [uint(1)], deployer);
    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(none()));
  });
describe('NFT Contract - State Validation', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should maintain state integrity after failed operations', () => {
    // Initial state
    let lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(0)));

    // Failed mint
    const failedMint = simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], user1);
    expect(failedMint.isErr()).toBe(true);

    // State should be unchanged
    lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);
    expectEqual(lastTokenId.value, Cl.ok(uint(0)));
  });
  it('should validate token existence patterns', () => {
    // No tokens exist initially
    for (let i = 1; i <= 3; i++) {
      const owner = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(i)], deployer);
      expectEqual(owner.value, Cl.ok(none()));
    }

    // Mint one token
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);

    // Only token 1 should exist
    const owner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);

    expectEqual(owner1.value, Cl.ok(some(principal(user1))));
    expectEqual(owner2.value, Cl.ok(none()));
  });
describe('NFT Contract - Advanced Scenarios', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should handle interleaved mint and transfer operations', () => {
    // Mint token 1
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    
    // Transfer token 1
    simnet.callPublicFn('nft-contract', 'transfer', [uint(1), principal(user1), principal(user2)], user1);
    
    // Mint token 2
    simnet.callPublicFn('nft-contract', 'mint', [principal(user1)], deployer);
    
    // Verify final state
    const owner1 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(1)], deployer);
    const owner2 = simnet.callReadOnlyFn('nft-contract', 'get-owner', [uint(2)], deployer);
    const lastTokenId = simnet.callReadOnlyFn('nft-contract', 'get-last-token-id', [], deployer);

    expectEqual(owner1.value, Cl.ok(some(principal(user2))));
    expectEqual(owner2.value, Cl.ok(some(principal(user1))));
    expectEqual(lastTokenId.value, Cl.ok(uint(2)));
  });