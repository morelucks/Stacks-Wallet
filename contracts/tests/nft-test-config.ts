/**
 * NFT Test Configuration
 */

export const NFT_TEST_CONFIG = {
  // Test execution settings
  timeout: 30000,
  retries: 3,
  
  // Property test settings
  propertyIterations: 100,
  
  // Test data limits
  maxTokens: 50,
  maxPrincipals: 10,
  maxOperations: 20,
  maxChainLength: 5,
  
  // Error codes
  errorCodes: {
    ERR_OWNER_ONLY: 100,
    ERR_NOT_TOKEN_OWNER: 101,
    ERR_TOKEN_EXISTS: 102,
    ERR_TOKEN_NOT_FOUND: 103
  },
  
  // Test accounts
  accounts: {
    deployer: 'deployer',
    user1: 'wallet_1',
    user2: 'wallet_2',
    user3: 'wallet_3'
  }
} as const;

/**
 * Test data validation
 */
export function validateTestConfig() {
  const config = NFT_TEST_CONFIG;
  
  if (config.maxTokens <= 0) {
    throw new Error('maxTokens must be positive');
  }
  
  if (config.maxPrincipals <= 0) {
    throw new Error('maxPrincipals must be positive');
  }
  
  if (config.propertyIterations <= 0) {
    throw new Error('propertyIterations must be positive');
  }
  
  return true;
}