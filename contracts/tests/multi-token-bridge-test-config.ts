export const MULTI_TOKEN_BRIDGE_TEST_CONFIG = {
  // Test timeouts and limits
  DEFAULT_TIMEOUT: 144, // blocks
  MAX_VALIDATORS: 10,
  MIN_VALIDATORS: 1,
  
  // Chain configurations for testing
  TEST_CHAINS: {
    ETHEREUM: 1,
    BITCOIN: 2,
    POLYGON: 3,
    BSC: 4
  },
  
  // Test amounts and limits
  MIN_BRIDGE_AMOUNT: 1000,
  MAX_BRIDGE_AMOUNT: 1000000,
  DEFAULT_BRIDGE_FEE: 100, // 1%
  MAX_BRIDGE_FEE: 1000, // 10%
  
  // Validator settings
  MIN_STAKE_AMOUNT: 1000,
  MAX_STAKE_AMOUNT: 100000,
  DEFAULT_REPUTATION: 100,
  MIN_REPUTATION: 0,
  MAX_REPUTATION: 100,
  
  // Test addresses
  TEST_ADDRESSES: {
    ETHEREUM: '0x1234567890123456789012345678901234567890',
    BITCOIN: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    POLYGON: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    BSC: '0x9876543210987654321098765432109876543210'
  },
  
  // Error codes
  ERRORS: {
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INVALID_PARAMETER: 400,
    INSUFFICIENT_BALANCE: 402,
    BRIDGE_PAUSED: 403,
    INVALID_CHAIN: 405,
    INVALID_SIGNATURE: 406
  },
  
  // Property test settings
  PROPERTY_TEST_RUNS: 100,
  SHRINK_ATTEMPTS: 1000
};