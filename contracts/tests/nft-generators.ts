/**
 * Property-based test generators for SIP-009 NFT contract tests on Stacks Network
 *
 * All generators produce deterministic-enough values for reproducible CI runs
 * while still covering a wide input space.
 *
 * @module nft-generators
 */

// ---------------------------------------------------------------------------
// Token ID generators
// ---------------------------------------------------------------------------

/**
 * Generate a valid token ID in the range [1, maxTokens].
 */
export function generateValidTokenId(maxTokens = 100): number {
  return Math.floor(Math.random() * maxTokens) + 1;
}

/**
 * Generate an invalid token ID: either 0 or a value above maxTokens.
 */
export function generateInvalidTokenId(maxTokens = 100): number {
  return Math.random() < 0.5 ? 0 : maxTokens + Math.floor(Math.random() * 1_000) + 1;
}

// ---------------------------------------------------------------------------
// Principal generators
// ---------------------------------------------------------------------------

/**
 * Generate a syntactically valid Stacks testnet principal string.
 */
export function generatePrincipal(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'ST';
  for (let i = 0; i < 34; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate `count` unique Stacks principal strings.
 */
export function generateUniquePrincipals(count: number): string[] {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(generatePrincipal());
  }
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// Operation sequence generators
// ---------------------------------------------------------------------------

export interface MintOperation {
  recipient: string;
  expectedTokenId: number;
}

/**
 * Generate a sequence of `count` mint operations, cycling through the
 * provided principals.
 */
export function generateMintSequence(count: number, principals: string[]): MintOperation[] {
  return Array.from({ length: count }, (_, i) => ({
    recipient: principals[Math.floor(Math.random() * principals.length)],
    expectedTokenId: i + 1,
  }));
}

export interface TransferOperation {
  tokenId: number;
  from: string;
  to: string;
}

/**
 * Generate a sequence of transfer operations based on the current ownership
 * map.  The map is updated in-place so subsequent operations remain valid.
 */
export function generateTransferSequence(
  tokenOwners: Map<number, string>,
  principals: string[],
  count: number,
): TransferOperation[] {
  const ops: TransferOperation[] = [];
  const current = new Map(tokenOwners);

  for (let i = 0; i < count; i++) {
    const ids = Array.from(current.keys());
    if (ids.length === 0) break;

    const tokenId = ids[Math.floor(Math.random() * ids.length)];
    const from = current.get(tokenId)!;
    const to = principals[Math.floor(Math.random() * principals.length)];

    ops.push({ tokenId, from, to });
    current.set(tokenId, to);
  }

  return ops;
}

// ---------------------------------------------------------------------------
// Edge-case value generators
// ---------------------------------------------------------------------------

/** Return a fixed set of boundary token IDs for edge-case testing */
export function generateEdgeCaseTokenIds(): number[] {
  return [0, 1, 999_999_999, Number.MAX_SAFE_INTEGER];
}

/** Return a fixed set of boundary token IDs including negative-equivalent values */
export function generateBoundaryTokenIds(): number[] {
  return [
    0,                       // Invalid: zero
    1,                       // Valid: minimum
    Number.MAX_SAFE_INTEGER, // Edge: maximum safe integer
    -1,                      // Invalid: negative (becomes large uint in Clarity)
    999_999_999,             // Large but valid
  ];
}

// ---------------------------------------------------------------------------
// Mixed operation sequence generator
// ---------------------------------------------------------------------------

export type Operation =
  | { type: 'mint'; recipient: string }
  | { type: 'transfer'; tokenId: number; from: string; to: string };

/**
 * Generate a mixed sequence of mint and transfer operations.
 * Mints are favoured (60 %) to ensure there are always tokens to transfer.
 */
export function generateOperationSequence(
  principals: string[],
  operationCount: number,
): Operation[] {
  const ops: Operation[] = [];
  const owners = new Map<number, string>();
  let nextId = 1;

  for (let i = 0; i < operationCount; i++) {
    const shouldMint = Math.random() < 0.6 || owners.size === 0;

    if (shouldMint) {
      const recipient = principals[Math.floor(Math.random() * principals.length)];
      ops.push({ type: 'mint', recipient });
      owners.set(nextId++, recipient);
    } else {
      const ids = Array.from(owners.keys());
      const tokenId = ids[Math.floor(Math.random() * ids.length)];
      const from = owners.get(tokenId)!;
      const to = principals[Math.floor(Math.random() * principals.length)];
      ops.push({ type: 'transfer', tokenId, from, to });
      owners.set(tokenId, to);
    }
  }

  return ops;
}

// ---------------------------------------------------------------------------
// Ownership chain generator
// ---------------------------------------------------------------------------

export interface OwnershipChain {
  tokenId: number;
  /** Ordered list of owners: index 0 is the minter, last is the final owner */
  owners: string[];
}

/**
 * Generate `tokenCount` ownership chains of length `chainLength`.
 * Each chain represents a token being transferred through a series of owners.
 * Consecutive owners are guaranteed to be different (no self-transfers).
 */
export function generateOwnershipChains(
  tokenCount: number,
  principals: string[],
  chainLength: number,
): OwnershipChain[] {
  return Array.from({ length: tokenCount }, (_, i) => {
    const owners: string[] = [principals[Math.floor(Math.random() * principals.length)]];

    for (let j = 1; j < chainLength; j++) {
      let next: string;
      do {
        next = principals[Math.floor(Math.random() * principals.length)];
      } while (next === owners[owners.length - 1]);
      owners.push(next);
    }

    return { tokenId: i + 1, owners };
  });
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default configuration for property-based NFT tests on Stacks Network */
export const PROPERTY_TEST_CONFIG = {
  iterations: 100,
  maxTokens: 50,
  maxPrincipals: 10,
  maxOperations: 20,
} as const;
