/**
 * Hook for loading Chainhooks activity
 */

import { useState, useCallback } from "react";
import type { NetworkKey } from "../types/wallet";

export interface UseActivityReturn {
  activity: any[];
  loading: boolean;
  error: string | null;
  loadActivity: () => Promise<void>;
}

export function useActivity(network: NetworkKey): UseActivityReturn {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hooksServerUrl = import.meta.env.VITE_HOOKS_SERVER_URL as string | undefined;

  const loadActivity = useCallback(async () => {
    if (!hooksServerUrl) {
      setError("VITE_HOOKS_SERVER_URL not configured in .env");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = new URL(`${hooksServerUrl}/activity`);
      url.searchParams.set("limit", "20");
      url.searchParams.set("network", network);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Activity API error: ${res.statusText}`);
      const data = await res.json();
      setActivity(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [network, hooksServerUrl]);

  return { activity, loading, error, loadActivity };
}

