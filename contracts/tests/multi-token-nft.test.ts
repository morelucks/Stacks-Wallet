/**
 * Multi-Token NFT Contract Tests
 * Tests for ERC1155-like multi-token contract
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
  expectEqual,
  formatTokenAmount
} from './helpers';

describe('Multi-Token NFT - Token Creation', () => {
  let deployer: string;
  let creator1: string;
  let creator2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    creator2 = accounts.get('wallet_2')!;
  });

  it('should create a new token with metadata', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token-1.json';
    const name = 'Test Token';
    const description = 'A test token for testing';
    const royalty = 500; // 5%

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should assign token ID sequentially', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const royalty = 0;

    // Create first token
    const result1 = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    // Create second token
    const result2 = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);
  });

  it('should set creator as initial owner', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const royalty = 0;

    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    // Check balance of creator
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(creator1), uint(1)],
      creator1
    );

    expect(balanceResult.isOk()).toBe(true);
    expectEqual(balanceResult.value, Cl.ok(uint(supply)));
  });

  it('should reject invalid royalty percentage', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const invalidRoyalty = 10001; // > 100%

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(invalidRoyalty)],
      creator1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should reject empty URI', () => {
    const supply = formatTokenAmount(1000);
    const uri = ''; // Empty
    const name = 'Token';
    const description = 'Description';
    const royalty = 0;

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result.isErr()).toBe(true);
  });
});

describe('Multi-Token NFT - Minting', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;

    // Create a token first
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const royalty = 0;

    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );
  });

  it('should mint tokens to recipient', () => {
    const mintAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );

    expect(result.isOk()).toBe(true);

    // Verify balance
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      creator1
    );

    expectEqual(balanceResult.value, Cl.ok(uint(mintAmount)));
  });

  it('should reject mint from non-creator', () => {
    const mintAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      user1 // Non-creator
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_UNAUTHORIZED (u102)
    expectEqual(result.value, Cl.error(Cl.uint(102)));
  });

  it('should reject mint with zero amount', () => {
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(0)],
      creator1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should increase total supply on mint', () => {
    const mintAmount = formatTokenAmount(100);

    simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );

    const supplyResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'total-supply',
      [uint(1)],
      creator1
    );

    expect(supplyResult.isOk()).toBe(true);
  });
});

describe('Multi-Token NFT - Transfers', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;
    user2 = accounts.get('wallet_3')!;

    // Create and mint tokens
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const royalty = 0;

    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    // Mint to user1
    const mintAmount = formatTokenAmount(500);
    simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );
  });

  it('should transfer tokens between users', () => {
    const transferAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user2), uint(1), uint(transferAmount), none()],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify balances
    const user1Balance = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      user1
    );

    const user2Balance = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user2), uint(1)],
      user1
    );

    expectEqual(user1Balance.value, Cl.ok(uint(formatTokenAmount(400))));
    expectEqual(user2Balance.value, Cl.ok(uint(transferAmount)));
  });

  it('should transfer with memo', () => {
    const transferAmount = formatTokenAmount(50);
    const memo = 'Payment memo';

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user2), uint(1), uint(transferAmount), some(buffer(memo))],
      user1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject transfer with insufficient balance', () => {
    const transferAmount = formatTokenAmount(1000); // More than user1 has

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user2), uint(1), uint(transferAmount), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_INSUFFICIENT_BALANCE (u111)
    expectEqual(result.value, Cl.error(Cl.uint(111)));
  });

  it('should reject transfer from unauthorized sender', () => {
    const transferAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user2), uint(1), uint(transferAmount), none()],
      user2 // user2 trying to transfer user1's tokens
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_UNAUTHORIZED (u102)
    expectEqual(result.value, Cl.error(Cl.uint(102)));
  });
});

describe('Multi-Token NFT - Batch Transfers', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;
    user2 = accounts.get('wallet_3')!;

    // Create multiple tokens
    for (let i = 0; i < 3; i++) {
      const supply = formatTokenAmount(1000);
      const uri = `https://example.com/token-${i}.json`;
      const name = `Token ${i}`;
      const description = 'Description';
      const royalty = 0;

      simnet.callPublicFn(
        'multi-token-nft',
        'create-token-with-royalty',
        [uint(supply), str(uri), str(name), str(description), uint(royalty)],
        creator1
      );

      // Mint to user1
      const mintAmount = formatTokenAmount(500);
      simnet.callPublicFn(
        'multi-token-nft',
        'mint',
        [principal(user1), uint(i + 1), uint(mintAmount)],
        creator1
      );
    }
  });

  it('should batch transfer multiple tokens', () => {
    const tokenIds = [Cl.uint(1), Cl.uint(2), Cl.uint(3)];
    const amounts = [Cl.uint(formatTokenAmount(100)), Cl.uint(formatTokenAmount(50)), Cl.uint(formatTokenAmount(75))];

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-batch-transfer-from',
      [principal(user1), principal(user2), Cl.list(tokenIds), Cl.list(amounts), none()],
      user1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject batch transfer with mismatched arrays', () => {
    const tokenIds = [Cl.uint(1), Cl.uint(2)];
    const amounts = [Cl.uint(formatTokenAmount(100))]; // Mismatch

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-batch-transfer-from',
      [principal(user1), principal(user2), Cl.list(tokenIds), Cl.list(amounts), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_BATCH_SIZE_MISMATCH (u121)
    expectEqual(result.value, Cl.error(Cl.uint(121)));
  });
});

describe('Multi-Token NFT - Approvals', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;
  let operator: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;
    operator = accounts.get('wallet_3')!;
  });

  it('should set approval for all', () => {
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(true)],
      user1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should check approval status', () => {
    // Set approval
    simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(true)],
      user1
    );

    // Check approval
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'is-approved-for-all',
      [principal(user1), principal(operator)],
      user1
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(Cl.bool(true)));
  });

  it('should revoke approval', () => {
    // Set approval
    simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(true)],
      user1
    );

    // Revoke approval
    simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(false)],
      user1
    );

    // Check approval
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'is-approved-for-all',
      [principal(user1), principal(operator)],
      user1
    );

    expectEqual(result.value, Cl.ok(Cl.bool(false)));
  });

  it('should reject self-approval', () => {
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(user1), Cl.bool(true)],
      user1
    );

    expect(result.isErr()).toBe(true);
  });
});

describe('Multi-Token NFT - Burning', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;

    // Create and mint tokens
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const royalty = 0;

    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    // Mint to user1
    const mintAmount = formatTokenAmount(500);
    simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );
  });

  it('should burn tokens', () => {
    const burnAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user1), uint(1), uint(burnAmount)],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify balance decreased
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      user1
    );

    expectEqual(balanceResult.value, Cl.ok(uint(formatTokenAmount(400))));
  });

  it('should decrease total supply on burn', () => {
    const burnAmount = formatTokenAmount(100);

    simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user1), uint(1), uint(burnAmount)],
      user1
    );

    const supplyResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'total-supply',
      [uint(1)],
      user1
    );

    expect(supplyResult.isOk()).toBe(true);
  });

  it('should reject burn with insufficient balance', () => {
    const burnAmount = formatTokenAmount(1000); // More than user1 has

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user1), uint(1), uint(burnAmount)],
      user1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_INSUFFICIENT_BALANCE (u111)
    expectEqual(result.value, Cl.error(Cl.uint(111)));
  });
});

describe('Multi-Token NFT - Read-Only Functions', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;

    // Create token
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Test Token';
    const description = 'A test token';
    const royalty = 500;

    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );
  });

  it('should get token URI', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-token-uri',
      [uint(1)],
      creator1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should get contract URI', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-contract-uri',
      [],
      creator1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should get token info', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-token-info',
      [uint(1)],
      creator1
    );

    expect(result.isOk()).toBe(true);
    expect(result.value.value).toBeDefined();
  });

  it('should get contract info', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-contract-info',
      [],
      creator1
    );

    expect(result.isOk()).toBe(true);
    expect(result.value.value).toBeDefined();
  });
});
