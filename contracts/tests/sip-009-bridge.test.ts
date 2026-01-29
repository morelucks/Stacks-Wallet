import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import fc from 'fast-check';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;

describe('SIP-009 Bridge Contract Tests', () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  describe('Bridge Request Initiation', () => {
    it('should create bridge request with valid parameters', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'initiate-bridge-request',
        [Cl.uint(tokenId), Cl.stringAscii(targetChain), Cl.stringAscii(targetAddress)],
        wallet1
      );

      expect(result.result).toBeOk(Cl.uint(1));
    });

    it('should reject bridge request for invalid chain', () => {
      const tokenId = 1;
      const targetChain = 'invalid-chain';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      const result = simnet.callPublicFn(
        'sip-009-bridge',
        'initiate-bridge-request',
        [Cl.uint(tokenId), Cl.stringAscii(targetChain), Cl.stringAscii(targetAddress)],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(403)); // ERR-INVALID-CHAIN
    });
  });

  describe('Property-Based Tests', () => {
    it('Property 1: Bridge request state transitions', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 1000000 }), // token-id
        fc.constantFrom('ethereum', 'polygon', 'arbitrum', 'optimism'), // target-chain
        fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s), // target-address
        (tokenId, targetChain, targetAddress) => {
          const result = simnet.callPublicFn(
            'sip-009-bridge',
            'initiate-bridge-request',
            [Cl.uint(tokenId), Cl.stringAscii(targetChain), Cl.stringAscii(targetAddress)],
            wallet1
          );

          if (result.result.type === 'ok') {
            const requestId = result.result.value;
            
            // Verify request was created with correct state
            const request = simnet.callReadOnlyFn(
              'sip-009-bridge',
              'get-bridge-request',
              [requestId],
              wallet1
            );

            expect(request.result).toBeSome();
            const requestData = request.result.value;
            expect(requestData['token-id']).toStrictEqual(Cl.uint(tokenId));
            expect(requestData['target-chain']).toStrictEqual(Cl.stringAscii(targetChain));
            expect(requestData['status']).toStrictEqual(Cl.stringAscii('pending'));
          }
        }
      ), { numRuns: 100 });
    });

    it('Property 2: Fee calculation consistency', () => {
      fc.assert(fc.property(
        fc.constantFrom('ethereum', 'polygon', 'arbitrum', 'optimism'),
        (targetChain) => {
          const chainConfig = simnet.callReadOnlyFn(
            'sip-009-bridge',
            'get-chain-config',
            [Cl.stringAscii(targetChain)],
            deployer
          );

          expect(chainConfig.result).toBeSome();
          const config = chainConfig.result.value;
          const expectedFee = config['bridge-fee'];

          // Verify fee is applied correctly in bridge request
          const tokenId = 1;
          const targetAddress = '0x1234567890123456789012345678901234567890';

          const initialBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] || 0;
          
          const result = simnet.callPublicFn(
            'sip-009-bridge',
            'initiate-bridge-request',
            [Cl.uint(tokenId), Cl.stringAscii(targetChain), Cl.stringAscii(targetAddress)],
            wallet1
          );

          if (result.result.type === 'ok') {
            const finalBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] || 0;
            const feeCharged = initialBalance - finalBalance;
            expect(feeCharged).toBe(Number(expectedFee.value));
          }
        }
      ), { numRuns: 50 });
    });
  });
});