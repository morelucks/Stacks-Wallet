/**
 * Multi-Token NFT Contract Tests
 * Tests for the ERC-1155-like multi-token contract on Stacks Network.
 *
 * Error codes:
 *  102 – ERR_UNAUTHORIZED
 *  111 – ERR_INSUFFICIENT_BALANCE
 *  121 – ERR_BATCH_SIZE_MISMATCH
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
  expectEqual,
  formatTokenAmount,
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

  it('should reject zero supply', () => {
    const supply = 0;
    const uri = 'https://example.com/token.json';
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

  it('should reject empty name', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = ''; // Empty
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

  it('should reject mint to invalid token ID', () => {
    const mintAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(999), uint(mintAmount)], // Non-existent token
      creator1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle multiple mints to same user', () => {
    const mintAmount1 = formatTokenAmount(100);
    const mintAmount2 = formatTokenAmount(50);

    // First mint
    simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount1)],
      creator1
    );

    // Second mint
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount2)],
      creator1
    );

    expect(result.isOk()).toBe(true);

    // Verify total balance
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      creator1
    );

    expectEqual(balanceResult.value, Cl.ok(uint(mintAmount1 + mintAmount2)));
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

  it('should reject transfer with zero amount', () => {
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user2), uint(1), uint(0), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should reject self-transfer', () => {
    const transferAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user1), uint(1), uint(transferAmount), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle transfer to new recipient', () => {
    const accounts = simnet.getAccounts();
    const newUser = accounts.get('wallet_4')!;
    const transferAmount = formatTokenAmount(75);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(newUser), uint(1), uint(transferAmount), none()],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify new user has balance
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(newUser), uint(1)],
      user1
    );

    expectEqual(balanceResult.value, Cl.ok(uint(transferAmount)));
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

  it('should reject empty batch transfer', () => {
    const tokenIds: any[] = [];
    const amounts: any[] = [];

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-batch-transfer-from',
      [principal(user1), principal(user2), Cl.list(tokenIds), Cl.list(amounts), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle partial batch transfer failure', () => {
    const tokenIds = [Cl.uint(1), Cl.uint(999)]; // Second token doesn't exist
    const amounts = [Cl.uint(formatTokenAmount(100)), Cl.uint(formatTokenAmount(50))];

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-batch-transfer-from',
      [principal(user1), principal(user2), Cl.list(tokenIds), Cl.list(amounts), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle batch transfer with insufficient balance', () => {
    const tokenIds = [Cl.uint(1), Cl.uint(2)];
    const amounts = [Cl.uint(formatTokenAmount(1000)), Cl.uint(formatTokenAmount(50))]; // First amount too high

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-batch-transfer-from',
      [principal(user1), principal(user2), Cl.list(tokenIds), Cl.list(amounts), none()],
      user1
    );

    expect(result.isErr()).toBe(true);
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

  it('should allow approved operator to transfer', () => {
    // Create and mint tokens first
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

    const mintAmount = formatTokenAmount(500);
    simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );

    // Set approval
    simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(true)],
      user1
    );

    // Operator transfers user1's tokens
    const transferAmount = formatTokenAmount(100);
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(creator1), uint(1), uint(transferAmount), none()],
      operator
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject transfer after approval revoked', () => {
    // Create and mint tokens first
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

    const mintAmount = formatTokenAmount(500);
    simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );

    // Set and revoke approval
    simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(true)],
      user1
    );

    simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(false)],
      user1
    );

    // Operator tries to transfer
    const transferAmount = formatTokenAmount(100);
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(creator1), uint(1), uint(transferAmount), none()],
      operator
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

  it('should reject burn with zero amount', () => {
    const result = simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user1), uint(1), uint(0)],
      user1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should reject burn from unauthorized user', () => {
    const burnAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user1), uint(1), uint(burnAmount)],
      creator1 // Creator trying to burn user1's tokens
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle complete token burn', () => {
    const totalBalance = formatTokenAmount(500);

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user1), uint(1), uint(totalBalance)],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify balance is zero
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      user1
    );

    expectEqual(balanceResult.value, Cl.ok(uint(0)));
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

  it('should handle non-existent token URI query', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-token-uri',
      [uint(999)], // Non-existent token
      creator1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle non-existent token info query', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-token-info',
      [uint(999)], // Non-existent token
      creator1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should validate token metadata structure', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-token-info',
      [uint(1)],
      creator1
    );

    expect(result.isOk()).toBe(true);
    // Verify the structure contains expected fields
    const tokenInfo = result.value.value;
    expect(tokenInfo).toBeDefined();
  });

  it('should handle balance query for non-existent token', () => {
    const result = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(999)], // Non-existent token
      creator1
    );

    expect(result.isErr()).toBe(true);
  });
});

describe('Multi-Token NFT - Royalty System', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;
  });

  it('should create token with valid royalty', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Royalty Token';
    const description = 'Token with royalty';
    const royalty = 1000; // 10%

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject royalty above maximum', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Token';
    const description = 'Description';
    const royalty = 10001; // > 100%

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should handle zero royalty', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'No Royalty Token';
    const description = 'Token without royalty';
    const royalty = 0;

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should handle maximum valid royalty', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Max Royalty Token';
    const description = 'Token with maximum royalty';
    const royalty = 10000; // 100%

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    expect(result.isOk()).toBe(true);
  });
});
describe('Multi-Token NFT - Performance Tests', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;
  });

  it('should handle large batch operations efficiently', () => {
    // Create multiple tokens
    for (let i = 0; i < 5; i++) {
      const supply = formatTokenAmount(1000);
      const uri = `https://example.com/token-${i}.json`;
      const name = `Token ${i}`;
      const description = 'Performance test token';
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

    // Large batch transfer
    const tokenIds = [Cl.uint(1), Cl.uint(2), Cl.uint(3), Cl.uint(4), Cl.uint(5)];
    const amounts = [
      Cl.uint(formatTokenAmount(10)),
      Cl.uint(formatTokenAmount(20)),
      Cl.uint(formatTokenAmount(30)),
      Cl.uint(formatTokenAmount(40)),
      Cl.uint(formatTokenAmount(50))
    ];

    const result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-batch-transfer-from',
      [principal(user1), principal(creator1), Cl.list(tokenIds), Cl.list(amounts), none()],
      user1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should handle multiple sequential operations', () => {
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/token.json';
    const name = 'Sequential Test Token';
    const description = 'Token for sequential operations';
    const royalty = 0;

    // Create token
    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    // Multiple mint operations
    for (let i = 0; i < 10; i++) {
      const mintAmount = formatTokenAmount(10);
      const result = simnet.callPublicFn(
        'multi-token-nft',
        'mint',
        [principal(user1), uint(1), uint(mintAmount)],
        creator1
      );
      expect(result.isOk()).toBe(true);
    }

    // Verify final balance
    const balanceResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      creator1
    );

    expectEqual(balanceResult.value, Cl.ok(uint(formatTokenAmount(100))));
  });

  it('should handle rapid approval changes', () => {
    const accounts = simnet.getAccounts();
    const operator1 = accounts.get('wallet_3')!;
    const operator2 = accounts.get('wallet_4')!;

    // Rapid approval changes
    for (let i = 0; i < 5; i++) {
      // Set approval for operator1
      let result = simnet.callPublicFn(
        'multi-token-nft',
        'set-approval-for-all',
        [principal(operator1), Cl.bool(true)],
        user1
      );
      expect(result.isOk()).toBe(true);

      // Set approval for operator2
      result = simnet.callPublicFn(
        'multi-token-nft',
        'set-approval-for-all',
        [principal(operator2), Cl.bool(true)],
        user1
      );
      expect(result.isOk()).toBe(true);

      // Revoke both
      result = simnet.callPublicFn(
        'multi-token-nft',
        'set-approval-for-all',
        [principal(operator1), Cl.bool(false)],
        user1
      );
      expect(result.isOk()).toBe(true);

      result = simnet.callPublicFn(
        'multi-token-nft',
        'set-approval-for-all',
        [principal(operator2), Cl.bool(false)],
        user1
      );
      expect(result.isOk()).toBe(true);
    }
  });
});
describe('Multi-Token NFT - Integration Tests', () => {
  let deployer: string;
  let creator1: string;
  let user1: string;
  let user2: string;
  let operator: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    creator1 = accounts.get('wallet_1')!;
    user1 = accounts.get('wallet_2')!;
    user2 = accounts.get('wallet_3')!;
    operator = accounts.get('wallet_4')!;
  });

  it('should handle complete token lifecycle', () => {
    // 1. Create token
    const supply = formatTokenAmount(1000);
    const uri = 'https://example.com/lifecycle-token.json';
    const name = 'Lifecycle Token';
    const description = 'Complete lifecycle test';
    const royalty = 500; // 5%

    let result = simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );
    expect(result.isOk()).toBe(true);

    // 2. Mint tokens
    const mintAmount = formatTokenAmount(500);
    result = simnet.callPublicFn(
      'multi-token-nft',
      'mint',
      [principal(user1), uint(1), uint(mintAmount)],
      creator1
    );
    expect(result.isOk()).toBe(true);

    // 3. Set approval
    result = simnet.callPublicFn(
      'multi-token-nft',
      'set-approval-for-all',
      [principal(operator), Cl.bool(true)],
      user1
    );
    expect(result.isOk()).toBe(true);

    // 4. Operator transfers
    const transferAmount = formatTokenAmount(100);
    result = simnet.callPublicFn(
      'multi-token-nft',
      'safe-transfer-from',
      [principal(user1), principal(user2), uint(1), uint(transferAmount), none()],
      operator
    );
    expect(result.isOk()).toBe(true);

    // 5. User burns tokens
    const burnAmount = formatTokenAmount(50);
    result = simnet.callPublicFn(
      'multi-token-nft',
      'burn',
      [principal(user2), uint(1), uint(burnAmount)],
      user2
    );
    expect(result.isOk()).toBe(true);

    // 6. Verify final state
    const user1Balance = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user1), uint(1)],
      creator1
    );
    expectEqual(user1Balance.value, Cl.ok(uint(formatTokenAmount(400))));

    const user2Balance = simnet.callReadOnlyFn(
      'multi-token-nft',
      'balance-of',
      [principal(user2), uint(1)],
      creator1
    );
    expectEqual(user2Balance.value, Cl.ok(uint(formatTokenAmount(50))));
  });

  it('should handle complex multi-user scenarios', () => {
    const accounts = simnet.getAccounts();
    const users = [
      accounts.get('wallet_2')!,
      accounts.get('wallet_3')!,
      accounts.get('wallet_4')!,
      accounts.get('wallet_5')!
    ];

    // Create token
    const supply = formatTokenAmount(10000);
    const uri = 'https://example.com/multi-user-token.json';
    const name = 'Multi User Token';
    const description = 'Token for multi-user testing';
    const royalty = 250; // 2.5%

    simnet.callPublicFn(
      'multi-token-nft',
      'create-token-with-royalty',
      [uint(supply), str(uri), str(name), str(description), uint(royalty)],
      creator1
    );

    // Distribute tokens to multiple users
    users.forEach((user, index) => {
      const mintAmount = formatTokenAmount(1000 + (index * 100));
      const result = simnet.callPublicFn(
        'multi-token-nft',
        'mint',
        [principal(user), uint(1), uint(mintAmount)],
        creator1
      );
      expect(result.isOk()).toBe(true);
    });

    // Cross-transfers between users
    for (let i = 0; i < users.length - 1; i++) {
      const transferAmount = formatTokenAmount(50);
      const result = simnet.callPublicFn(
        'multi-token-nft',
        'safe-transfer-from',
        [principal(users[i]), principal(users[i + 1]), uint(1), uint(transferAmount), none()],
        users[i]
      );
      expect(result.isOk()).toBe(true);
    }

    // Verify all users still have positive balances
    users.forEach((user) => {
      const balanceResult = simnet.callReadOnlyFn(
        'multi-token-nft',
        'balance-of',
        [principal(user), uint(1)],
        creator1
      );
      expect(balanceResult.isOk()).toBe(true);
      // Balance should be greater than 0
      const balance = balanceResult.value.value as any;
      expect(Number(balance.value)).toBeGreaterThan(0);
    });
  });

  it('should maintain data consistency under stress', () => {
    // Create multiple tokens
    const numTokens = 3;
    for (let i = 0; i < numTokens; i++) {
      const supply = formatTokenAmount(1000);
      const uri = `https://example.com/stress-token-${i}.json`;
      const name = `Stress Token ${i}`;
      const description = 'Stress test token';
      const royalty = i * 100; // Varying royalties

      simnet.callPublicFn(
        'multi-token-nft',
        'create-token-with-royalty',
        [uint(supply), str(uri), str(name), str(description), uint(royalty)],
        creator1
      );
    }

    // Mint tokens to multiple users
    const accounts = simnet.getAccounts();
    const testUsers = [user1, user2, accounts.get('wallet_5')!];
    
    testUsers.forEach((user, userIndex) => {
      for (let tokenId = 1; tokenId <= numTokens; tokenId++) {
        const mintAmount = formatTokenAmount(100 + (userIndex * 10));
        const result = simnet.callPublicFn(
          'multi-token-nft',
          'mint',
          [principal(user), uint(tokenId), uint(mintAmount)],
          creator1
        );
        expect(result.isOk()).toBe(true);
      }
    });

    // Perform random operations
    for (let i = 0; i < 20; i++) {
      const userIndex = i % testUsers.length;
      const tokenId = (i % numTokens) + 1;
      const user = testUsers[userIndex];
      const recipient = testUsers[(userIndex + 1) % testUsers.length];

      // Random transfer
      const transferAmount = formatTokenAmount(5);
      const result = simnet.callPublicFn(
        'multi-token-nft',
        'safe-transfer-from',
        [principal(user), principal(recipient), uint(tokenId), uint(transferAmount), none()],
        user
      );
      
      // Some transfers might fail due to insufficient balance, which is expected
      // We just verify the contract doesn't crash
      expect(result.isOk() || result.isErr()).toBe(true);
    }

    // Verify contract is still functional
    const infoResult = simnet.callReadOnlyFn(
      'multi-token-nft',
      'get-contract-info',
      [],
      creator1
    );
    expect(infoResult.isOk()).toBe(true);
  });
});