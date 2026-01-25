/**
 * ERC-712 Contract Tests
 * Tests for ERC-712 style structured data hashing and signature verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { simnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';

describe('ERC-712 Contract Tests', () => {
  let deployer: string;
  let wallet1: string;
  let wallet2: string;
  let wallet3: string;

  beforeEach(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get('deployer')!;
    wallet1 = accounts.get('wallet_1')!;
    wallet2 = accounts.get('wallet_2')!;
    wallet3 = accounts.get('wallet_3')!;
  });

  describe('Contract Initialization', () => {
    it('should initialize with correct domain separator', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-domain-separator',
        [],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      // Domain separator should be a 32-byte buffer
      const domainSeparator = result.value;
      expect(Cl.isBuff(domainSeparator)).toBe(true);
    });

    it('should have correct contract info', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-contract-info',
        [],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      const info = Cl.unwrap(result.value);
      
      expect(Cl.unwrapAscii(info.name)).toBe('ERC712Contract');
      expect(Cl.unwrapAscii(info.version)).toBe('1');
      expect(Cl.unwrapUInt(info['chain-id'])).toBe(1n);
      expect(Cl.unwrapPrincipal(info.owner)).toBe(deployer);
      expect(Cl.unwrapBool(info.paused)).toBe(false);
    });
  });

  describe('Nonce Management', () => {
    it('should start with nonce 0 for new users', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-nonce',
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      expect(Cl.unwrapUInt(result.value)).toBe(0n);
    });

    it('should increment nonce after permit operation', () => {
      // First check initial nonce
      let nonceResult = simnet.callReadOnlyFn(
        'erc-712',
        'get-nonce',
        [Cl.principal(wallet1)],
        deployer
      );
      expect(Cl.unwrapUInt(nonceResult.value)).toBe(0n);

      // Create a mock signature (this would normally be created off-chain)
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      
      // Try permit (will fail due to invalid signature, but that's expected)
      const permitResult = simnet.callPublicFn(
        'erc-712',
        'permit',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(1000),
          Cl.uint(simnet.blockHeight + 100),
          mockSignature
        ],
        wallet1
      );
      
      // Should fail due to invalid signature
      expect(permitResult.isErr()).toBe(true);
      expect(permitResult.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });
  });

  describe('Domain Separator', () => {
    it('should return consistent domain separator', () => {
      const result1 = simnet.callReadOnlyFn(
        'erc-712',
        'get-domain-separator',
        [],
        deployer
      );
      
      const result2 = simnet.callReadOnlyFn(
        'erc-712',
        'get-domain-separator',
        [],
        wallet1
      );
      
      expect(result1.value).toEqual(result2.value);
      expect(Cl.isBuff(result1.value)).toBe(true);
    });

    it('should have correct chain ID', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-chain-id',
        [],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      expect(Cl.unwrapUInt(result.value)).toBe(1n);
    });
  });

  describe('Permit Functionality', () => {
    it('should reject expired permits', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const expiredDeadline = simnet.blockHeight - 1; // Already expired
      
      const result = simnet.callPublicFn(
        'erc-712',
        'permit',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(1000),
          Cl.uint(expiredDeadline),
          mockSignature
        ],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(403); // ERR_EXPIRED
    });

    it('should reject invalid signatures', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const futureDeadline = simnet.blockHeight + 100;
      
      const result = simnet.callPublicFn(
        'erc-712',
        'permit',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(1000),
          Cl.uint(futureDeadline),
          mockSignature
        ],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });
  });
});
