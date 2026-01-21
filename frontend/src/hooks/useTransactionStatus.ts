/**
 * Hook for polling transaction status
 * Monitors transaction status until confirmed or failed
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { NetworkKey } from "../types/wallet";

export type TransactionStatus = "pending" | "success" | "failed" | "unknown";

export interface TransactionStatusInfo {
  status: TransactionStatus;
  blockHeight: number | null;
  confirmations: number;
  error?: string;
}

export interface UseTransactionStatusReturn {
  status: TransactionStatusInfo;
  isLoading: boolean;
  poll: (txId: string) => void;
  stopPolling: () => void;
}

/**
 * Hook for polling transaction status
 */
export function useTransactionStatus(network: NetworkKey): UseTransactionStatusReturn {
  const [status, setStatus] = useState<TransactionStatusInfo>({
    status: "unknown",
    blockHeight: null,
    confirmations: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async (txId: string) => {
    try {
      const apiUrl = network === "mainnet"
        ? "https://api.mainnet.hiro.so"
        : "https://api.testnet.hiro.so";

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }

      const data = await response.json();
      const txStatus = data.tx_status as string;
      const blockHeight = data.block_height as number | null;

      let status: TransactionStatus = "unknown";
      if (txStatus === "success") {
        status = "success";
      } else if (txStatus === "pending" || txStatus === "submitted") {
        status = "pending";
      } else if (txStatus === "abort_by_response" || txStatus === "abort_by_post_condition") {
        status = "failed";
      }

      setStatus({
        status,
        blockHeight,
        confirmations: blockHeight ? Math.max(0, (data.burn_block_height || 0) - blockHeight) : 0,
      });

      // Stop polling if transaction is confirmed or failed
      if (status === "success" || status === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      setStatus({
        status: "unknown",
        blockHeight: null,
        confirmations: 0,
        error: err.message,
      });
    }
  }, [network]);

  const poll = useCallback((txId: string) => {
    setCurrentTxId(txId);
    setIsLoading(true);
    setStatus({
      status: "pending",
      blockHeight: null,
      confirmations: 0,
    });

    // Check immediately
    checkStatus(txId);

    // Then poll every 5 seconds
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (currentTxId) {
        checkStatus(currentTxId);
      }
    }, 5000);
  }, [checkStatus, currentTxId]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isLoading,
    poll,
    stopPolling,
  };
}

