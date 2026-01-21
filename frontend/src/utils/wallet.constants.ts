/**
 * Wallet-related constants
 */

export const WALLET_CONSTANTS = {
  // Connection timeout in milliseconds
  CONNECTION_TIMEOUT: 30000,

  // Address display format
  ADDRESS_START_CHARS: 6,
  ADDRESS_END_CHARS: 4,

  // Error codes
  ERROR_CODES: {
    CONNECTION_ERROR: "CONNECTION_ERROR",
    DISCONNECTION_ERROR: "DISCONNECTION_ERROR",
    CONNECTION_TIMEOUT: "CONNECTION_TIMEOUT",
    SUBSCRIPTION_ERROR: "SUBSCRIPTION_ERROR",
    BALANCE_FETCH_ERROR: "BALANCE_FETCH_ERROR",
  },

  // Supported networks
  NETWORKS: {
    MAINNET: "mainnet",
    TESTNET: "testnet",
  } as const,

  // Stacks address prefixes
  ADDRESS_PREFIXES: {
    MAINNET: "SP",
    TESTNET: "ST",
  } as const,
} as const;

