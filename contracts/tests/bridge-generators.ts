/**
 * Property-based test generators for SIP-009 bridge contract tests on Stacks Network
 *
 * Uses fast-check arbitraries to generate valid and invalid inputs for
 * property-based testing of the cross-chain bridge contract.
 *
 * @module bridge-generators
 */

import fc from 'fast-check';
import { Cl } from '@stacks/transactions';

// ---------------------------------------------------------------------------
// Primitive generators
// ---------------------------------------------------------------------------

/** Generate a valid NFT token ID (1 – 1 000 000) */
export const tokenIdGenerator = fc.integer({ min: 1, max: 1_000_000 });

/** Generate one of the four supported target chains */
export const targetChainGenerator = fc.constantFrom(
  'ethereum',
  'polygon',
  'arbitrum',
  'optimism',
);

/** Generate a valid 42-character Ethereum-style hex address */
export const ethereumAddressGenerator = fc
  .hexaString({ minLength: 40, maxLength: 40 })
  .map(s => '0x' + s);

/** Generate a 65-byte mock validator signature */
export const signatureGenerator = fc.uint8Array({ minLength: 65, maxLength: 65 });

/** Generate a known Stacks testnet principal */
export const validatorGenerator = fc.constantFrom(
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
);

/** Generate a block height (1 – 1 000 000) */
export const blockHeightGenerator = fc.integer({ min: 1, max: 1_000_000 });

/** Generate a request timeout in Stacks blocks (1 hour – 1 week) */
export const timeoutGenerator = fc.integer({ min: 6, max: 1_008 });

/** Generate a bridge fee percentage in basis points (0.5 % – 5 %) */
export const feePercentageGenerator = fc.integer({ min: 50, max: 500 });

/** Generate a bridge amount in micro-units */
export const bridgeAmountGenerator = fc.integer({ min: 1, max: 1_000_000_000 });

/** Generate a validator reputation score (0 – 1 000) */
export const reputationGenerator = fc.integer({ min: 0, max: 1_000 });

// ---------------------------------------------------------------------------
// Composite generators
// ---------------------------------------------------------------------------

/** Generate a complete bridge request parameter set */
export const bridgeRequestGenerator = fc.record({
  tokenId: tokenIdGenerator,
  targetChain: targetChainGenerator,
  targetAddress: ethereumAddressGenerator,
});

/** Generate a chain configuration tuple */
export const chainConfigGenerator = fc.record({
  active: fc.boolean(),
  minConfirmations: fc.integer({ min: 1, max: 50 }),
  bridgeFee: fc.integer({ min: 100_000, max: 2_000_000 }),
  supportedStandards: fc.constant(['ERC721', 'ERC1155']),
});

/** Generate a user discount configuration */
export const discountGenerator = fc.record({
  discountPercentage: fc.integer({ min: 1, max: 75 }),
  validBlocks: fc.integer({ min: 1, max: 1_000 }),
});

/** Generate a batch of 1 – 10 bridge requests */
export const batchRequestGenerator = fc.array(bridgeRequestGenerator, {
  minLength: 1,
  maxLength: 10,
});

/** Generate a request status string */
export const statusGenerator = fc.constantFrom(
  'pending',
  'confirmed',
  'completed',
  'failed',
  'cancelled',
);

// ---------------------------------------------------------------------------
// Invalid input generators (for error-path testing)
// ---------------------------------------------------------------------------

/** Generate a chain name that is NOT one of the four supported chains */
export const invalidChainGenerator = fc
  .string({ minLength: 1, maxLength: 32 })
  .filter(s => !['ethereum', 'polygon', 'arbitrum', 'optimism'].includes(s));

/** Generate an address that does not conform to the 42-char hex format */
export const invalidAddressGenerator = fc.oneof(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.string({ minLength: 100, maxLength: 200 }),
  fc
    .string({ minLength: 40, maxLength: 40 })
    .filter(s => !/^[0-9a-fA-F]+$/.test(s)),
);

/** Generate a sequence of concurrent bridge operations for stress testing */
export const concurrentOperationGenerator = fc.array(
  fc.record({
    operation: fc.constantFrom('initiate', 'validate', 'cancel', 'complete'),
    requestId: fc.integer({ min: 1, max: 100 }),
    delay: fc.integer({ min: 0, max: 10 }),
  }),
  { minLength: 2, maxLength: 10 },
);

// ---------------------------------------------------------------------------
// Clarity value conversion helpers
// ---------------------------------------------------------------------------

/** Convenience helpers for converting generated values to Clarity types */
export const toClarityValue = {
  uint: (n: number) => Cl.uint(n),
  stringAscii: (s: string) => Cl.stringAscii(s),
  buffer: (b: Uint8Array) => Cl.buffer(b),
  bool: (b: boolean) => Cl.bool(b),
  principal: (p: string) => Cl.principal(p),
} as const;
