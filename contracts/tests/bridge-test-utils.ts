/**
 * Bridge Test Utilities
 * Helper class for SIP-009 cross-chain bridge contract tests on Stacks Network
 *
 * @module bridge-test-utils
 */

import { Cl } from '@stacks/transactions';
import { BRIDGE_TEST_CONFIG } from './bridge-test-config';

export class BridgeTestUtils {
  static readonly CONTRACT_NAME = 'sip-009-bridge';

  /** Bridge error codes sourced from the centralised config */
  static readonly ERRORS = BRIDGE_TEST_CONFIG.ERRORS;

  /** Default chain fee and confirmation configuration */
  static readonly DEFAULT_CHAINS: Record<string, { fee: number; confirmations: number }> = {
    ethereum: { fee: 1_000_000, confirmations: 12 },
    polygon:  { fee:   500_000, confirmations: 20 },
    arbitrum: { fee:   750_000, confirmations:  8 },
    optimism: { fee:   600_000, confirmations: 10 },
  };

  // -------------------------------------------------------------------------
  // Validator management
  // -------------------------------------------------------------------------

  /**
   * Register one or more validators with the bridge contract.
   * Returns the array of call results for assertion in tests.
   */
  static setupValidators(validators: string[], deployer: string) {
    return validators.map(validator =>
      simnet.callPublicFn(
        this.CONTRACT_NAME,
        'add-validator',
        [Cl.principal(validator)],
        deployer,
      ),
    );
  }

