/**
 * NFT Test Utilities
 * Helper classes and functions for SIP-009 NFT contract tests on Stacks Network
 *
 * @module nft-test-utils
 */

import { simnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import { principal, uint, expectEqual, some, none } from './helpers';

// ---------------------------------------------------------------------------
// State snapshot
// ---------------------------------------------------------------------------

/** Snapshot of the NFT contract state at a point in time */
export interface NFTContractState {
  /** Value returned by get-last-token-id */
  lastTokenId: number;
  /** Map of tokenId → owner principal string */
  tokenOwners: Map<number, string>;
  /** Total number of tokens that have been minted */
  totalTokens: number;
}

// ---------------------------------------------------------------------------
// State capture
// ---------------------------------------------------------------------------

/**
 * Capture the current on-chain state of an NFT contract.
 *
 * Reads `get-last-token-id` and then iterates `get-owner` for every token up
 * to `maxTokenId` to build a complete ownership map.
 */
export function captureContractState(
  contractName: string,
  maxTokenId = 100,
  caller = 'deployer',
): NFTContractState {
  const lastTokenIdResult = simnet.callReadOnlyFn(
    contractName,
    'get-last-token-id',
    [],
    caller,
  );

  const lastTokenId = lastTokenIdResult.isOk()
    ? Number((lastTokenIdResult.value as any).value?.value ?? 0)
    : 0;

  const tokenOwners = new Map<number, string>();
  let totalTokens = 0;

  for (let i = 1; i <= Math.min(lastTokenId, maxTokenId); i++) {
    const ownerResult = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(i)], caller);

    if (ownerResult.isOk()) {
      const inner = (ownerResult.value as any).value?.value;
      if (inner !== null && inner !== undefined) {
        tokenOwners.set(i, inner.value as string);
        totalTokens++;
      }
    }
  }

  return { lastTokenId, tokenOwners, totalTokens };
}

// ---------------------------------------------------------------------------
// State comparison
// ---------------------------------------------------------------------------

/**
 * Compare two NFT contract state snapshots.
 * Returns `true` when both snapshots are identical.
 */
export function compareContractStates(
  stateA: NFTContractState,
  stateB: NFTContractState,
): boolean {
  if (stateA.lastTokenId !== stateB.lastTokenId) return false;
  if (stateA.totalTokens !== stateB.totalTokens) return false;
  if (stateA.tokenOwners.size !== stateB.tokenOwners.size) return false;

  for (const [tokenId, owner] of stateA.tokenOwners) {
    if (stateB.tokenOwners.get(tokenId) !== owner) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Invariant validation
// ---------------------------------------------------------------------------

/**
 * Validate the core SIP-009 invariants for an NFT contract:
 *
 * 1. `lastTokenId` equals the number of tokens in the ownership map.
 * 2. Every token ID in the range [1, lastTokenId] has an owner.
 * 3. No token ID outside that range has an owner.
 */
export function validateNFTInvariants(
  contractName: string,
  state: NFTContractState,
  caller = 'deployer',
): void {
  // Invariant 1 – token count consistency
  if (state.lastTokenId !== state.totalTokens) {
    throw new Error(
      `Invariant violation: lastTokenId (${state.lastTokenId}) ≠ totalTokens (${state.totalTokens})`,
    );
  }

  // Invariant 2 – every minted token has an owner
  for (let i = 1; i <= state.lastTokenId; i++) {
    if (!state.tokenOwners.has(i)) {
      throw new Error(`Invariant violation: token ${i} has no owner in state snapshot`);
    }

    const ownerResult = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(i)], caller);
    if (!ownerResult.isOk()) {
      throw new Error(`Invariant violation: get-owner failed for token ${i}`);
    }
  }

  // Invariant 3 – no owner beyond lastTokenId
  const beyondResult = simnet.callReadOnlyFn(
    contractName,
    'get-owner',
    [uint(state.lastTokenId + 1)],
    caller,
  );
  if (beyondResult.isOk()) {
    expectEqual(beyondResult.value, Cl.ok(none()));
  }
}

// ---------------------------------------------------------------------------
// Ownership assertion helpers
// ---------------------------------------------------------------------------

/**
 * Assert that a token is owned by the expected principal.
 * Reads `get-owner` directly from the simnet.
 */
export function assertTokenOwner(
  contractName: string,
  tokenId: number,
  expectedOwner: string,
  caller = 'deployer',
): void {
  const result = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(tokenId)], caller);
  if (!result.isOk()) {
    throw new Error(`get-owner failed for token ${tokenId}: ${JSON.stringify(result)}`);
  }
  expectEqual(result.value, Cl.ok(some(principal(expectedOwner))));
}

/**
 * Assert that a token does not exist (get-owner returns None).
 */
export function assertTokenNotExists(
  contractName: string,
  tokenId: number,
  caller = 'deployer',
): void {
  const result = simnet.callReadOnlyFn(contractName, 'get-owner', [uint(tokenId)], caller);
  if (!result.isOk()) {
    throw new Error(
      `get-owner failed for token ${tokenId}: ${JSON.stringify(result)}`,
    );
  }
  expectEqual(result.value, Cl.ok(none()));
}

// ---------------------------------------------------------------------------
// Batch helpers
// ---------------------------------------------------------------------------

/**
 * Mint `count` tokens to the given recipient and return the resulting token IDs.
 */
export function mintTokens(
  contractName: string,
  recipient: string,
  count: number,
  minter = 'deployer',
): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    const result = simnet.callPublicFn(contractName, 'mint', [principal(recipient)], minter);
    if (result.isOk()) {
      ids.push(Number((result.value as any).value));
    }
  }
  return ids;
}

/**
 * Perform a batch of transfers and verify each one succeeds.
 */
export function batchTransfer(
  contractName: string,
  transfers: Array<{ tokenId: number; from: string; to: string }>,
): void {
  for (const { tokenId, from, to } of transfers) {
    const result = simnet.callPublicFn(
      contractName,
      'transfer',
      [uint(tokenId), principal(from), principal(to)],
      from,
    );
    if (!result.isOk()) {
      throw new Error(
        `Transfer of token ${tokenId} from ${from} to ${to} failed: ${JSON.stringify(result)}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// State snapshot comparison helper
// ---------------------------------------------------------------------------

/**
 * Capture state before and after a callback, then return both snapshots.
 * Useful for verifying that an operation changes state as expected.
 */
export async function captureStateDelta(
  contractName: string,
  operation: () => void | Promise<void>,
  maxTokenId = 100,
  caller = 'deployer',
): Promise<{ before: NFTContractState; after: NFTContractState }> {
  const before = captureContractState(contractName, maxTokenId, caller);
  await operation();
  const after = captureContractState(contractName, maxTokenId, caller);
  return { before, after };
}
