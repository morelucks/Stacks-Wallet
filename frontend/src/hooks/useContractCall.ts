/**
 * Hook for calling contract functions using Reown AppKit
 * 
 * Allows users to call public contract functions (mint, transfer, etc.)
 * using their connected wallet for transaction signing.
 */

import { useCallback, useState } from "react";
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  ClarityValue,
} from "@stacks/transactions";
import { STACKS_MAINNET, STACKS_TESTNET, createNetwork } from "@stacks/network";
import { appKit } from "../lib/appkit.instance";
import type { WalletError } from "../types/wallet";
import { createWalletError, extractErrorMessage, isUserRejection } from "../utils/wallet.utils";

export interface CallContractParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network: "mainnet" | "testnet";
  fee?: number;
}

export interface UseContractCallReturn {
  call: (params: CallContractParams) => Promise<string | null>;
  isCalling: boolean;
  error: WalletError | null;
  clearError: () => void;
  lastTxId: string | null;
}

/**
 * Hook for calling contract functions via connected wallet
 */
export function useContractCall(): UseContractCallReturn {
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);
  const [lastTxId, setLastTxId] = useState<string | null>(null);

  const call = useCallback(async (params: CallContractParams): Promise<string | null> => {
    const {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      network: networkKey,
      fee = 150000,
    } = params;

    // Check if wallet is connected
    const state = appKit.getState();
    const address = state.accounts?.[0]?.address;

    if (!address) {
      const err = createWalletError(
        "NOT_CONNECTED",
        "Wallet not connected. Please connect your wallet first.",
        null
      );
      setError(err);
      return null;
    }

    setIsCalling(true);
    setError(null);
    setLastTxId(null);

    console.log("📞 Calling contract function:", {
      contract: `${contractAddress}.${contractName}`,
      function: functionName,
      network: networkKey,
      fee,
    });

    try {
      // Build network
      const baseNetwork = networkKey === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
      const network = createNetwork({
        network: baseNetwork,
        client: { baseUrl: baseNetwork.client.baseUrl },
      });

      // Create the contract call transaction (unsigned)
      const transaction = await makeContractCall({
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        anchorMode: AnchorMode.Any,
        fee,
        postConditionMode: 0x01,
      });

      // Get the Stacks adapter from AppKit to sign the transaction
      const stacksAdapter = appKit.getAdapter("stacks");
      if (!stacksAdapter) {
        throw new Error("Stacks adapter not available. Please connect your wallet first.");
      }

      // Sign the transaction using the wallet adapter
      let signedTx;
      try {
        if (typeof stacksAdapter.signTransaction === "function") {
          signedTx = await stacksAdapter.signTransaction({
            transaction,
            network,
          });
        } else {
          throw new Error("Transaction signing not available through adapter.");
        }
      } catch (signError: any) {
        const errorMsg = extractErrorMessage(signError);
        if (isUserRejection(signError)) {
          return null;
        }
        throw new Error(`Transaction signing failed: ${errorMsg}`);
      }

      if (!signedTx) {
        throw new Error("Transaction signing was cancelled or returned no result");
      }

      // Broadcast the signed transaction
      const broadcastResponse = await broadcastTransaction({
        transaction: signedTx,
        network,
      });

      if ("error" in broadcastResponse) {
        const errorMsg = typeof broadcastResponse.error === "string"
          ? broadcastResponse.error
          : JSON.stringify(broadcastResponse.error);
        throw new Error(`Broadcast failed: ${errorMsg}`);
      }

      const txId = broadcastResponse.txid;
      setLastTxId(txId);
      setIsCalling(false);

      console.log("✅ Contract function called successfully:", {
        txId,
        contract: `${contractAddress}.${contractName}`,
        function: functionName,
        explorerUrl: `https://explorer.hiro.so/txid/${txId}?chain=${networkKey}`,
      });

      return txId;
    } catch (err) {
      setIsCalling(false);

      const errorMessage = extractErrorMessage(err);
      const isRejection = isUserRejection(err);

      if (!isRejection) {
        const callError = createWalletError(
          "CONTRACT_CALL_ERROR",
          `Contract call failed: ${errorMessage}`,
          err
        );
        setError(callError);
        console.error("Contract call error:", err);
      }

      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    call,
    isCalling,
    error,
    clearError,
    lastTxId,
  };
}

