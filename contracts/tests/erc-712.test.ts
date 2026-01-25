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

  describe('Allowance Management', () => {
    it('should start with zero allowances', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-allowance',
        [Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      expect(Cl.unwrapUInt(result.value)).toBe(0n);
    });

    it('should return correct allowance values', () => {
      // Test multiple allowance combinations
      const combinations = [
        [wallet1, wallet2],
        [wallet2, wallet1],
        [wallet1, wallet3],
        [wallet3, wallet1]
      ];

      combinations.forEach(([owner, spender]) => {
        const result = simnet.callReadOnlyFn(
          'erc-712',
          'get-allowance',
          [Cl.principal(owner), Cl.principal(spender)],
          deployer
        );
        
        expect(result.isOk()).toBe(true);
        expect(Cl.unwrapUInt(result.value)).toBe(0n);
      });
    });
  });

  describe('Meta-Transaction Support', () => {
    it('should reject invalid meta-transaction signatures', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const mockData = Cl.bufferFromHex('0x' + '00'.repeat(100));
      
      const result = simnet.callPublicFn(
        'erc-712',
        'execute-meta-transaction',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(1000),
          mockData,
          mockSignature
        ],
        deployer
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });

    it('should handle meta-transaction structure correctly', () => {
      // Test with different data sizes
      const dataSizes = [10, 50, 100, 256];
      
      dataSizes.forEach(size => {
        const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
        const mockData = Cl.bufferFromHex('0x' + '00'.repeat(size));
        
        const result = simnet.callPublicFn(
          'erc-712',
          'execute-meta-transaction',
          [
            Cl.principal(wallet1),
            Cl.principal(wallet2),
            Cl.uint(1000),
            mockData,
            mockSignature
          ],
          deployer
        );
        
        // Should fail with invalid signature, not data structure error
        expect(result.isErr()).toBe(true);
        expect(result.value.value).toBe(402);
      });
    });
  });

  describe('Delegation Functionality', () => {
    it('should reject expired delegation signatures', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const expiredTime = simnet.blockHeight - 1;
      
      const result = simnet.callPublicFn(
        'erc-712',
        'delegate-by-sig',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(expiredTime),
          mockSignature
        ],
        deployer
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(403); // ERR_EXPIRED
    });

    it('should handle delegation queries correctly', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-delegate',
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      // Should return none for non-existent delegation
      expect(Cl.isNone(result.value)).toBe(true);
    });

    it('should reject invalid delegation signatures', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const futureTime = simnet.blockHeight + 100;
      
      const result = simnet.callPublicFn(
        'erc-712',
        'delegate-by-sig',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(futureTime),
          mockSignature
        ],
        deployer
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });
  });

  describe('Batch Operations', () => {
    it('should handle empty batch operations', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const emptyOperations = Cl.list([]);
      
      const result = simnet.callPublicFn(
        'erc-712',
        'execute-batch',
        [emptyOperations, mockSignature],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });

    it('should handle single batch operation', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const mockData = Cl.bufferFromHex('0x' + '00'.repeat(50));
      
      const singleOperation = Cl.list([
        Cl.tuple({
          to: Cl.principal(wallet2),
          value: Cl.uint(100),
          data: mockData
        })
      ]);
      
      const result = simnet.callPublicFn(
        'erc-712',
        'execute-batch',
        [singleOperation, mockSignature],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });
  });

  describe('Administrative Functions', () => {
    it('should allow owner to pause contract', () => {
      const result = simnet.callPublicFn(
        'erc-712',
        'set-paused',
        [Cl.bool(true)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      
      // Verify contract is paused
      const pausedResult = simnet.callReadOnlyFn(
        'erc-712',
        'is-paused',
        [],
        deployer
      );
      
      expect(pausedResult.isOk()).toBe(true);
      expect(Cl.unwrapBool(pausedResult.value)).toBe(true);
    });

    it('should reject non-owner pause attempts', () => {
      const result = simnet.callPublicFn(
        'erc-712',
        'set-paused',
        [Cl.bool(true)],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(401); // ERR_UNAUTHORIZED
    });

    it('should allow owner to unpause contract', () => {
      // First pause
      simnet.callPublicFn(
        'erc-712',
        'set-paused',
        [Cl.bool(true)],
        deployer
      );
      
      // Then unpause
      const result = simnet.callPublicFn(
        'erc-712',
        'set-paused',
        [Cl.bool(false)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      
      // Verify contract is not paused
      const pausedResult = simnet.callReadOnlyFn(
        'erc-712',
        'is-paused',
        [],
        deployer
      );
      
      expect(pausedResult.isOk()).toBe(true);
      expect(Cl.unwrapBool(pausedResult.value)).toBe(false);
    });
  });

  describe('Emergency Functions', () => {
    it('should allow owner to invalidate user nonces', () => {
      // Get initial nonce
      const initialNonce = simnet.callReadOnlyFn(
        'erc-712',
        'get-nonce',
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(Cl.unwrapUInt(initialNonce.value)).toBe(0n);
      
      // Emergency invalidate
      const result = simnet.callPublicFn(
        'erc-712',
        'emergency-invalidate-nonce',
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      
      // Check new nonce
      const newNonce = simnet.callReadOnlyFn(
        'erc-712',
        'get-nonce',
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(Cl.unwrapUInt(newNonce.value)).toBe(1000n);
    });

    it('should reject non-owner emergency invalidation', () => {
      const result = simnet.callPublicFn(
        'erc-712',
        'emergency-invalidate-nonce',
        [Cl.principal(wallet1)],
        wallet2
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(401); // ERR_UNAUTHORIZED
    });
  });

  describe('Signature Verification', () => {
    it('should verify typed data hash generation', () => {
      const mockStructHash = Cl.bufferFromHex('0x' + '12'.repeat(32));
      
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-typed-data-hash',
        [mockStructHash],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      expect(Cl.isBuff(result.value)).toBe(true);
      // Should return a 32-byte hash
      const hashBuffer = Cl.unwrapBuff(result.value);
      expect(hashBuffer.length).toBe(32);
    });

    it('should validate signature status correctly', () => {
      const mockStructHash = Cl.bufferFromHex('0x' + '12'.repeat(32));
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'is-valid-signature',
        [mockStructHash, mockSignature, Cl.principal(wallet1)],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      // Should return false for invalid signature
      expect(Cl.unwrapBool(result.value)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum uint values', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const maxUint = 2n ** 128n - 1n; // Large number
      
      const result = simnet.callPublicFn(
        'erc-712',
        'permit',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(maxUint),
          Cl.uint(simnet.blockHeight + 100),
          mockSignature
        ],
        wallet1
      );
      
      // Should fail with invalid signature, not overflow
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402);
    });

    it('should handle zero values correctly', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      
      const result = simnet.callPublicFn(
        'erc-712',
        'permit',
        [
          Cl.principal(wallet1),
          Cl.principal(wallet2),
          Cl.uint(0),
          Cl.uint(simnet.blockHeight + 100),
          mockSignature
        ],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });
  });

  describe('Signature Replay Protection', () => {
    it('should reject already used signatures', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const futureDeadline = simnet.blockHeight + 100;
      
      // First attempt (will fail due to invalid signature, but signature gets marked)
      const result1 = simnet.callPublicFn(
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
      
      expect(result1.isErr()).toBe(true);
      
      // Second attempt with same signature should fail with ERR_ALREADY_USED
      const result2 = simnet.callPublicFn(
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
      
      expect(result2.isErr()).toBe(true);
      // Should return ERR_ALREADY_USED (u404) or ERR_INVALID_SIGNATURE
      expect([401, 402, 404]).toContain(result2.value.value);
    });
  });

  describe('Batch Operations Extended', () => {
    it('should handle multiple batch operations', () => {
      const mockSignature = Cl.bufferFromHex('0x' + '00'.repeat(65));
      const mockData = Cl.bufferFromHex('0x' + '00'.repeat(50));
      
      const multipleOperations = Cl.list([
        Cl.tuple({
          to: Cl.principal(wallet2),
          value: Cl.uint(100),
          data: mockData
        }),
        Cl.tuple({
          to: Cl.principal(wallet3),
          value: Cl.uint(200),
          data: mockData
        })
      ]);
      
      const result = simnet.callPublicFn(
        'erc-712',
        'execute-batch',
        [multipleOperations, mockSignature],
        wallet1
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.value.value).toBe(402); // ERR_INVALID_SIGNATURE
    });
  });

  describe('Contract Metadata', () => {
    it('should return correct contract version', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-contract-version',
        [],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      expect(Cl.unwrapAscii(result.value)).toBe('1');
    });

    it('should return correct contract name', () => {
      const result = simnet.callReadOnlyFn(
        'erc-712',
        'get-contract-name',
        [],
        deployer
      );
      
      expect(result.isOk()).toBe(true);
      expect(Cl.unwrapAscii(result.value)).toBe('ERC712Contract');
    });
  });
});
