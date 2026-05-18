/**
 * Property-based test generators for multi-token bridge tests on Stacks Network
 *
 * @module multi-token-bridge-generators
 */

import fc from 'fast-check';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const CONFIG = MULTI_TOKEN_BRIDGE_TEST_CONFIG;

// ---------------------------------------------------------------------------
// Primitive generators
// ---------------------------------------------------------------------------

/** Generate one of the four supported chain IDs */
export const chainIdGenerator = fc.constantFrom(
  CONFIG.TEST_CHAINS.ETHEREUM,
  CONFIG.TEST_CHAINS.BITCOIN,
  CONFIG.TEST_CHAINS.POLYGON,
  CONFIG.TEST_CHAINS.BSC,
);

/** Generate a valid token ID (1 – 1 000) */
export const tokenIdGenerator = fc.integer({ min: 1, max: 1_000 });

/** Generate a valid bridge amount within configured limits */
export const amountGenerator = fc.integer({
  min: CONFIG.MIN_BRIDGE_AMOUNT,
  max: CONFIG.MAX_BRIDGE_AMOUNT,
});

/** Generate a valid bridge fee in basis points (0 – MAX_BRIDGE_FEE) */
export const bridgeFeeGenerator = fc.integer({ min: 0, max: CONFIG.MAX_BRIDGE_FEE });

/** Generate a valid validator stake amount */
export const stakeAmountGenerator = fc.integer({
  min: CONFIG.MIN_STAKE_AMOUNT,
  max: CONFIG.MAX_STAKE_AMOUNT,
});

/** Generate a validator reputation score (0 – 100) */
export const reputationScoreGenerator = fc.integer({
  min: CONFIG.MIN_REPUTATION,
  max: CONFIG.MAX_REPUTATION,
});

// ---------------------------------------------------------------------------
// Address generators
// ---------------------------------------------------------------------------

export const ethereumAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.ETHEREUM);
export const bitcoinAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.BITCOIN);
export const polygonAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.POLYGON);
export const bscAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.BSC);

/** Generate one of the four test destination addresses */
export const addressGenerator = fc.oneof(
  ethereumAddressGenerator,
  bitcoinAddressGenerator,
  polygonAddressGenerator,
  bscAddressGenerator,
);

// ---------------------------------------------------------------------------
// Buffer generators
// ---------------------------------------------------------------------------

/** Generate a 32-byte transaction ID */
export const txIdGenerator = fc.uint8Array({ minLength: 32, maxLength: 32 });

/** Generate a 65-byte validator signature */
export const signatureGenerator = fc.uint8Array({ minLength: 65, maxLength: 65 });

// ---------------------------------------------------------------------------
// Composite generators
// ---------------------------------------------------------------------------

/** Generate a complete bridge configuration record */
export const bridgeConfigGenerator = fc.record({
  chainId: chainIdGenerator,
  enabled: fc.boolean(),
  minAmount: fc.integer({ min: 1, max: CONFIG.MIN_BRIDGE_AMOUNT }),
  maxAmount: fc.integer({ min: CONFIG.MIN_BRIDGE_AMOUNT, max: CONFIG.MAX_BRIDGE_AMOUNT }),
  bridgeFee: bridgeFeeGenerator,
  confirmationBlocks: fc.integer({ min: 1, max: 100 }),
  validatorThreshold: fc.integer({ min: 1, max: CONFIG.MAX_VALIDATORS }),
});

/** Generate a validator record */
export const validatorGenerator = fc.record({
  chainId: chainIdGenerator,
  stakeAmount: stakeAmountGenerator,
  reputationScore: reputationScoreGenerator,
  active: fc.boolean(),
});

/** Generate a complete bridge transaction record */
export const bridgeTransactionGenerator = fc.record({
  tokenId: tokenIdGenerator,
  amount: amountGenerator,
  destChain: chainIdGenerator,
  destAddress: addressGenerator,
  txId: txIdGenerator,
});