  /**
   * Retrieve validator metadata from the contract.
   */
  static getValidatorInfo(validator: string, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-validator-info',
      [Cl.principal(validator)],
      caller,
    );
  }

  // -------------------------------------------------------------------------
  // Bridge request lifecycle
  // -------------------------------------------------------------------------

  /**
   * Initiate a bridge request for a given token.
   * Returns the full call result (including the assigned request ID on success).
   */
  static createBridgeRequest(
    tokenId: number,
    targetChain: string,
    targetAddress: string,
    sender: string,
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'initiate-bridge-request',
      [
        Cl.uint(tokenId),
        Cl.stringAscii(targetChain),
        Cl.stringAscii(targetAddress),
      ],
      sender,
    );
  }

  /**
   * Submit validator signatures for a pending bridge request.
   * Iterates over the provided signatures and validators in lock-step.
   */
  static addValidatorSignatures(
    requestId: number,
    signatures: Uint8Array[],
    validators: string[],
  ) {
    return signatures.slice(0, validators.length).map((sig, i) =>
      simnet.callPublicFn(
        this.CONTRACT_NAME,
        'validate-bridge-request',
        [Cl.uint(requestId), Cl.buffer(sig)],
        validators[i],
      ),
    );
  }

  /**
   * Cancel a pending bridge request.
   */
  static cancelBridgeRequest(requestId: number, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'cancel-bridge-request',
      [Cl.uint(requestId)],
      caller,
    );
  }

  /**
   * Mark a bridge request as completed with the target-chain transaction hash.
   */
  static completeBridgeRequest(requestId: number, targetTxHash: string, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'complete-bridge-request',
      [Cl.uint(requestId), Cl.stringAscii(targetTxHash)],
      caller,
    );
  }

  // -------------------------------------------------------------------------
  // Read-only queries
  // -------------------------------------------------------------------------

  /** Fetch a bridge request by ID */
  static getBridgeRequest(requestId: number, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-bridge-request',
      [Cl.uint(requestId)],
      caller,
    );
  }

  /** Fetch locked-token metadata */
  static getLockedTokenInfo(tokenId: number, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-locked-token-info',
      [Cl.uint(tokenId)],
      caller,
    );
  }

  /** Check whether a token is currently locked in the bridge */
  static isTokenLocked(tokenId: number, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'is-token-locked',
      [Cl.uint(tokenId)],
      caller,
    );
  }

  /** Fetch per-chain bridge configuration */
  static getChainConfig(chain: string, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-chain-config',
      [Cl.stringAscii(chain)],
      caller,
    );
  }

  /** Fetch bridge statistics for a specific chain */
  static getBridgeStats(chain: string, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-bridge-stats',
      [Cl.stringAscii(chain)],
      caller,
    );
  }

  /** Fetch the global bridge enabled/disabled status */
  static getBridgeStatus(caller: string) {
    return simnet.callReadOnlyFn(this.CONTRACT_NAME, 'get-bridge-status', [], caller);
  }

  // -------------------------------------------------------------------------
  // Administrative functions
  // -------------------------------------------------------------------------

  /** Enable or disable the bridge globally */
  static setBridgeEnabled(enabled: boolean, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'set-bridge-enabled',
      [Cl.bool(enabled)],
      caller,
    );
  }

  /** Update the fee and confirmation settings for a chain */
  static updateChainConfig(
    chain: string,
    active: boolean,
    minConfirmations: number,
    bridgeFee: number,
    caller: string,
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'update-chain-config',
      [
        Cl.stringAscii(chain),
        Cl.bool(active),
        Cl.uint(minConfirmations),
        Cl.uint(bridgeFee),
      ],
      caller,
    );
  }

  /** Emergency unlock a token that is stuck in the bridge */
  static emergencyUnlockToken(tokenId: number, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'emergency-unlock-token',
      [Cl.uint(tokenId)],
      caller,
    );
  }

  /** Grant a fee discount to a specific user */
  static grantUserDiscount(
    user: string,
    discountPercentage: number,
    validBlocks: number,
    caller: string,
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'grant-user-discount',
      [Cl.principal(user), Cl.uint(discountPercentage), Cl.uint(validBlocks)],
      caller,
    );
  }

  // -------------------------------------------------------------------------
  // Batch operations
  // -------------------------------------------------------------------------

  /**
   * Initiate multiple bridge requests in a single contract call.
   */
  static batchInitiateBridgeRequests(
    requests: Array<{ tokenId: number; targetChain: string; targetAddress: string }>,
    caller: string,
  ) {
    const clarityRequests = requests.map(req =>
      Cl.tuple({
        'token-id':       Cl.uint(req.tokenId),
        'target-chain':   Cl.stringAscii(req.targetChain),
        'target-address': Cl.stringAscii(req.targetAddress),
      }),
    );

    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'batch-initiate-bridge-requests',
      [Cl.list(clarityRequests)],
      caller,
    );
  }

  // -------------------------------------------------------------------------
  // Assertion helpers
  // -------------------------------------------------------------------------

  /**
   * Verify that a bridge request tuple has the expected field values.
   */
  static verifyRequestProperties(
    requestData: any,
    expectedTokenId: number,
    expectedChain: string,
    expectedAddress: string,
    expectedOwner: string,
    expectedStatus = 'pending',
  ): void {
    expect(requestData['token-id']).toStrictEqual(Cl.uint(expectedTokenId));
    expect(requestData['target-chain']).toStrictEqual(Cl.stringAscii(expectedChain));
    expect(requestData['target-address']).toStrictEqual(Cl.stringAscii(expectedAddress));
    expect(requestData['owner']).toStrictEqual(Cl.principal(expectedOwner));
    expect(requestData['status']).toStrictEqual(Cl.stringAscii(expectedStatus));
  }

  /**
   * Return the expected bridge fee for a given chain name.
   */
  static calculateExpectedFee(chain: string): number {
    return this.DEFAULT_CHAINS[chain]?.fee ?? 0;
  }

  // -------------------------------------------------------------------------
  // Test data generators
  // -------------------------------------------------------------------------

  /** Generate a deterministic 65-byte mock validator signature */
  static generateMockSignature(): Uint8Array {
    return new Uint8Array(65).fill(0x42);
  }

  /** Mine `blocks` empty Stacks blocks to simulate time passing */
  static advanceBlocks(blocks: number): void {
    for (let i = 0; i < blocks; i++) {
      simnet.mineEmptyBlock();
    }
  }
}
