/**
 * NFT Test Utilities
 */

import { simnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import { principal, uint, expectEqual, some, none } from './helpers';

/**
 * Test state snapshot
 */
export interface NFTContractState {
  lastTokenId: number;
  tokenOwners: Map<number, string>;
  totalTokens: number;
}

/**
 * Capture current contract state
 */
export function captureContractState(
  contractName: string,
  maxTokenId: number = 100,
  caller: string = 'deployer'
): NFTContractState {
  // Get last token ID
  const lastTokenIdResult = simnet.callReadOnlyFn(
    contractName,
    'get-last-token-id',
    [],
    caller
  );
  
  const lastTokenId = lastTokenIdResult.isOk() ? 
    Number(lastTokenIdResult.value.value.value) : 0;
  
  // Get token owners
  const tokenOwners = new Map<number, string>();
  let totalTokens = 0;
  
  for (let i = 1; i <= Math.min(lastTokenId, maxTokenId); i++) {
    const ownerResult = simnet.callReadOnlyFn(
      contractName,
      'get-owner',
      [uint(i)],
      caller
    );
    
    if (ownerResult.isOk() && ownerResult.value.value.value !== null) {
      const owner = ownerResult.value.value.value.value;
      tokenOwners.set(i, owner);
      totalTokens++;
    }
  }
  
  return {
    lastTokenId,
    tokenOwners,
    totalTokens
  };
}

/**
 * Compare contract states
 */
export function compareContractStates(
  state1: NFTContractState,
  state2: NFTContractState
): {
  lastTokenIdChanged: boolean;
  ownershipChanges: Array<{ tokenId: number; oldOwner?: string; newOwner?: string }>;
  totalTokensChanged: boolean;
} {
  const lastTokenIdChanged = state1.lastTokenId !== state2.lastTokenId;
  const totalTokensChanged = state1.totalTokens !== state2.totalTokens;
  const ownershipChanges: Array<{ tokenId: number; oldOwner?: string; newOwner?: string }> = [];
  
  // Check for ownership changes
  const allTokenIds = new Set([
    ...state1.tokenOwners.keys(),
    ...state2.tokenOwners.keys()
  ]);
  
  for (const tokenId of allTokenIds) {
    const oldOwner = state1.tokenOwners.get(tokenId);
    const newOwner = state2.tokenOwners.get(tokenId);
    
    if (oldOwner !== newOwner) {
      ownershipChanges.push({ tokenId, oldOwner, newOwner });
    }
  }
  
  return {
    lastTokenIdChanged,
    ownershipChanges,
    totalTokensChanged
  };
}

/**
 * Validate contract invariants
 */
export function validateContractInvariants(
  contractName: string,
  state: NFTContractState,
  caller: string = 'deployer'
): boolean {
  // Invariant 1: lastTokenId should equal the number of minted tokens
  if (state.lastTokenId !== state.totalTokens) {
    throw new Error(`Invariant violation: lastTokenId (${state.lastTokenId}) != totalTokens (${state.totalTokens})`);
  }
  
  // Invariant 2: All token IDs from 1 to lastTokenId should exist
  for (let i = 1; i <= state.lastTokenId; i++) {
    if (!state.tokenOwners.has(i)) {
      throw new Error(`Invariant violation: Token ${i} should exist but doesn't`);
    }
  }
  
  // Invariant 3: No token ID greater than lastTokenId should exist
  const ownerResult = simnet.callReadOnlyFn(
    contractName,
    'get-owner',
    [uint(state.lastTokenId + 1)],
    caller
  );
  
  if (ownerResult.isOk() && ownerResult.value.value.value !== null) {
    throw new Error(`Invariant violation: Token ${state.lastTokenId + 1} should not exist`);
  }
  
  return true;
}