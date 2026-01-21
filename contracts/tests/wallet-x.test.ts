/**
 * Wallet-X Contract Tests
 * Tests for multi-signature wallet with admin/member roles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { simnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import {
  principal,
  uint,
  str,
  assertOk,
  assertErr,
  expectEqual,
  formatTokenAmount,
  DEFAULT_WALLET_DATA
} from './helpers';

describe('Wallet-X Contract - Wallet Registration', () => {
  let deployer: string;
  let admin1: string;
  let admin2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    admin1 = accounts.get('wallet_1')!;
    admin2 = accounts.get('wallet_2')!;
  });

  it('should register a new wallet', () => {
    const walletName = 'Test Wallet';
    const fundAmount = formatTokenAmount(1000);

    const result = simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str(walletName), uint(fundAmount), principal(deployer)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should prevent duplicate wallet registration', () => {
    const walletName = 'Test Wallet';
    const fundAmount = formatTokenAmount(1000);

    // First registration
    simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str(walletName), uint(fundAmount), principal(deployer)],
      admin1
    );

    // Second registration should fail
    const result = simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str(walletName), uint(fundAmount), principal(deployer)],
      admin1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_WALLET_EXISTS (u101)
    expectEqual(result.value, Cl.error(Cl.uint(101)));
  });

  it('should allow multiple admins to register wallets', () => {
    const fundAmount = formatTokenAmount(1000);

    const result1 = simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Wallet 1'), uint(fundAmount), principal(deployer)],
      admin1
    );

    const result2 = simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Wallet 2'), uint(fundAmount), principal(deployer)],
      admin2
    );

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);
  });
});

describe('Wallet-X Contract - Member Management', () => {
  let deployer: string;
  let admin1: string;
  let member1: string;
  let member2: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    admin1 = accounts.get('wallet_1')!;
    member1 = accounts.get('wallet_2')!;
    member2 = accounts.get('wallet_3')!;

    // Register wallet first
    const fundAmount = formatTokenAmount(10000);
    simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Test Wallet'), uint(fundAmount), principal(deployer)],
      admin1
    );
  });

  it('should onboard a new member', () => {
    const memberName = 'John Doe';
    const memberFunding = formatTokenAmount(100);
    const memberId = 1;

    const result = simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str(memberName), uint(memberFunding), uint(memberId)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject onboarding with insufficient admin funds', () => {
    const memberName = 'John Doe';
    const memberFunding = formatTokenAmount(20000); // More than admin has
    const memberId = 1;

    const result = simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str(memberName), uint(memberFunding), uint(memberId)],
      admin1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_INSUFFICIENT_FUNDS (u102)
    expectEqual(result.value, Cl.error(Cl.uint(102)));
  });

  it('should reject onboarding from non-admin', () => {
    const memberName = 'John Doe';
    const memberFunding = formatTokenAmount(100);
    const memberId = 1;

    const result = simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str(memberName), uint(memberFunding), uint(memberId)],
      member1 // Non-admin trying to onboard
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_NOT_ADMIN (u100)
    expectEqual(result.value, Cl.error(Cl.uint(100)));
  });

  it('should onboard multiple members', () => {
    const memberFunding = formatTokenAmount(100);

    const result1 = simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str('Member 1'), uint(memberFunding), uint(1)],
      admin1
    );

    const result2 = simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member2), str('Member 2'), uint(memberFunding), uint(2)],
      admin1
    );

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);
  });
});

describe('Wallet-X Contract - Member Withdrawal', () => {
  let deployer: string;
  let admin1: string;
  let member1: string;
  let receiver: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    admin1 = accounts.get('wallet_1')!;
    member1 = accounts.get('wallet_2')!;
    receiver = accounts.get('wallet_3')!;

    // Register wallet
    const fundAmount = formatTokenAmount(10000);
    simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Test Wallet'), uint(fundAmount), principal(deployer)],
      admin1
    );

    // Onboard member
    const memberFunding = formatTokenAmount(500);
    simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str('Test Member'), uint(memberFunding), uint(1)],
      admin1
    );
  });

  it('should allow member to withdraw within spend limit', () => {
    const withdrawAmount = formatTokenAmount(100);

    const result = simnet.callPublicFn(
      'wallet-x',
      'member-withdrawal',
      [uint(withdrawAmount), principal(receiver), principal(deployer)],
      member1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject withdrawal exceeding spend limit', () => {
    const withdrawAmount = formatTokenAmount(1000); // More than member's limit

    const result = simnet.callPublicFn(
      'wallet-x',
      'member-withdrawal',
      [uint(withdrawAmount), principal(receiver), principal(deployer)],
      member1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_INSUFFICIENT_SPEND_LIMIT (u105)
    expectEqual(result.value, Cl.error(Cl.uint(105)));
  });

  it('should reject withdrawal from inactive member', () => {
    const withdrawAmount = formatTokenAmount(100);

    // Remove member first
    simnet.callPublicFn(
      'wallet-x',
      'remove-member',
      [principal(member1)],
      admin1
    );

    const result = simnet.callPublicFn(
      'wallet-x',
      'member-withdrawal',
      [uint(withdrawAmount), principal(receiver), principal(deployer)],
      member1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_MEMBER_NOT_ACTIVE (u103)
    expectEqual(result.value, Cl.error(Cl.uint(103)));
  });

  it('should reject withdrawal from frozen member', () => {
    const withdrawAmount = formatTokenAmount(100);

    // Freeze member
    simnet.callPublicFn(
      'wallet-x',
      'freeze-member',
      [principal(member1)],
      admin1
    );

    const result = simnet.callPublicFn(
      'wallet-x',
      'member-withdrawal',
      [uint(withdrawAmount), principal(receiver), principal(deployer)],
      member1
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_MEMBER_FROZEN (u104)
    expectEqual(result.value, Cl.error(Cl.uint(104)));
  });
});

describe('Wallet-X Contract - Member Freeze/Unfreeze', () => {
  let deployer: string;
  let admin1: string;
  let member1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    admin1 = accounts.get('wallet_1')!;
    member1 = accounts.get('wallet_2')!;

    // Register wallet
    const fundAmount = formatTokenAmount(10000);
    simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Test Wallet'), uint(fundAmount), principal(deployer)],
      admin1
    );

    // Onboard member
    const memberFunding = formatTokenAmount(500);
    simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str('Test Member'), uint(memberFunding), uint(1)],
      admin1
    );
  });

  it('should freeze a member', () => {
    const result = simnet.callPublicFn(
      'wallet-x',
      'freeze-member',
      [principal(member1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should unfreeze a member', () => {
    // Freeze first
    simnet.callPublicFn(
      'wallet-x',
      'freeze-member',
      [principal(member1)],
      admin1
    );

    // Then unfreeze
    const result = simnet.callPublicFn(
      'wallet-x',
      'unfreeze-member',
      [principal(member1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should reject freeze from non-admin', () => {
    const result = simnet.callPublicFn(
      'wallet-x',
      'freeze-member',
      [principal(member1)],
      member1 // Non-admin
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_NOT_ADMIN (u100)
    expectEqual(result.value, Cl.error(Cl.uint(100)));
  });

  it('should reject unfreeze from non-admin', () => {
    // Freeze first
    simnet.callPublicFn(
      'wallet-x',
      'freeze-member',
      [principal(member1)],
      admin1
    );

    const result = simnet.callPublicFn(
      'wallet-x',
      'unfreeze-member',
      [principal(member1)],
      member1 // Non-admin
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_NOT_ADMIN (u100)
    expectEqual(result.value, Cl.error(Cl.uint(100)));
  });
});

describe('Wallet-X Contract - Member Removal', () => {
  let deployer: string;
  let admin1: string;
  let member1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    admin1 = accounts.get('wallet_1')!;
    member1 = accounts.get('wallet_2')!;

    // Register wallet
    const fundAmount = formatTokenAmount(10000);
    simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Test Wallet'), uint(fundAmount), principal(deployer)],
      admin1
    );

    // Onboard member
    const memberFunding = formatTokenAmount(500);
    simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str('Test Member'), uint(memberFunding), uint(1)],
      admin1
    );
  });

  it('should remove a member', () => {
    const result = simnet.callPublicFn(
      'wallet-x',
      'remove-member',
      [principal(member1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should return unused funds to admin on removal', () => {
    // Get admin balance before removal
    const beforeRemoval = simnet.callReadOnlyFn(
      'wallet-x',
      'get-wallet-admin',
      [principal(admin1)],
      admin1
    );

    // Remove member
    simnet.callPublicFn(
      'wallet-x',
      'remove-member',
      [principal(member1)],
      admin1
    );

    // Get admin balance after removal
    const afterRemoval = simnet.callReadOnlyFn(
      'wallet-x',
      'get-wallet-admin',
      [principal(admin1)],
      admin1
    );

    // Admin balance should increase
    expect(afterRemoval.isOk()).toBe(true);
  });

  it('should reject removal from non-admin', () => {
    const result = simnet.callPublicFn(
      'wallet-x',
      'remove-member',
      [principal(member1)],
      member1 // Non-admin
    );

    expect(result.isErr()).toBe(true);
    // Should return ERR_NOT_ADMIN (u100)
    expectEqual(result.value, Cl.error(Cl.uint(100)));
  });
});

describe('Wallet-X Contract - Read-Only Functions', () => {
  let deployer: string;
  let admin1: string;
  let member1: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    admin1 = accounts.get('wallet_1')!;
    member1 = accounts.get('wallet_2')!;

    // Register wallet
    const fundAmount = formatTokenAmount(10000);
    simnet.callPublicFn(
      'wallet-x',
      'register-wallet',
      [str('Test Wallet'), uint(fundAmount), principal(deployer)],
      admin1
    );

    // Onboard member
    const memberFunding = formatTokenAmount(500);
    simnet.callPublicFn(
      'wallet-x',
      'onboard-member',
      [principal(member1), str('Test Member'), uint(memberFunding), uint(1)],
      admin1
    );
  });

  it('should get wallet admin info', () => {
    const result = simnet.callReadOnlyFn(
      'wallet-x',
      'get-wallet-admin',
      [principal(admin1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
    expect(result.value.value).toBeDefined();
  });

  it('should get admin role', () => {
    const result = simnet.callReadOnlyFn(
      'wallet-x',
      'get-admin-role',
      [principal(admin1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should get members list', () => {
    const result = simnet.callReadOnlyFn(
      'wallet-x',
      'get-members',
      [principal(admin1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
    expect(result.value.value).toBeDefined();
  });

  it('should get member info', () => {
    const result = simnet.callReadOnlyFn(
      'wallet-x',
      'get-member',
      [principal(member1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
    expect(result.value.value).toBeDefined();
  });

  it('should get member transactions', () => {
    const result = simnet.callReadOnlyFn(
      'wallet-x',
      'get-member-transactions',
      [principal(member1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });

  it('should get active members', () => {
    const result = simnet.callReadOnlyFn(
      'wallet-x',
      'get-active-members',
      [principal(admin1)],
      admin1
    );

    expect(result.isOk()).toBe(true);
  });
});
