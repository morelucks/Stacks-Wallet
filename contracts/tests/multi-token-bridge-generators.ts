import fc from 'fast-check';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const CONFIG = MULTI_TOKEN_BRIDGE_TEST_CONFIG;

// Basic data generators
export const chainIdGenerator = fc.constantFrom(
  CONFIG.TEST_CHAINS.ETHEREUM,
  CONFIG.TEST_CHAINS.BITCOIN,
  CONFIG.TEST_CHAINS.POLYGON,
  CONFIG.TEST_CHAINS.BSC
);

export const tokenIdGenerator = fc.integer({ min: 1, max: 1000 });

export const amountGenerator = fc.integer({ 
  min: CONFIG.MIN_BRIDGE_AMOUNT, 
  max: CONFIG.MAX_BRIDGE_AMOUNT 
});

export const bridgeFeeGenerator = fc.integer({ 
  min: 0, 
  max: CONFIG.MAX_BRIDGE_FEE 
});

export const stakeAmountGenerator = fc.integer({ 
  min: CONFIG.MIN_STAKE_AMOUNT, 
  max: CONFIG.MAX_STAKE_AMOUNT 
});

export const reputationScoreGenerator = fc.integer({ 
  min: CONFIG.MIN_REPUTATION, 
  max: CONFIG.MAX_REPUTATION 
});

// Address generators
export const ethereumAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.ETHEREUM);
export const bitcoinAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.BITCOIN);
export const polygonAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.POLYGON);
export const bscAddressGenerator = fc.constant(CONFIG.TEST_ADDRESSES.BSC);

export const addressGenerator = fc.oneof(
  ethereumAddressGenerator,
  bitcoinAddressGenerator,
  polygonAddressGenerator,
  bscAddressGenerator
);

// Buffer generators
export const txIdGenerator = fc.uint8Array({ minLength: 32, maxLength: 32 });
export const signatureGenerator = fc.uint8Array({ minLength: 65, maxLength: 65 });

// Complex data structure generators
export const bridgeConfigGenerator = fc.record({
  chainId: chainIdGenerator,
  enabled: fc.boolean(),
  minAmount: fc.integer({ min: 1, max: CONFIG.MIN_BRIDGE_AMOUNT }),
  maxAmount: fc.integer({ min: CONFIG.MIN_BRIDGE_AMOUNT, max: CONFIG.MAX_BRIDGE_AMOUNT }),
  bridgeFee: bridgeFeeGenerator,
  confirmationBlocks: fc.integer({ min: 1, max: 100 }),
  validatorThreshold: fc.integer({ min: 1, max: CONFIG.MAX_VALIDATORS })
});

export const validatorGenerator = fc.record({
  chainId: chainIdGenerator,
  stakeAmount: stakeAmountGenerator,
  reputationScore: reputationScoreGenerator,
  active: fc.boolean()
});

export const bridgeTransactionGenerator = fc.record({
  tokenId: tokenIdGenerator,
  amount: amountGenerator,
  destChain: chainIdGenerator,
  destAddress: addressGenerator,
  txId: txIdGenerator
});

// Invalid data generators for error testing
export const invalidChainIdGenerator = fc.integer({ min: 100, max: 1000 });

export const invalidAmountGenerator = fc.oneof(
  fc.constant(0),
  fc.integer({ min: CONFIG.MAX_BRIDGE_AMOUNT + 1, max: CONFIG.MAX_BRIDGE_AMOUNT * 2 })
);

export const invalidBridgeFeeGenerator = fc.integer({ 
  min: CONFIG.MAX_BRIDGE_FEE + 1, 
  max: CONFIG.MAX_BRIDGE_FEE * 2 
});

export const invalidAddressGenerator = fc.oneof(
  fc.constant(''),
  fc.constant('invalid'),
  fc.string({ minLength: 1, maxLength: 10 })
);

// Batch operation generators
export const bridgeTransactionBatchGenerator = fc.array(
  bridgeTransactionGenerator,
  { minLength: 1, max: 10 }
);

export const validatorBatchGenerator = fc.array(
  validatorGenerator,
  { minLength: 1, max: CONFIG.MAX_VALIDATORS }
);

// Edge case generators
export const edgeCaseAmountGenerator = fc.oneof(
  fc.constant(1),
  fc.constant(CONFIG.MIN_BRIDGE_AMOUNT),
  fc.constant(CONFIG.MAX_BRIDGE_AMOUNT),
  fc.constant(CONFIG.MAX_BRIDGE_AMOUNT - 1)
);

export const edgeCaseFeeGenerator = fc.oneof(
  fc.constant(0),
  fc.constant(1),
  fc.constant(CONFIG.MAX_BRIDGE_FEE),
  fc.constant(CONFIG.MAX_BRIDGE_FEE - 1)
);

// Signature validation generators
export const signatureSetGenerator = fc.array(
  signatureGenerator,
  { minLength: 1, max: CONFIG.MAX_VALIDATORS }
);

export const validatorSignatureGenerator = fc.record({
  validator: fc.string(),
  signature: signatureGenerator,
  isValid: fc.boolean()
});

// Multi-chain operation generators
export const crossChainTransactionGenerator = fc.record({
  sourceChain: chainIdGenerator,
  destChain: chainIdGenerator,
  tokenId: tokenIdGenerator,
  amount: amountGenerator
}).filter(tx => tx.sourceChain !== tx.destChain);

// Performance test generators
export const largeAmountGenerator = fc.integer({ 
  min: CONFIG.MAX_BRIDGE_AMOUNT / 2, 
  max: CONFIG.MAX_BRIDGE_AMOUNT 
});

export const highVolumeTransactionGenerator = fc.array(
  bridgeTransactionGenerator,
  { minLength: 50, max: 100 }
);

// State consistency generators
export const stateTransitionGenerator = fc.record({
  initialState: fc.record({
    bridgeConfigs: fc.array(bridgeConfigGenerator, { max: 4 }),
    validators: fc.array(validatorGenerator, { max: 10 }),
    transactions: fc.array(bridgeTransactionGenerator, { max: 20 })
  }),
  operations: fc.array(
    fc.oneof(
      fc.record({ type: fc.constant('configure'), config: bridgeConfigGenerator }),
      fc.record({ type: fc.constant('addValidator'), validator: validatorGenerator }),
      fc.record({ type: fc.constant('bridgeTokens'), transaction: bridgeTransactionGenerator })
    ),
    { max: 10 }
  )
});

// Utility functions for generators
export function generateValidBridgeConfig() {
  return fc.sample(bridgeConfigGenerator, 1)[0];
}

export function generateValidTransaction() {
  return fc.sample(bridgeTransactionGenerator, 1)[0];
}

export function generateValidValidator() {
  return fc.sample(validatorGenerator, 1)[0];
}

export function generateInvalidInput(type: 'chainId' | 'amount' | 'fee' | 'address') {
  switch (type) {
    case 'chainId':
      return fc.sample(invalidChainIdGenerator, 1)[0];
    case 'amount':
      return fc.sample(invalidAmountGenerator, 1)[0];
    case 'fee':
      return fc.sample(invalidBridgeFeeGenerator, 1)[0];
    case 'address':
      return fc.sample(invalidAddressGenerator, 1)[0];
    default:
      throw new Error(`Unknown invalid input type: ${type}`);
  }
}