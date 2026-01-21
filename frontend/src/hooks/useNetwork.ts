/**
 * Network management hook
 * Provides network configuration and utilities
 */

import { useMemo, useState } from "react";
import { STACKS_MAINNET, STACKS_TESTNET, createNetwork } from "@stacks/network";
import type { NetworkKey } from "../types/wallet";

const DEFAULT_NETWORK: NetworkKey =
  (import.meta.env.VITE_STACKS_NETWORK as NetworkKey) === "mainnet" ? "mainnet" : "testnet";

function buildNetwork(network: NetworkKey) {
  const overrideUrl = import.meta.env.VITE_STACKS_API_URL as string | undefined;
  const base = network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
  return createNetwork({
    network: base,
    client: { baseUrl: overrideUrl ?? base.client.baseUrl },
  });
}

export interface UseNetworkReturn {
  network: NetworkKey;
  setNetwork: (network: NetworkKey) => void;
  stacksNetwork: ReturnType<typeof createNetwork>;
  apiBaseUrl: string;
}

export function useNetwork(initialNetwork?: NetworkKey): UseNetworkReturn {
  const [network, setNetwork] = useState<NetworkKey>(initialNetwork ?? DEFAULT_NETWORK);
  
  const stacksNetwork = useMemo(() => buildNetwork(network), [network]);
  const apiBaseUrl = stacksNetwork.client.baseUrl;

  return { network, setNetwork, stacksNetwork, apiBaseUrl };
}

