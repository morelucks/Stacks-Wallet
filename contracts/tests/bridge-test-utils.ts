import { Cl } from '@stacks/transactions';

export class BridgeTestUtils {
  static readonly CONTRACT_NAME = 'sip-009-bridge';
  
  // Error codes from the contract
  static readonly ERRORS = {
    NOT_AUTHORIZED: 401,
    TOKEN_LOCKED: 402,
    INVALID_CHAIN: 403,
    INSUFFICIENT_VALIDATORS: 404,
    BRIDGE_DISABLED: 405,
    INVALID_REQUEST: 406,
    INSUFFICIENT_BALANCE: 407,
    INVALID_SIGNATURE: 408,
    REQUEST_EXPIRED: 409
  };

  // Default chain configurations
  static readonly DEFAULT_CHAINS = {
    ethereum: { fee: 1000000, confirmations: 12 },
    polygon: { fee: 500000, confirmations: 20 },
    arbitrum: { fee: 750000, confirmations: 8 },
    optimism: { fee: 600000, confirmations: 10 }
  };

  /**
   * Initialize bridge with validators
   */
  static setupValidators(validators: string[], deployer: string) {
    const results = [];
    for (const validator of validators) {
      const result = simnet.callPublicFn(
        this.CONTRACT_NAME,
        'add-validator',
        [Cl.principal(validator)],
        deployer
      );
      results.push(result);
    }
    return results;
  }

  /**
   * Create a bridge request and return the request ID
   */
  static createBridgeRequest(
    tokenId: number,
    targetChain: string,
    targetAddress: string,
    sender: string
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'initiate-bridge-request',
      [
        Cl.uint(tokenId),
        Cl.stringAscii(targetChain),
        Cl.stringAscii(targetAddress)
      ],
      sender
    );
  }

  /**
   * Add validator signatures to a bridge request
   */
  static addValidatorSignatures(
    requestId: number,
    signatures: Uint8Array[],
    validators: string[]
  ) {
    const results = [];
    for (let i = 0; i < signatures.length && i < validators.length; i++) {
      const result = simnet.callPublicFn(
        this.CONTRACT_NAME,
        'validate-bridge-request',
        [Cl.uint(requestId), Cl.buffer(signatures[i])],
        validators[i]
      );
      results.push(result);
    }
    return results;
  }

  /**
   * Get bridge request details
   */
  static getBridgeRequest(requestId: number, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-bridge-request',
      [Cl.uint(requestId)],
      caller
    );
  }

  /**
   * Get locked token information
   */
  static getLockedTokenInfo(tokenId: number, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-locked-token-info',
      [Cl.uint(tokenId)],
      caller
    );
  }

  /**
   * Check if token is locked
   */
  static isTokenLocked(tokenId: number, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'is-token-locked',
      [Cl.uint(tokenId)],
      caller
    );
  }

  /**
   * Get validator information
   */
  static getValidatorInfo(validator: string, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-validator-info',
      [Cl.principal(validator)],
      caller
    );
  }

  /**
   * Get chain configuration
   */
  static getChainConfig(chain: string, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-chain-config',
      [Cl.stringAscii(chain)],
      caller
    );
  }

  /**
   * Get bridge statistics
   */
  static getBridgeStats(chain: string, caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-bridge-stats',
      [Cl.stringAscii(chain)],
      caller
    );
  }

  /**
   * Get bridge status
   */
  static getBridgeStatus(caller: string) {
    return simnet.callReadOnlyFn(
      this.CONTRACT_NAME,
      'get-bridge-status',
      [],
      caller
    );
  }

  /**
   * Cancel bridge request
   */
  static cancelBridgeRequest(requestId: number, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'cancel-bridge-request',
      [Cl.uint(requestId)],
      caller
    );
  }

  /**
   * Complete bridge request
   */
  static completeBridgeRequest(
    requestId: number,
    targetTxHash: string,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'complete-bridge-request',
      [Cl.uint(requestId), Cl.stringAscii(targetTxHash)],
      caller
    );
  }

  /**
   * Set bridge enabled/disabled
   */
  static setBridgeEnabled(enabled: boolean, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'set-bridge-enabled',
      [Cl.bool(enabled)],
      caller
    );
  }

  /**
   * Update chain configuration
   */
  static updateChainConfig(
    chain: string,
    active: boolean,
    minConfirmations: number,
    bridgeFee: number,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'update-chain-config',
      [
        Cl.stringAscii(chain),
        Cl.bool(active),
        Cl.uint(minConfirmations),
        Cl.uint(bridgeFee)
      ],
      caller
    );
  }

  /**
   * Emergency unlock token
   */
  static emergencyUnlockToken(tokenId: number, caller: string) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'emergency-unlock-token',
      [Cl.uint(tokenId)],
      caller
    );
  }

  /**
   * Grant user discount
   */
  static grantUserDiscount(
    user: string,
    discountPercentage: number,
    validBlocks: number,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'grant-user-discount',
      [
        Cl.principal(user),
        Cl.uint(discountPercentage),
        Cl.uint(validBlocks)
      ],
      caller
    );
  }

  /**
   * Batch initiate bridge requests
   */
  static batchInitiateBridgeRequests(
    requests: Array<{tokenId: number, targetChain: string, targetAddress: string}>,
    caller: string
  ) {
    const clarityRequests = requests.map(req => 
      Cl.tuple({
        'token-id': Cl.uint(req.tokenId),
        'target-chain': Cl.stringAscii(req.targetChain),
        'target-address': Cl.stringAscii(req.targetAddress)
      })
    );

    return simnet.callPublicFn(
      this.CONTRACT_NAME,
      'batch-initiate-bridge-requests',
      [Cl.list(clarityRequests)],
      caller
    );
  }

  /**
   * Verify request has expected properties
   */
  static verifyRequestProperties(
    requestData: any,
    expectedTokenId: number,
    expectedChain: string,
    expectedAddress: string,
    expectedOwner: string,
    expectedStatus: string = 'pending'
  ) {
    expect(requestData['token-id']).toStrictEqual(Cl.uint(expectedTokenId));
    expect(requestData['target-chain']).toStrictEqual(Cl.stringAscii(expectedChain));
    expect(requestData['target-address']).toStrictEqual(Cl.stringAscii(expectedAddress));
    expect(requestData['owner']).toStrictEqual(Cl.principal(expectedOwner));
    expect(requestData['status']).toStrictEqual(Cl.stringAscii(expectedStatus));
  }

  /**
   * Calculate expected fee for a chain
   */
  static calculateExpectedFee(chain: string): number {
    return this.DEFAULT_CHAINS[chain as keyof typeof this.DEFAULT_CHAINS]?.fee || 0;
  }

  /**
   * Generate mock signature
   */
  static generateMockSignature(): Uint8Array {
    return new Uint8Array(65).fill(0x42);
  }

  /**
   * Advance blocks for timeout testing
   */
  static advanceBlocks(blocks: number) {
    for (let i = 0; i < blocks; i++) {
      simnet.mineEmptyBlock();
    }
  }
}