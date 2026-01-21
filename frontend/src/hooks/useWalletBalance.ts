/**
 * Hook for fetching wallet balance
 * Integrates with Stacks network to get STX balance
 */

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../components/WalletConnect";
import { createNetwork, STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";

interface UseWalletBalanceReturn {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWalletBalance(network: "mainnet" | "testnet" = "testnet"): UseWalletBalanceReturn {
  const { address, isConnected } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !isConnected) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stacksNetwork = createNetwork({
        network: network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET,
      });

      const response = await fetch(
        `${stacksNetwork.client.baseUrl}/v2/accounts/${address}?proof=0`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }

      const data = await response.json();
      const stxBalance = data.balance ? (BigInt(data.balance) / BigInt(1000000)).toString() : "0";
      setBalance(stxBalance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Balance fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, network]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, address, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  };
}

