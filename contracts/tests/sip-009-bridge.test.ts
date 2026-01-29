import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import fc from 'fast-check';
import { BridgeTestUtils } from './bridge-test-utils';
import { 
  bridgeRequestGenerator, 
  targetChainGenerator, 
  tokenIdGenerator,
  ethereumAddressGenerator,
  signatureGenerator,
  validatorGenerator,
  batchRequestGenerator,
  invalidChainGenerator,
  toClarityValue
} from './bridge-generators';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;
const wallet4 = accounts.get('wallet_4')!;

describe('SIP-009 Bridge Contract Tests', () => {
  const validators = [wallet2, wallet3, wallet4];

  beforeEach(() => {
    // Setup validators for each test
    BridgeTestUtils.setupValidators(validators, deployer);
  });

  describe('Bridge Request Initiation', () => {
    it('should create bridge request with valid parameters', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      const result = BridgeTestUtils.createBridgeRequest(
        tokenId, targetChain, targetAddress, wallet1
      );

      expect(result.result).toBeOk(Cl.uint(1));
      
      // Verify request was created correctly
      const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
      expect(request.result).toBeSome();
      
      const requestData = request.result.value;
      BridgeTestUtils.verifyRequestProperties(
        requestData, tokenId, targetChain, targetAddress, wallet1
      );
    });

    it('should reject bridge request for invalid chain', () => {
      const tokenId = 1;
      const targetChain = 'invalid-chain';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      const result = BridgeTestUtils.createBridgeRequest(
        tokenId, targetChain, targetAddress, wallet1
      );

      expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.INVALID_CHAIN));
    });

    it('should lock token when bridge request is created', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      BridgeTestUtils.createBridgeRequest(tokenId, targetChain, targetAddress, wallet1);

      const isLocked = BridgeTestUtils.isTokenLocked(tokenId, wallet1);
      expect(isLocked.result).toBeBool(true);

      const lockInfo = BridgeTestUtils.getLockedTokenInfo(tokenId, wallet1);
      expect(lockInfo.result).toBeSome();
    });

    it('should prevent double-locking of tokens', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      // First request should succeed
      const result1 = BridgeTestUtils.createBridgeRequest(
        tokenId, targetChain, targetAddress, wallet1
      );
      expect(result1.result).toBeOk(Cl.uint(1));

      // Second request with same token should fail
      const result2 = BridgeTestUtils.createBridgeRequest(
        tokenId, targetChain, targetAddress, wallet1
      );
      expect(result2.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.TOKEN_LOCKED));
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
  describe('Validator Operations', () => {
    it('should add validators successfully', () => {
      const validator = wallet2;
      const result = simnet.callPublicFn(
        BridgeTestUtils.CONTRACT_NAME,
        'add-validator',
        [Cl.principal(validator)],
        deployer
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const validatorInfo = BridgeTestUtils.getValidatorInfo(validator, deployer);
      expect(validatorInfo.result).toBeSome();
      
      const info = validatorInfo.result.value;
      expect(info['active']).toBeBool(true);
      expect(info['total-validations']).toBeUint(0);
      expect(info['reputation-score']).toBeUint(100);
    });

    it('should validate bridge requests with sufficient signatures', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      // Create bridge request
      const createResult = BridgeTestUtils.createBridgeRequest(
        tokenId, targetChain, targetAddress, wallet1
      );
      expect(createResult.result).toBeOk(Cl.uint(1));

      // Add validator signatures (need 3 for confirmation)
      const signature = BridgeTestUtils.generateMockSignature();
      
      for (let i = 0; i < 3; i++) {
        const result = simnet.callPublicFn(
          BridgeTestUtils.CONTRACT_NAME,
          'validate-bridge-request',
          [Cl.uint(1), Cl.buffer(signature)],
          validators[i]
        );
        expect(result.result).toBeOk();
      }

      // Verify request is confirmed
      const request = BridgeTestUtils.getBridgeRequest(1, wallet1);
      const requestData = request.result.value;
      expect(requestData['status']).toStrictEqual(Cl.stringAscii('confirmed'));
    });

    it('should reject validation from non-validators', () => {
      const tokenId = 1;
      const targetChain = 'ethereum';
      const targetAddress = '0x1234567890123456789012345678901234567890';

      BridgeTestUtils.createBridgeRequest(tokenId, targetChain, targetAddress, wallet1);

      const signature = BridgeTestUtils.generateMockSignature();
      const result = simnet.callPublicFn(
        BridgeTestUtils.CONTRACT_NAME,
        'validate-bridge-request',
        [Cl.uint(1), Cl.buffer(signature)],
        wallet1 // Not a validator
      );

      expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.NOT_AUTHORIZED));
    });
  });

  describe('Administrative Functions', () => {
    it('should pause and unpause bridge operations', () => {
      // Pause bridge
      const pauseResult = BridgeTestUtils.setBridgeEnabled(false, deployer);
      expect(pauseResult.result).toBeOk(Cl.bool(true));

      // Try to create request while paused
      const createResult = BridgeTestUtils.createBridgeRequest(
        1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1
      );
      expect(createResult.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.BRIDGE_DISABLED));

      // Unpause bridge
      const unpauseResult = BridgeTestUtils.setBridgeEnabled(true, deployer);
      expect(unpauseResult.result).toBeOk(Cl.bool(true));

      // Should work again
      const createResult2 = BridgeTestUtils.createBridgeRequest(
        1, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1
      );
      expect(createResult2.result).toBeOk(Cl.uint(1));
    });

    it('should update chain configurations', () => {
      const newFee = 2000000; // 2 STX
      const result = BridgeTestUtils.updateChainConfig(
        'ethereum', true, 15, newFee, deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const config = BridgeTestUtils.getChainConfig('ethereum', deployer);
      expect(config.result).toBeSome();
      
      const configData = config.result.value;
      expect(configData['bridge-fee']).toBeUint(newFee);
      expect(configData['min-confirmations']).toBeUint(15);
    });

    it('should perform emergency token unlock', () => {
      const tokenId = 1;
      
      // Create and lock token
      BridgeTestUtils.createBridgeRequest(
        tokenId, 'ethereum', '0x1234567890123456789012345678901234567890', wallet1
      );

      // Verify token is locked
      expect(BridgeTestUtils.isTokenLocked(tokenId, wallet1).result).toBeBool(true);

      // Emergency unlock
      const unlockResult = BridgeTestUtils.emergencyUnlockToken(tokenId, deployer);
      expect(unlockResult.result).toBeOk(Cl.bool(true));

      // Verify token is unlocked
      expect(BridgeTestUtils.isTokenLocked(tokenId, wallet1).result).toBeBool(false);
    });
  });

  describe('Batch Operations', () => {
    it('should process batch bridge requests', () => {
      const requests = [
        { tokenId: 1, targetChain: 'ethereum', targetAddress: '0x1111111111111111111111111111111111111111' },
        { tokenId: 2, targetChain: 'polygon', targetAddress: '0x2222222222222222222222222222222222222222' },
        { tokenId: 3, targetChain: 'arbitrum', targetAddress: '0x3333333333333333333333333333333333333333' }
      ];

      const result = BridgeTestUtils.batchInitiateBridgeRequests(requests, wallet1);
      expect(result.result).toBeOk();

      // Verify all requests were created
      for (let i = 1; i <= 3; i++) {
        const request = BridgeTestUtils.getBridgeRequest(i, wallet1);
        expect(request.result).toBeSome();
        expect(BridgeTestUtils.isTokenLocked(i, wallet1).result).toBeBool(true);
      }
    });
  });
  describe('Property-Based Tests', () => {
    it('Property 1: Bridge request state transitions', () => {
      fc.assert(fc.property(
        bridgeRequestGenerator,
        (request) => {
          const result = BridgeTestUtils.createBridgeRequest(
            request.tokenId, request.targetChain, request.targetAddress, wallet1
          );

          if (result.result.type === 'ok') {
            const requestId = result.result.value;
            
            // Verify request was created with correct state
            const requestData = BridgeTestUtils.getBridgeRequest(
              Number(requestId.value), wallet1
            );

            expect(requestData.result).toBeSome();
            const data = requestData.result.value;
            
            BridgeTestUtils.verifyRequestProperties(
              data, request.tokenId, request.targetChain, 
              request.targetAddress, wallet1, 'pending'
            );

            // Verify token is locked
            const isLocked = BridgeTestUtils.isTokenLocked(request.tokenId, wallet1);
            expect(isLocked.result).toBeBool(true);
          }
        }
      ), { numRuns: 50 });
    });

    it('Property 2: Fee calculation consistency', () => {
      fc.assert(fc.property(
        targetChainGenerator,
        tokenIdGenerator,
        ethereumAddressGenerator,
        (targetChain, tokenId, targetAddress) => {
          const chainConfig = BridgeTestUtils.getChainConfig(targetChain, deployer);
          expect(chainConfig.result).toBeSome();
          
          const config = chainConfig.result.value;
          const expectedFee = Number(config['bridge-fee'].value);

          const initialBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] || 0;
          
          const result = BridgeTestUtils.createBridgeRequest(
            tokenId, targetChain, targetAddress, wallet1
          );

          if (result.result.type === 'ok') {
            const finalBalance = simnet.getAssetsMap().get(wallet1)?.['STX'] || 0;
            const feeCharged = initialBalance - finalBalance;
            expect(feeCharged).toBe(expectedFee);
          }
        }
      ), { numRuns: 30 });
    });

    it('Property 3: Token locking integrity', () => {
      fc.assert(fc.property(
        tokenIdGenerator,
        targetChainGenerator,
        ethereumAddressGenerator,
        (tokenId, targetChain, targetAddress) => {
          // First request should succeed and lock token
          const result1 = BridgeTestUtils.createBridgeRequest(
            tokenId, targetChain, targetAddress, wallet1
          );

          if (result1.result.type === 'ok') {
            // Token should be locked
            const isLocked = BridgeTestUtils.isTokenLocked(tokenId, wallet1);
            expect(isLocked.result).toBeBool(true);

            // Second request with same token should fail
            const result2 = BridgeTestUtils.createBridgeRequest(
              tokenId, targetChain, targetAddress, wallet1
            );
            expect(result2.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.TOKEN_LOCKED));
          }
        }
      ), { numRuns: 30 });
    });

    it('Property 4: Validator signature thresholds', () => {
      fc.assert(fc.property(
        bridgeRequestGenerator,
        fc.integer({ min: 1, max: 5 }),
        (request, numSignatures) => {
          // Create bridge request
          const createResult = BridgeTestUtils.createBridgeRequest(
            request.tokenId, request.targetChain, request.targetAddress, wallet1
          );

          if (createResult.result.type === 'ok') {
            const requestId = Number(createResult.result.value.value);
            const signature = BridgeTestUtils.generateMockSignature();

            // Add signatures up to numSignatures
            for (let i = 0; i < Math.min(numSignatures, validators.length); i++) {
              simnet.callPublicFn(
                BridgeTestUtils.CONTRACT_NAME,
                'validate-bridge-request',
                [Cl.uint(requestId), Cl.buffer(signature)],
                validators[i]
              );
            }

            // Check if request is confirmed based on threshold (3 signatures needed)
            const requestData = BridgeTestUtils.getBridgeRequest(requestId, wallet1);
            const status = requestData.result.value['status'];

            if (numSignatures >= 3) {
              expect(status).toStrictEqual(Cl.stringAscii('confirmed'));
            } else {
              expect(status).toStrictEqual(Cl.stringAscii('pending'));
            }
          }
        }
      ), { numRuns: 25 });
    });

    it('Property 5: Error handling completeness', () => {
      fc.assert(fc.property(
        tokenIdGenerator,
        invalidChainGenerator,
        ethereumAddressGenerator,
        (tokenId, invalidChain, targetAddress) => {
          const result = BridgeTestUtils.createBridgeRequest(
            tokenId, invalidChain, targetAddress, wallet1
          );

          // Should always fail with invalid chain error
          expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.INVALID_CHAIN));

          // Token should not be locked
          const isLocked = BridgeTestUtils.isTokenLocked(tokenId, wallet1);
          expect(isLocked.result).toBeBool(false);
        }
      ), { numRuns: 20 });
    });

    it('Property 6: Batch operation atomicity', () => {
      fc.assert(fc.property(
        batchRequestGenerator,
        (requests) => {
          // Ensure we have unique token IDs to avoid conflicts
          const uniqueRequests = requests.map((req, index) => ({
            ...req,
            tokenId: req.tokenId + index * 1000
          }));

          const result = BridgeTestUtils.batchInitiateBridgeRequests(
            uniqueRequests, wallet1
          );

          if (result.result.type === 'ok') {
            // All tokens should be locked
            for (const req of uniqueRequests) {
              const isLocked = BridgeTestUtils.isTokenLocked(req.tokenId, wallet1);
              expect(isLocked.result).toBeBool(true);
            }
          } else {
            // If batch failed, no tokens should be locked
            for (const req of uniqueRequests) {
              const isLocked = BridgeTestUtils.isTokenLocked(req.tokenId, wallet1);
              expect(isLocked.result).toBeBool(false);
            }
          }
        }
      ), { numRuns: 15 });
    });

    it('Property 7: Configuration isolation', () => {
      fc.assert(fc.property(
        targetChainGenerator,
        fc.integer({ min: 1000000, max: 5000000 }),
        fc.integer({ min: 5, max: 50 }),
        (chain, newFee, newConfirmations) => {
          // Create request with original config
          const request1 = BridgeTestUtils.createBridgeRequest(
            1, chain, '0x1111111111111111111111111111111111111111', wallet1
          );

          // Update chain config
          BridgeTestUtils.updateChainConfig(
            chain, true, newConfirmations, newFee, deployer
          );

          // Create request with new config
          const request2 = BridgeTestUtils.createBridgeRequest(
            2, chain, '0x2222222222222222222222222222222222222222', wallet1
          );

          if (request1.result.type === 'ok' && request2.result.type === 'ok') {
            // Verify new config is applied
            const config = BridgeTestUtils.getChainConfig(chain, deployer);
            expect(config.result.value['bridge-fee']).toBeUint(newFee);
            expect(config.result.value['min-confirmations']).toBeUint(newConfirmations);
          }
        }
      ), { numRuns: 20 });
    });

    it('Property 8: Bridge pause behavior', () => {
      fc.assert(fc.property(
        bridgeRequestGenerator,
        (request) => {
          // Pause bridge
          BridgeTestUtils.setBridgeEnabled(false, deployer);

          // Try to create request while paused
          const result = BridgeTestUtils.createBridgeRequest(
            request.tokenId, request.targetChain, request.targetAddress, wallet1
          );

          // Should always fail when bridge is disabled
          expect(result.result).toBeErr(Cl.uint(BridgeTestUtils.ERRORS.BRIDGE_DISABLED));

          // Token should not be locked
          const isLocked = BridgeTestUtils.isTokenLocked(request.tokenId, wallet1);
          expect(isLocked.result).toBeBool(false);

          // Re-enable for next test
          BridgeTestUtils.setBridgeEnabled(true, deployer);
        }
      ), { numRuns: 15 });
    });
  });
});