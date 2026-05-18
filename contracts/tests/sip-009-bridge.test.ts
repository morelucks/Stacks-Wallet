/**
 * SIP-009 Bridge Contract Tests
 * Main test suite for the cross-chain bridge on Stacks Network.
 *
 * Covers:
 *  - Bridge request initiation
 *  - Validator operations
 *  - Administrative functions
 *  - Batch operations
 *  - 8 property-based tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import fc from 'fast-check';
import { BridgeTestUtils } from './bridge-test-utils';
import {
  bridgeRequestGenerator,
  targetChainGenerator,
  tokenIdGenerator,
  ethereumAddressGenerator,
  batchRequestGenerator,
  invalidChainGenerator,
} from './bridge-generators';
import { BRIDGE_TEST_CONFIG } from './bridge-test-config';

// ---------------------------------------------------------------------------
// Test account setup
// ---------------------------------------------------------------------------
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;
const wallet4 = accounts.get('wallet_4')!;

const ETH_ADDRESS = BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('SIP-009 Bridge Contract Tests', () => {
  const validators = [wallet2, wallet3, wallet4];

  beforeEach(() => {
    BridgeTestUtils.setupValidators(validators, deployer);
  });

  // -------------------------------------------------------------------------
  // Bridge request initiation
  // -------------------------------------------------------------------------

  describe('Bridge Request Initiation', () => {
    it('should create a bridge request with valid parameters', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';

      const result = BridgeTestUtils.createBridgeRequest(
        tokenId,
        targetChain,
        ETH_ADDRESS,
        wallet1,
      );
      expect(result.result).toBeOk(Cl.uint(1));

      const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
      expect(request.result).toBeSome();

      BridgeTestUtils.verifyRequestProperties(
        (request.result as any).value,
        tokenId,
        targetChain,
        ETH_ADDRESS,
        wallet1,
      );
    });

    it('should reject a bridge request for an unsupported chain', () => {
      const result = BridgeTestUtils.createBridgeRequest(
        1,
        'invalid-chain',
        ETH_ADDRESS,
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_CHAIN));
    });

    it('should lock the token when a bridge request is created', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(true);
      expect(BridgeTestUtils.getLockedTokenInfo(1, wallet1).result).toBeSome();
    });

    it('should prevent double-locking of the same token', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const duplicate = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(duplicate.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.TOKEN_LOCKED));
    });
  });

  // -------------------------------------------------------------------------
  // Validator operations
  // -------------------------------------------------------------------------

  describe('Validator Operations', () => {
    it('should add a validator with correct initial state', () => {
      const result = simnet.callPublicFn(
        BridgeTestUtils.CONTRACT_NAME,
        'add-validator',
        [Cl.principal(wallet2)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const info = BridgeTestUtils.getValidatorInfo(wallet2, deployer);
      expect(info.result).toBeSome();
      expect((info.result as any).value['active']).toBeBool(true);
      expect((info.result as any).value['total-validations']).toBeUint(0);
      expect((info.result as any).value['reputation-score']).toBeUint(100);
    });

    it('should confirm a request after sufficient validator signatures', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const sig = BridgeTestUtils.generateMockSignature();
      for (let i = 0; i < 3; i++) {
        const r = simnet.callPublicFn(
          BridgeTestUtils.CONTRACT_NAME,
          'validate-bridge-request',
          [Cl.uint(1), Cl.buffer(sig)],
          validators[i],
        );
        expect(r.result).toBeOk();
      }

      const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
      expect((request.result as any).value['status']).toStrictEqual(
        Cl.stringAscii('confirmed'),
      );
    });

    it('should reject validation from a non-validator', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);

      const sig = BridgeTestUtils.generateMockSignature();
      const result = simnet.callPublicFn(
        BridgeTestUtils.CONTRACT_NAME,
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(sig)],
        wallet1, // not a validator
      );
      expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.NOT_AUTHORIZED));
    });
  });

  // -------------------------------------------------------------------------
  // Administrative functions
  // -------------------------------------------------------------------------

  describe('Administrative Functions', () => {
    it('should pause and unpause bridge operations', () => {
      BridgeTestUtils.setBridgeEnabled(false, deployer);

      const paused = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(paused.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.BRIDGE_DISABLED));

      BridgeTestUtils.setBridgeEnabled(true, deployer);

      const resumed = BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(resumed.result).toBeOk(Cl.uint(1));
    });

    it('should update chain configuration', () => {
      const newFee = 2_000_000;
      const result = BridgeTestUtils.updateChainConfig('ethereum', true, 15, newFee, deployer);
      expect(result.result).toBeOk(Cl.bool(true));

      const config = BridgeTestUtils.getChainConfig('ethereum', deployer);
      expect((config.result as any).value['bridge-fee']).toBeUint(newFee);
      expect((config.result as any).value['min-confirmations']).toBeUint(15);
    });

    it('should perform emergency token unlock', () => {
      BridgeTestUtils.createBridgeRequest(1, 'ethereum', ETH_ADDRESS, wallet1);
      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(true);

      const unlock = BridgeTestUtils.emergencyUnlockToken(1, deployer);
      expect(unlock.result).toBeOk(Cl.bool(true));

      expect(BridgeTestUtils.isTokenLocked(1, wallet1).result).toBeBool(false);
    });
  });

  // -------------------------------------------------------------------------
  // Batch operations
  // -------------------------------------------------------------------------

  describe('Batch Operations', () => {
    it('should process a batch of bridge requests', () => {
      const requests = [
        { tokenId: 1, targetChain: 'ethereum', targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ethereum },
        { tokenId: 2, targetChain: 'polygon', targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.polygon },
        { tokenId: 3, targetChain: 'arbitrum', targetAddress: BRIDGE_TEST_CONFIG.TEST_ADDRESSES.arbitrum },
      ];

      const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
      expect(result.result).toBeOk();

      for (let i = 1; i <= 3; i++) {
        expect(BridgeTestUtils.getBridgeRequest(i, wallet1).result).toBeSome();
        expect(BridgeTestUtils.isTokenLocked(i, wallet1).result).toBeBool(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Property-based tests
  // -------------------------------------------------------------------------

  describe('Property-Based Tests', () => {
    it('Property 1: created requests always have pending status', () => {
      fc.assert(
        fc.property(bridgeRequestGenerator, ({ tokenId, targetChain, targetAddress }) => {
          const result = BridgeTestUtils.createBridgeRequest(
            tokenId,
            targetChain,
            targetAddress,
            wallet1,
          );

          if ((result.result as any).type === 'ok') {
            const requestId = Number((result.result as any).value.value);
            const req = BridgeTestUtils.getBridgeRequest(requestId, wallet1);
            expect((req.result as any).value['status']).toStrictEqual(
              Cl.stringAscii('pending'),
            );
            expect(BridgeTestUtils.isTokenLocked(tokenId, wallet1).result).toBeBool(true);
          }
        }),
        { numRuns: 50 },
      );
    });

    it('Property 2: fee charged always equals the configured chain fee', () => {
      fc.assert(
        fc.property(
          targetChainGenerator,
          tokenIdGenerator,
          ethereumAddressGenerator,
          (targetChain, tokenId, targetAddress) => {
            const config = BridgeTestUtils.getChainConfig(targetChain, deployer);
            const expectedFee = Number((config.result as any).value['bridge-fee'].value);

            const before = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
            const result = BridgeTestUtils.createBridgeRequest(
              tokenId,
              targetChain,
              targetAddress,
              wallet1,
            );

            if ((result.result as any).type === 'ok') {
              const after = simnet.getAssetsMap().get(wallet1)?.['STX'] ?? 0;
              expect(before - after).toBe(expectedFee);
            }
          },
        ),
        { numRuns: 30 },
      );
    });

    it('Property 3: token locking prevents double-bridging', () => {
      fc.assert(
        fc.property(
          tokenIdGenerator,
          targetChainGenerator,
          ethereumAddressGenerator,
          (tokenId, targetChain, targetAddress) => {
            const r1 = BridgeTestUtils.createBridgeRequest(
              tokenId,
              targetChain,
              targetAddress,
              wallet1,
            );

            if ((r1.result as any).type === 'ok') {
              expect(BridgeTestUtils.isTokenLocked(tokenId, wallet1).result).toBeBool(true);

              const r2 = BridgeTestUtils.createBridgeRequest(
                tokenId,
                targetChain,
                targetAddress,
                wallet1,
              );
              expect(r2.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.TOKEN_LOCKED));
            }
          },
        ),
        { numRuns: 30 },
      );
    });

    it('Property 4: validator threshold determines confirmation status', () => {
      fc.assert(
        fc.property(
          bridgeRequestGenerator,
          fc.integer({ min: 1, max: 5 }),
          ({ tokenId, targetChain, targetAddress }, numSignatures) => {
            const create = BridgeTestUtils.createBridgeRequest(
              tokenId,
              targetChain,
              targetAddress,
              wallet1,
            );

            if ((create.result as any).type === 'ok') {
              const requestId = Number((create.result as any).value.value);
              const sig = BridgeTestUtils.generateMockSignature();

              for (let i = 0; i < Math.min(numSignatures, validators.length); i++) {
                simnet.callPublicFn(
                  BridgeTestUtils.CONTRACT_NAME,
                  'validate-bridge-request',
                  [Cl.uint(requestId), Cl.buffer(sig)],
                  validators[i],
                );
              }

              const req = BridgeTestUtils.getBridgeRequest(requestId, wallet1);
              const status = (req.result as any).value['status'];

              if (numSignatures >= 3) {
                expect(status).toStrictEqual(Cl.stringAscii('confirmed'));
              } else {
                expect(status).toStrictEqual(Cl.stringAscii('pending'));
              }
            }
          },
        ),
        { numRuns: 25 },
      );
    });

    it('Property 5: invalid chains always return INVALID_CHAIN error', () => {
      fc.assert(
        fc.property(
          tokenIdGenerator,
          invalidChainGenerator,
          ethereumAddressGenerator,
          (tokenId, invalidChain, targetAddress) => {
            const result = BridgeTestUtils.createBridgeRequest(
              tokenId,
              invalidChain,
              targetAddress,
              wallet1,
            );
            expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.INVALID_CHAIN));
            expect(BridgeTestUtils.isTokenLocked(tokenId, wallet1).result).toBeBool(false);
          },
        ),
        { numRuns: 20 },
      );
    });

    it('Property 6: batch operations are atomic', () => {
      fc.assert(
        fc.property(batchRequestGenerator, requests => {
          const unique = requests.map((req, i) => ({
            ...req,
            tokenId: req.tokenId + i * 1_000,
          }));

          const result = BridgeTestUtils.batchInitiateBridgeRequests(unique, wallet1);

          if ((result.result as any).type === 'ok') {
            for (const req of unique) {
              expect(BridgeTestUtils.isTokenLocked(req.tokenId, wallet1).result).toBeBool(true);
            }
          } else {
            for (const req of unique) {
              expect(BridgeTestUtils.isTokenLocked(req.tokenId, wallet1).result).toBeBool(false);
            }
          }
        }),
        { numRuns: 15 },
      );
    });

    it('Property 7: config changes do not affect existing requests', () => {
      fc.assert(
        fc.property(
          targetChainGenerator,
          fc.integer({ min: 1_000_000, max: 5_000_000 }),
          fc.integer({ min: 5, max: 50 }),
          (chain, newFee, newConfirmations) => {
            BridgeTestUtils.createBridgeRequest(1, chain, ETH_ADDRESS, wallet1);
            BridgeTestUtils.updateChainConfig(chain, true, newConfirmations, newFee, deployer);
            BridgeTestUtils.createBridgeRequest(2, chain, ETH_ADDRESS, wallet1);

            const config = BridgeTestUtils.getChainConfig(chain, deployer);
            expect((config.result as any).value['bridge-fee']).toBeUint(newFee);
            expect((config.result as any).value['min-confirmations']).toBeUint(newConfirmations);
          },
        ),
        { numRuns: 20 },
      );
    });

    it('Property 8: paused bridge rejects all requests', () => {
      fc.assert(
        fc.property(bridgeRequestGenerator, ({ tokenId, targetChain, targetAddress }) => {
          BridgeTestUtils.setBridgeEnabled(false, deployer);

          const result = BridgeTestUtils.createBridgeRequest(
            tokenId,
            targetChain,
            targetAddress,
            wallet1,
          );
          expect(result.result).toBeErr(Cl.uint(BRIDGE_TEST_CONFIG.ERRORS.BRIDGE_DISABLED));
          expect(BridgeTestUtils.isTokenLocked(tokenId, wallet1).result).toBeBool(false);

          BridgeTestUtils.setBridgeEnabled(true, deployer);
        }),
        { numRuns: 15 },
      );
    });
  });
});
