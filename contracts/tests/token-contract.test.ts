/**
 * Token Contract Tests
 * Tests for SIP-010 compliant fungible token contract
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
  expectEqual,
  formatTokenAmount,
  DEFAULT_TOKEN_DATA
} from './helpers';

describe('Token Contract - Basic Operations', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should get token name', () => {
    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-name',
      [],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(Cl.stringUtf8('Clarity Coin')));
  });

  it('should get token symbol', () => {
    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-symbol',
      [],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(Cl.stringUtf8('CC')));
  });

  it('should get token decimals', () => {
    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-decimals',
      [],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(Cl.uint(6)));
  });

  it('should get initial total supply', () => {
    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-total-supply',
      [],
      deployer
    );

    expect(result.isOk()).toBe(true);
    // Initial supply should be 0
    expectEqual(result.value, Cl.ok(Cl.uint(0)));
  });

  it('should get token URI', () => {
    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-token-uri',
      [],
      deployer
    );

    expect(result.isOk()).toBe(true);
    // Should return some with default URI
    expect(result.value.value.value).toBeDefined();
  });
});

describe('Token Contract - Minting', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should mint tokens to recipient', () => {
    const mintAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mintAmount), principal(user1)],
      deployer
    );

    expect(result.isOk()).toBe(true);

    // Verify balance increased
    const balanceResult = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user1)],
      deployer
    );

    expect(balanceResult.isOk()).toBe(true);
    expectEqual(balanceResult.value, Cl.ok(uint(mintAmount)));
  });

  it('should increase total supply on mint', () => {
    const mintAmount = formatTokenAmount(50);

    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mintAmount), principal(user1)],
      deployer
    );

    const supplyResult = simnet.callReadOnlyFn(
      'token-contract',
      'get-total-supply',
      [],
      deployer
    );

    expect(supplyResult.isOk()).toBe(true);
    expectEqual(supplyResult.value, Cl.ok(uint(mintAmount)));
  });

  it('should mint to multiple recipients', () => {
    const amount1 = formatTokenAmount(100);
    const amount2 = formatTokenAmount(200);

    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(amount1), principal(user1)],
      deployer
    );

    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(amount2), principal(user2)],
      deployer
    );

    const balance1 = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user1)],
      deployer
    );

    const balance2 = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user2)],
      deployer
    );

    expectEqual(balance1.value, Cl.ok(uint(amount1)));
    expectEqual(balance2.value, Cl.ok(uint(amount2)));
  });

  it('should reject mint from non-owner', () => {
    const mintAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mintAmount), principal(user1)],
      user1 // Non-owner trying to mint
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_OWNER_ONLY (u100)
    expectEqual(result.value, Cl.error(Cl.uint(100)));
  });

  it('should reject mint with zero amount', () => {
    const result = simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(0), principal(user1)],
      deployer
    );

    expect(result.isErr()).toBe(true);
  });

  it("owner can mint within max supply and balances update", () => {
    // mint 100 units to wallet1
    const { result: mintResult } = simnet.callPublicFn(
      "token-contract",
      "mint",
      [uintCV(100n), standardPrincipalCV(wallet1)],
      deployer,
    );
    // ResponseOkCV<bool> -> result.type === "ok"
    expect(mintResult.type).toBe("ok");

    // total supply should now be 100
    const { result: supplyResult } = simnet.callReadOnlyFn(
      "token-contract",
      "get-total-supply",
      [],
      deployer,
    );
    expect(supplyResult.value.value).toBe(100n);

    // wallet1 balance should be 100
    const { result: balanceResult } = simnet.callReadOnlyFn(
      "token-contract",
      "get-balance",
      [standardPrincipalCV(wallet1)],
      wallet1,
    );
    expect(balanceResult.value.value).toBe(100n);
  });
});

describe('Token Contract - Transfers', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;

    // Mint tokens to user1 for transfer tests
    const mintAmount = formatTokenAmount(1000);
    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mintAmount), principal(user1)],
      deployer
    );
  });

  it('should transfer tokens between users', () => {
    const transferAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'token-contract',
      'transfer',
      [
        uint(transferAmount),
        principal(user1),
        principal(user2),
        none()
      ],
      user1
    );

    expect(result.isOk()).toBe(true);

    // Verify sender balance decreased
    const senderBalance = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user1)],
      deployer
    );

    // Verify recipient balance increased
    const recipientBalance = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user2)],
      deployer
    );

    expectEqual(senderBalance.value, Cl.ok(uint(formatTokenAmount(900))));
    expectEqual(recipientBalance.value, Cl.ok(uint(transferAmount)));
  });

  it('should transfer with memo', () => {
    const transferAmount = formatTokenAmount(50);
    const memo = 'Payment for services';

    const result = simnet.callPublicFn(
      'token-contract',
      'transfer',
      [
        uint(transferAmount),
        principal(user1),
        principal(user2),
        some(buffer(memo))
      ],
      user1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject transfer with insufficient balance', () => {
    const transferAmount = formatTokenAmount(2000); // More than user1 has

    const result = simnet.callPublicFn(
      'token-contract',
      'transfer',
      [
        uint(transferAmount),
        principal(user1),
        principal(user2),
        none()
      ],
      user1
    );

    expect(result.isErr()).toBe(true);
  });

  it('should reject transfer from unauthorized sender', () => {
    const transferAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'token-contract',
      'transfer',
      [
        uint(transferAmount),
        principal(user1),
        principal(user2),
        none()
      ],
      user2 // user2 trying to transfer user1's tokens
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_NOT_TOKEN_OWNER (u101)
    expectEqual(result.value, Cl.error(Cl.uint(101)));
  });

  it('should reject transfer with zero amount', () => {
    const result = simnet.callPublicFn(
      'token-contract',
      'transfer',
      [
        uint(0),
        principal(user1),
        principal(user2),
        none()
      ],
      user1
    );

    expect(result.isErr()).toBe(true);
  });
});

describe('Token Contract - Balance Queries', () => {
  let deployer: string;
  let user1: string;
  let user2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
    user2 = accounts.get('wallet_2')!;
  });

  it('should return zero balance for new account', () => {
    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user1)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(0)));
  });

  it('should return correct balance after mint', () => {
    const mintAmount = formatTokenAmount(500);

    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mintAmount), principal(user1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user1)],
      deployer
    );

    expect(result.isOk()).toBe(true);
    expectEqual(result.value, Cl.ok(uint(mintAmount)));
  });

  it('should return correct balance after multiple operations', () => {
    const mint1 = formatTokenAmount(100);
    const mint2 = formatTokenAmount(200);
    const transfer = formatTokenAmount(50);

    // Mint to user1
    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mint1), principal(user1)],
      deployer
    );

    // Mint more to user1
    simnet.callPublicFn(
      'token-contract',
      'mint',
      [uint(mint2), principal(user1)],
      deployer
    );

    // Transfer from user1 to user2
    simnet.callPublicFn(
      'token-contract',
      'transfer',
      [uint(transfer), principal(user1), principal(user2), none()],
      user1
    );

    const user1Balance = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user1)],
      deployer
    );

    const user2Balance = simnet.callReadOnlyFn(
      'token-contract',
      'get-balance',
      [principal(user2)],
      deployer
    );

    const expectedUser1 = mint1 + mint2 - transfer;
    const expectedUser2 = transfer;

    expectEqual(user1Balance.value, Cl.ok(uint(expectedUser1)));
    expectEqual(user2Balance.value, Cl.ok(uint(expectedUser2)));
  });
});

describe('Token Contract - Token URI', () => {
  let deployer: string;
  let user1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    user1 = accounts.get('wallet_1')!;
  });

  it('should set token URI as owner', () => {
    const newUri = 'https://example.com/new-metadata.json';

    const result = simnet.callPublicFn(
      'token-contract',
      'set-token-uri',
      [str(newUri)],
      deployer
    );

    expect(result.isOk()).toBe(true);

    // Verify URI was updated
    const uriResult = simnet.callReadOnlyFn(
      'token-contract',
      'get-token-uri',
      [],
      deployer
    );

    expect(uriResult.isOk()).toBe(true);
  });

  it('should reject set-token-uri from non-owner', () => {
    const newUri = 'https://example.com/new-metadata.json';

    const result = simnet.callPublicFn(
      'token-contract',
      'set-token-uri',
      [str(newUri)],
      user1 // Non-owner
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_OWNER_ONLY (u100)
    expectEqual(result.value, Cl.error(Cl.uint(100)));
  });
});
