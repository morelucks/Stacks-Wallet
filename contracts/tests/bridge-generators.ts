import fc from 'fast-check';
import { Cl } from '@stacks/transactions';

// Generator for valid token IDs
export const tokenIdGenerator = fc.integer({ min: 1, max: 1000000 });

// Generator for supported target chains
export const targetChainGenerator = fc.constantFrom('ethereum', 'polygon', 'arbitrum', 'optimism');

// Generator for valid Ethereum-style addresses
export const ethereumAddressGenerator = fc.hexaString({ minLength: 40, maxLength: 40 })
  .map(s => '0x' + s);

// Generator for valid bridge request parameters
export const bridgeRequestGenerator = fc.record({
  tokenId: tokenIdGenerator,
  targetChain: targetChainGenerator,
  targetAddress: ethereumAddressGenerator
});

// Generator for validator signatures (mock 65-byte signatures)
export const signatureGenerator = fc.uint8Array({ minLength: 65, maxLength: 65 });

// Generator for validator principals
export const validatorGenerator = fc.constantFrom(
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
);

// Generator for chain configurations
export const chainConfigGenerator = fc.record({
  active: fc.boolean(),
  minConfirmations: fc.integer({ min: 1, max: 50 }),
  bridgeFee: fc.integer({ min: 100000, max: 2000000 }), // 0.1 to 2 STX
  supportedStandards: fc.constant(['ERC721', 'ERC1155'])
});

// Generator for discount configurations
export const discountGenerator = fc.record({
  discountPercentage: fc.integer({ min: 1, max: 50 }),
  validBlocks: fc.integer({ min: 1, max: 1000 })
});

// Generator for batch bridge requests
export const batchRequestGenerator = fc.array(bridgeRequestGenerator, { minLength: 1, maxLength: 10 });

// Generator for validator reputation scores
export const reputationGenerator = fc.integer({ min: 0, max: 1000 });

// Generator for block heights
export const blockHeightGenerator = fc.integer({ min: 1, max: 1000000 });

// Generator for timeout values
export const timeoutGenerator = fc.integer({ min: 6, max: 1008 }); // 1 hour to 1 week in blocks

// Generator for fee percentages
export const feePercentageGenerator = fc.integer({ min: 50, max: 500 }); // 0.5% to 5%

// Generator for bridge amounts
export const bridgeAmountGenerator = fc.integer({ min: 1, max: 1000000000 });

// Generator for request statuses
export const statusGenerator = fc.constantFrom('pending', 'confirmed', 'completed', 'failed', 'cancelled');

// Generator for invalid inputs (for error testing)
export const invalidChainGenerator = fc.string({ minLength: 1, maxLength: 32 })
  .filter(s => !['ethereum', 'polygon', 'arbitrum', 'optimism'].includes(s));

export const invalidAddressGenerator = fc.oneof(
  fc.string({ minLength: 1, maxLength: 10 }), // Too short
  fc.string({ minLength: 100, maxLength: 200 }), // Too long
  fc.string({ minLength: 40, maxLength: 40 }).filter(s => !/^[0-9a-fA-F]+$/.test(s)) // Invalid hex
);

// Generator for concurrent operations
export const concurrentOperationGenerator = fc.array(
  fc.record({
    operation: fc.constantFrom('initiate', 'validate', 'cancel', 'complete'),
    requestId: fc.integer({ min: 1, max: 100 }),
    delay: fc.integer({ min: 0, max: 10 })
  }),
  { minLength: 2, maxLength: 10 }
);

// Helper to convert generators to Clarity values
export const toClarityValue = {
  uint: (n: number) => Cl.uint(n),
  stringAscii: (s: string) => Cl.stringAscii(s),
  buffer: (b: Uint8Array) => Cl.buffer(b),
  bool: (b: boolean) => Cl.bool(b),
  principal: (p: string) => Cl.principal(p)
};