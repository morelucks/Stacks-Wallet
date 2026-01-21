/**
 * Reusable Wallet Connection Button Component
 * Provides a consistent UI for wallet connection across the app
 */

import { useWallet } from "./WalletConnect";
import { formatAddress } from "../utils/wallet.utils";
import type { WalletError } from "../types/wallet";

interface WalletButtonProps {
  className?: string;
  showAddress?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function WalletButton({
  className = "",
  showAddress = true,
  onConnect,
  onDisconnect,
}: WalletButtonProps) {
  const { address, isConnected, isConnecting, error, connect, disconnect, clearError } = useWallet();

  const handleConnect = async () => {
    await connect();
    onConnect?.();
  };

  const handleDisconnect = async () => {
    await disconnect();
    onDisconnect?.();
  };

  if (isConnected && address) {
    return (
      <div className={`wallet-button ${className}`}>
        {showAddress && (
          <span className="wallet-address" style={{ fontFamily: "monospace" }}>
            {formatAddress(address)}
          </span>
        )}
        <button onClick={handleDisconnect} disabled={isConnecting}>
          Disconnect
        </button>
        {error && (
          <button onClick={clearError} className="error-dismiss">
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`wallet-button ${className}`}>
      <button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && (
        <div className="wallet-error">
          <span>{error.message}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}
    </div>
  );
}