/** Generate a cross-chain transaction (source ≠ destination) */
export const crossChainTransactionGenerator = fc
  .record({
    sourceChain: chainIdGenerator,
    destChain: chainIdGenerator,
    tokenId: tokenIdGenerator,
    amount: amountGenerator,
  })
  .filter(tx => tx.sourceChain !== tx.destChain);

// ---------------------------------------------------------------------------
// Invalid input generators (for error-path testing)
// ---------------------------------------------------------------------------

/** Generate a chain ID that is NOT one of the four supported chains */
export const invalidChainIdGenerator = fc.integer({ min: 100, max: 1_000 });

/** Generate an amount that is either 0 or above the maximum */
export const invalidAmountGenerator = fc.oneof(
  fc.constant(0),
  fc.integer({
    min: CONFIG.MAX_BRIDGE_AMOUNT + 1,
    max: CONFIG.MAX_BRIDGE_AMOUNT * 2,
  }),
);

/** Generate a fee above the maximum allowed */
export const invalidBridgeFeeGenerator = fc.integer({
  min: CONFIG.MAX_BRIDGE_FEE + 1,
  max: CONFIG.MAX_BRIDGE_FEE * 2,
});

/** Generate an address string that is clearly invalid */
export const invalidAddressGenerator = fc.oneof(
  fc.constant(''),
  fc.constant('invalid'),
  fc.string({ minLength: 1, maxLength: 10 }),
);

// ---------------------------------------------------------------------------
// Batch generators
// ---------------------------------------------------------------------------

/** Generate a batch of 1 – 10 bridge transactions */
export const bridgeTransactionBatchGenerator = fc.array(bridgeTransactionGenerator, {
  minLength: 1,
  maxLength: 10,
});

/** Generate a batch of up to MAX_VALIDATORS validator records */
export const validatorBatchGenerator = fc.array(validatorGenerator, {
  minLength: 1,
  maxLength: CONFIG.MAX_VALIDATORS,
});

// ---------------------------------------------------------------------------
// Edge-case generators
// ---------------------------------------------------------------------------

/** Generate boundary amounts: 1, MIN, MAX-1, MAX */
export const edgeCaseAmountGenerator = fc.oneof(
  fc.constant(1),
  fc.constant(CONFIG.MIN_BRIDGE_AMOUNT),
  fc.constant(CONFIG.MAX_BRIDGE_AMOUNT - 1),
  fc.constant(CONFIG.MAX_BRIDGE_AMOUNT),
);

/** Generate boundary fee values: 0, 1, MAX-1, MAX */
export const edgeCaseFeeGenerator = fc.oneof(
  fc.constant(0),
  fc.constant(1),
  fc.constant(CONFIG.MAX_BRIDGE_FEE - 1),
  fc.constant(CONFIG.MAX_BRIDGE_FEE),
);

// ---------------------------------------------------------------------------
// Performance / stress generators
// ---------------------------------------------------------------------------

/** Generate a large amount (≥ 50 % of MAX_BRIDGE_AMOUNT) */
export const largeAmountGenerator = fc.integer({
  min: Math.floor(CONFIG.MAX_BRIDGE_AMOUNT / 2),
  max: CONFIG.MAX_BRIDGE_AMOUNT,
});

/** Generate a high-volume batch of 50 – 100 transactions */
export const highVolumeTransactionGenerator = fc.array(bridgeTransactionGenerator, {
  minLength: 50,
  maxLength: 100,
});

// ---------------------------------------------------------------------------
// Signature set generators
// ---------------------------------------------------------------------------

/** Generate a set of 1 – MAX_VALIDATORS signatures */
export const signatureSetGenerator = fc.array(signatureGenerator, {
  minLength: 1,
  maxLength: CONFIG.MAX_VALIDATORS,
});

/** Generate a validator + signature pair with a validity flag */
export const validatorSignatureGenerator = fc.record({
  validator: fc.string(),
  signature: signatureGenerator,
  isValid: fc.boolean(),
});
