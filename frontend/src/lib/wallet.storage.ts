/**
 * Wallet Storage Utilities
 * Handles localStorage persistence for wallet preferences
 */

const STORAGE_KEYS = {
  LAST_CONNECTED_ADDRESS: "wallet_last_connected_address",
  PREFERRED_NETWORK: "wallet_preferred_network",
  CONNECTION_PREFERENCES: "wallet_connection_preferences",
} as const;

export interface ConnectionPreferences {
  autoConnect: boolean;
  rememberNetwork: boolean;
}

/**
 * Save last connected wallet address
 */
export function saveLastConnectedAddress(address: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED_ADDRESS, address);
  } catch (error) {
    console.warn("Failed to save last connected address:", error);
  }
}

/**
 * Get last connected wallet address
 */
export function getLastConnectedAddress(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_CONNECTED_ADDRESS);
  } catch (error) {
    console.warn("Failed to get last connected address:", error);
    return null;
  }
}

/**
 * Save preferred network
 */
export function savePreferredNetwork(network: "mainnet" | "testnet"): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERRED_NETWORK, network);
  } catch (error) {
    console.warn("Failed to save preferred network:", error);
  }
}

/**
 * Get preferred network
 */
export function getPreferredNetwork(): "mainnet" | "testnet" | null {
  try {
    const network = localStorage.getItem(STORAGE_KEYS.PREFERRED_NETWORK);
    return network === "mainnet" || network === "testnet" ? network : null;
  } catch (error) {
    console.warn("Failed to get preferred network:", error);
    return null;
  }
}

/**
 * Save connection preferences
 */
export function saveConnectionPreferences(prefs: ConnectionPreferences): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CONNECTION_PREFERENCES,
      JSON.stringify(prefs)
    );
  } catch (error) {
    console.warn("Failed to save connection preferences:", error);
  }
}

/**
 * Get connection preferences
 */
export function getConnectionPreferences(): ConnectionPreferences | null {
  try {
    const prefs = localStorage.getItem(STORAGE_KEYS.CONNECTION_PREFERENCES);
    return prefs ? JSON.parse(prefs) : null;
  } catch (error) {
    console.warn("Failed to get connection preferences:", error);
    return null;
  }
}

/**
 * Clear all wallet storage
 */
export function clearWalletStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("Failed to clear wallet storage:", error);
  }
}

