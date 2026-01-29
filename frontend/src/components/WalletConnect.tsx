/**
 * Reown AppKit Wallet Connection Component
 * 
 * Provides a React hook for connecting to Stacks wallets via Reown AppKit (WalletConnect).
 * Handles connection state, error management, and provides a clean API for wallet operations.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import type { UseWalletReturn, WalletError } from "../types/wallet";
import { validateProjectId } from "../config/wallet.config";
import { createWalletError, extractErrorMessage, isUserRejection } from "../utils/wallet.utils";
import { appKit } from "../lib/appkit.instance";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { saveLastConnectedAddress, getLastConnectedAddress } from "../lib/wallet.storage";

// Validate project ID on module load
if (typeof window !== "undefined") {
  validateProjectId();
}

/**
 * Custom hook for wallet connection management
 * 
 * @returns {UseWalletReturn} Wallet state and connection methods
 * 
 * @example
 * ```tsx
 * const { address, isConnected, connect, disconnect } = useWallet();
 * 
 * return (
 *   <button onClick={connect} disabled={isConnecting}>
 *     {isConnected ? `Connected: ${address}` : "Connect Wallet"}
 *   </button>
 * );
 * ```
 */
export function useWallet(): UseWalletReturn {
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);
  const isMountedRef = useRef(true);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use connection persistence hook
  useWalletConnection();

  // Sync address from AppKit and save to storage
  useEffect(() => {
    if (appKitAddress) {
      saveLastConnectedAddress(appKitAddress);
    }
  }, [appKitAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Connect to a wallet via Reown AppKit
   */
  const connect = useCallback(async (): Promise<void> => {
    if (isConnecting) {
      console.warn("Wallet connection already in progress");
      return;
    }

    if (appKitAddress) {
      console.warn("Wallet already connected");
      return;
    }

    setIsConnecting(true);
    setError(null);

    // Set connection timeout (30 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isConnecting) {
        setIsConnecting(false);
        setError(
          createWalletError(
            "CONNECTION_TIMEOUT",
            "Wallet connection timed out. Please try again.",
            null
          )
        );
      }
    }, 30000);

    try {
      await open();
      // Clear timeout on success
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setIsConnecting(false);
    } catch (err) {
      if (!isMountedRef.current) return;

      // Clear timeout on error
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      const errorMessage = extractErrorMessage(err);
      const isRejection = isUserRejection(err);

      // Don't show error for user rejections (they're expected)
      if (!isRejection) {
        setError(
          createWalletError(
            "CONNECTION_ERROR",
            `Failed to connect wallet: ${errorMessage}`,
            err
          )
        );
        console.error("Wallet connection error:", err);
      }

      setIsConnecting(false);
    }
  }, [isConnecting, appKitAddress, open]);

  /**
   * Disconnect from the current wallet
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (!appKitAddress) {
      console.warn("No wallet connected to disconnect");
      return;
    }

    try {
      await appKit.disconnect();
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = extractErrorMessage(err);
      setError(
        createWalletError(
          "DISCONNECTION_ERROR",
          `Failed to disconnect wallet: ${errorMessage}`,
          err
        )
      );
      console.error("Wallet disconnection error:", err);
    }
  }, [appKitAddress]);

  /**
   * Clear any wallet errors
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    address: appKitAddress || null,
    isConnected: appKitConnected || false,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
  };
}
