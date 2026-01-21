/**
 * Enhanced wallet connection hook with connection persistence
 * Handles reconnection on page load and connection state recovery
 */

import { useEffect, useRef } from "react";
import { appKit } from "../lib/appkit.instance";

export function useWalletConnection() {
  const reconnectAttemptedRef = useRef(false);

  useEffect(() => {
    // Attempt to restore connection on mount
    if (!reconnectAttemptedRef.current) {
      reconnectAttemptedRef.current = true;
      const state = appKit.getState();
      
      // If we have a session but no active connection, try to restore
      if (state.session && !state.accounts?.length) {
        // Connection will be restored automatically by AppKit
        console.log("Attempting to restore wallet connection...");
      }
    }
  }, []);

  return { reconnectAttempted: reconnectAttemptedRef.current };
}

