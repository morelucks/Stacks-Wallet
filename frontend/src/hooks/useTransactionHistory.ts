/**
 * Hook for tracking transaction history
 * Fetches and manages transaction history for the connected wallet
 */

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../components/WalletConnect";
import type { NetworkKey } from "../types/wallet";

export interface Transaction {
  txId: string;
  txType: string;
  status: string;
  blockHeight: number | null;
  timestamp: number;
  contractCall?: {
    contractId: string;
    functionName: string;
  };
}

export interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching transaction history
 */
export function useTransactionHistory(network: NetworkKey): UseTransactionHistoryReturn {
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = network === "mainnet"
        ? "https://api.mainnet.hiro.so"
        : "https://api.testnet.hiro.so";

      const response = await fetch(
        `${apiUrl}/extended/v1/address/${address}/transactions?limit=50`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      const txList: Transaction[] = (data.results || []).map((tx: any) => ({
        txId: tx.tx_id,
        txType: tx.tx_type,
        status: tx.tx_status,
        blockHeight: tx.block_height,
        timestamp: tx.burn_block_time || Date.now() / 1000,
        contractCall: tx.contract_call
          ? {
              contractId: tx.contract_call.contract_id,
              functionName: tx.contract_call.function_name,
            }
          : undefined,
      }));

      setTransactions(txList);
    } catch (err: any) {
      setError(err.message || "Failed to load transaction history");
      console.error("Transaction history error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    fetchTransactions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refresh: fetchTransactions,
  };
}

