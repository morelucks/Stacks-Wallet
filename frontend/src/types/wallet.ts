/**
 * Wallet-related TypeScript types and interfaces
 */

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: WalletError | null;
}

export interface WalletError {
  code: string;
  message: string;
  details?: unknown;
}

export interface UseWalletReturn {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: WalletError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export type WalletConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletAccount {
  address: string;
  label?: string;
  balance?: string;
}

export interface WalletNetwork {
  id: number;
  name: string;
  network: "mainnet" | "testnet";
  rpcUrl: string;
}

export interface WalletSession {
  topic: string;
  expiry: number;
  accounts: WalletAccount[];
}

export type NetworkKey = "mainnet" | "testnet";

