/**
 * Wallet Header Component
 * Displays wallet connection UI and status
 */

import { formatAddress } from "../utils/wallet.utils";
import type { WalletError } from "../types/wallet";

interface WalletHeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  error: WalletError | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onClearError: () => void;
}

export function WalletHeader({
  isConnected,
  isConnecting,
  address,
  error,
  onConnect,
  onDisconnect,
  onClearError,
}: WalletHeaderProps) {
  return (
    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {isConnected ? (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", color: "#fff", fontFamily: "monospace" }}>
            {address ? formatAddress(address) : ""}
          </span>
          <button 
            onClick={onDisconnect} 
            style={{ padding: "0.5rem 1rem" }}
            disabled={isConnecting}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={onConnect} 
          disabled={isConnecting}
          style={{ padding: "0.5rem 1rem" }}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
      {error && (
        <div style={{ 
          padding: "0.5rem", 
          backgroundColor: "rgba(255, 0, 0, 0.1)", 
          border: "1px solid rgba(255, 0, 0, 0.3)",
          borderRadius: "4px",
          fontSize: "0.875rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span style={{ color: "#ff6b6b" }}>{error.message}</span>
          <button 
            onClick={onClearError}
            style={{ 
              padding: "0.25rem 0.5rem", 
              fontSize: "0.75rem",
              background: "transparent",
              border: "none",
              color: "#ff6b6b",
              cursor: "pointer"
            }}
            title="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

