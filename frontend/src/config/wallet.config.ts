/**
 * Wallet configuration constants and utilities
 */

import { createAppKitNetwork } from "@reown/appkit/networks";

export const WALLET_CONFIG = {
  PROJECT_ID: import.meta.env.VITE_REOWN_PROJECT_ID || "demo-project-id",
  APP_NAME: "Stacks Wallet",
  APP_DESCRIPTION: "SIP-010 Token Wallet",
  APP_URL: typeof window !== "undefined" ? window.location.origin : "",
} as const;

export const STACKS_NETWORKS = {
  mainnet: {
    id: 1,
    name: "Stacks Mainnet",
    network: "mainnet" as const,
    rpcUrl: "https://api.mainnet.hiro.so",
  },
  testnet: {
    id: 2147483648,
    name: "Stacks Testnet",
    network: "testnet" as const,
    rpcUrl: "https://api.testnet.hiro.so",
  },
} as const;

export const stacksMainnet = createAppKitNetwork({
  id: STACKS_NETWORKS.mainnet.id,
  name: STACKS_NETWORKS.mainnet.name,
  network: STACKS_NETWORKS.mainnet.network,
  rpcUrl: STACKS_NETWORKS.mainnet.rpcUrl,
});

export const stacksTestnet = createAppKitNetwork({
  id: STACKS_NETWORKS.testnet.id,
  name: STACKS_NETWORKS.testnet.name,
  network: STACKS_NETWORKS.testnet.network,
  rpcUrl: STACKS_NETWORKS.testnet.rpcUrl,
});

/**
 * Validates that a Project ID is configured
 */
export function validateProjectId(): boolean {
  const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;
  if (!projectId || projectId === "demo-project-id") {
    if (import.meta.env.DEV) {
      console.warn(
        "⚠️ Using demo Project ID. For production, set VITE_REOWN_PROJECT_ID in your .env file"
      );
    }
    return false;
  }
  return true;
}

