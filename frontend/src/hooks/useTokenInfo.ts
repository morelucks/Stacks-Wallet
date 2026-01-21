/**
 * Hook for querying token information (read-only)
 */

import { useState, useCallback } from "react";
import { cvToJSON, fetchCallReadOnlyFunction, standardPrincipalCV } from "@stacks/transactions";
import type { NetworkKey } from "../types/wallet";
import { extractOk, formatUint, formatString } from "../utils/clarity.utils";

export interface UseTokenInfoReturn {
  tokenName: string | null;
  totalSupply: bigint | null;
  balance: bigint | null;
  loading: boolean;
  error: string | null;
  loadTokenInfo: () => Promise<void>;
  loadBalance: (principal: string) => Promise<void>;
  clearResults: () => void;
}

export function useTokenInfo(
  contractAddress: string,
  contractName: string,
  network: NetworkKey,
  stacksNetwork: ReturnType<typeof import("@stacks/network").createNetwork>
): UseTokenInfoReturn {
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureContract = useCallback(() => {
    if (!contractAddress || !contractName) {
      throw new Error("Contract address and name are required");
    }
  }, [contractAddress, contractName]);

  const readTokenName = useCallback(async () => {
    ensureContract();
    const clarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-name",
      functionArgs: [],
      senderAddress: contractAddress,
      network: stacksNetwork,
    });
    const json = cvToJSON(clarityValue) as any;
    const ok = extractOk(json);
    setTokenName(formatString(ok));
  }, [contractAddress, contractName, stacksNetwork, ensureContract]);

  const readTotalSupply = useCallback(async () => {
    ensureContract();
    const clarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-total-supply",
      functionArgs: [],
      senderAddress: contractAddress,
      network: stacksNetwork,
    });
    const json = cvToJSON(clarityValue) as any;
    const ok = extractOk(json);
    setTotalSupply(formatUint(ok));
  }, [contractAddress, contractName, stacksNetwork, ensureContract]);

  const readBalance = useCallback(async (principal: string) => {
    ensureContract();
    if (!principal) throw new Error("Enter a principal to query its balance");
    const clarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-balance",
      functionArgs: [standardPrincipalCV(principal)],
      senderAddress: contractAddress,
      network: stacksNetwork,
    });
    const json = cvToJSON(clarityValue) as any;
    const ok = extractOk(json);
    setBalance(formatUint(ok));
  }, [contractAddress, contractName, stacksNetwork, ensureContract]);

  const loadTokenInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([readTokenName(), readTotalSupply()]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load token info");
    } finally {
      setLoading(false);
    }
  }, [readTokenName, readTotalSupply]);

  const loadBalance = useCallback(async (principal: string) => {
    try {
      setLoading(true);
      setError(null);
      await readBalance(principal);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load balance");
    } finally {
      setLoading(false);
    }
  }, [readBalance]);

  const clearResults = useCallback(() => {
    setTokenName(null);
    setTotalSupply(null);
    setBalance(null);
    setError(null);
  }, []);

  return {
    tokenName,
    totalSupply,
    balance,
    loading,
    error,
    loadTokenInfo,
    loadBalance,
    clearResults,
  };
}

