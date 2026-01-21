/**
 * Hook for listening to wallet events
 * Provides event handlers for wallet connection lifecycle
 */

import { useEffect, useRef } from "react";
import { appKit } from "../lib/appkit.instance";

interface WalletEventHandlers {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onSessionUpdate?: (session: any) => void;
}

export function useWalletEvents(handlers: WalletEventHandlers) {
  const handlersRef = useRef(handlers);

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const unsubscribe = appKit.subscribe((state) => {
      const { onConnect, onDisconnect, onError, onSessionUpdate } = handlersRef.current;

      // Handle connection
      if (state.accounts?.length && onConnect) {
        const address = state.accounts[0].address;
        onConnect(address);
      }

      // Handle disconnection
      if (!state.accounts?.length && onDisconnect) {
        onDisconnect();
      }

      // Handle session updates
      if (state.session && onSessionUpdate) {
        onSessionUpdate(state.session);
      }
    });

    return unsubscribe;
  }, []);
}

