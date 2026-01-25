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
});
