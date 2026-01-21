/**
 * Transaction History Component
 * Displays transaction history for the connected wallet
 */

import { useTransactionHistory } from "../hooks/useTransactionHistory";
import { useWallet } from "./WalletConnect";
import type { NetworkKey } from "../types/wallet";
import { formatAddress } from "../utils/wallet.utils";

interface TransactionHistoryProps {
  network: NetworkKey;
}

export function TransactionHistory({ network }: TransactionHistoryProps) {
  const { isConnected } = useWallet();
  const { transactions, isLoading, error, refresh } = useTransactionHistory(network);

  if (!isConnected) {
    return (
      <div className="section">
        <h2>Transaction History</h2>
        <p>Please connect your wallet to view transaction history.</p>
      </div>
    );
  }

  return (
    <div className="section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Transaction History</h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          style={{ padding: "0.5rem 1rem" }}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="error" style={{ marginTop: "1rem" }}>
          {error}
        </div>
      )}

      {isLoading && transactions.length === 0 ? (
        <p style={{ marginTop: "1rem", color: "#666" }}>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p style={{ marginTop: "1rem", color: "#666" }}>No transactions found.</p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {transactions.map((tx) => (
            <div
              key={tx.txId}
              style={{
                padding: "1rem",
                marginBottom: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <code style={{ fontSize: "0.875rem" }}>{formatAddress(tx.txId, 8, 8)}</code>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        backgroundColor:
                          tx.status === "success"
                            ? "#e8f5e9"
                            : tx.status === "pending"
                            ? "#fff3e0"
                            : "#ffebee",
                        color:
                          tx.status === "success"
                            ? "#2e7d32"
                            : tx.status === "pending"
                            ? "#e65100"
                            : "#c62828",
                      }}
                    >
                      {tx.status}
                    </span>
                  </div>

                  {tx.contractCall && (
                    <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.25rem" }}>
                      <strong>Function:</strong> {tx.contractCall.functionName}
                      {" "}on {formatAddress(tx.contractCall.contractId, 6, 6)}
                    </div>
                  )}

                  <div style={{ fontSize: "0.875rem", color: "#666" }}>
                    {tx.blockHeight ? `Block: ${tx.blockHeight}` : "Pending"}
                    {" · "}
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </div>
                </div>

                <a
                  href={`https://explorer.hiro.so/txid/${tx.txId}?chain=${network}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                >
                  View →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

