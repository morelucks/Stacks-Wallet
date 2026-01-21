/**
 * Contract Interaction Component
 * 
 * Provides UI for calling public contract functions (mint, transfer, etc.)
 * using the connected wallet via Reown AppKit.
 */

import { useState, useCallback } from "react";
import { useContractCall } from "../hooks/useContractCall";
import { useWallet } from "./WalletConnect";
import { uintCV, standardPrincipalCV, boolCV } from "@stacks/transactions";
import type { NetworkKey } from "../types/wallet";

interface ContractInteractProps {
  contractAddress: string;
  contractName: string;
  network: NetworkKey;
}

export function ContractInteract({ contractAddress, contractName, network }: ContractInteractProps) {
  const { isConnected, address } = useWallet();
  const { call, isCalling, error, clearError, lastTxId } = useContractCall();

  // Mint state
  const [mintAmount, setMintAmount] = useState("");
  const [mintRecipient, setMintRecipient] = useState("");

  // Transfer state
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");

  // Pause state
  const [mintingPaused, setMintingPaused] = useState<boolean | null>(null);

  // Approve state
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");

  // Transfer-from state
  const [transferFromOwner, setTransferFromOwner] = useState("");
  const [transferFromAmount, setTransferFromAmount] = useState("");
  const [transferFromRecipient, setTransferFromRecipient] = useState("");

  const handleMint = useCallback(async () => {
    if (!mintAmount || !mintRecipient) {
      alert("Please enter amount and recipient");
      return;
    }

    const amount = Number.parseInt(mintAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    await call({
      contractAddress,
      contractName,
      functionName: "mint",
      functionArgs: [uintCV(amount), standardPrincipalCV(mintRecipient)],
      network,
    });
  }, [mintAmount, mintRecipient, contractAddress, contractName, network, call]);

  const handleTransfer = useCallback(async () => {
    if (!transferAmount || !transferRecipient || !address) {
      alert("Please enter amount, recipient, and ensure wallet is connected");
      return;
    }

    const amount = Number.parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    await call({
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs: [
        uintCV(amount),
        standardPrincipalCV(address),
        standardPrincipalCV(transferRecipient),
      ],
      network,
    });
  }, [transferAmount, transferRecipient, address, contractAddress, contractName, network, call]);

  const handleSetMintingPaused = useCallback(async (paused: boolean) => {
    await call({
      contractAddress,
      contractName,
      functionName: "set-minting-paused",
      functionArgs: [boolCV(paused)],
      network,
    });
  }, [contractAddress, contractName, network, call]);

  const handleApprove = useCallback(async () => {
    if (!approveSpender || !approveAmount) {
      alert("Please enter spender and amount");
      return;
    }

    const amount = Number.parseInt(approveAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    await call({
      contractAddress,
      contractName,
      functionName: "approve",
      functionArgs: [standardPrincipalCV(approveSpender), uintCV(amount)],
      network,
    });
  }, [approveSpender, approveAmount, contractAddress, contractName, network, call]);

  const handleTransferFrom = useCallback(async () => {
    if (!transferFromOwner || !transferFromAmount || !transferFromRecipient) {
      alert("Please enter owner, amount, and recipient");
      return;
    }

    const amount = Number.parseInt(transferFromAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    await call({
      contractAddress,
      contractName,
      functionName: "transfer-from",
      functionArgs: [
        standardPrincipalCV(transferFromOwner),
        standardPrincipalCV(transferFromRecipient),
        uintCV(amount),
      ],
      network,
    });
  }, [transferFromOwner, transferFromAmount, transferFromRecipient, contractAddress, contractName, network, call]);

  if (!isConnected) {
    return (
      <div className="section">
        <h2>Interact with Contract</h2>
        <p>Please connect your wallet to call contract functions.</p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Interact with Contract</h2>
      <p>Call public functions on {contractName} using your connected wallet.</p>

      {/* Mint Section */}
      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
        <h3>Mint Tokens</h3>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          Mint new tokens (contract owner only)
        </p>

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label>
            <strong>Amount (micro-units):</strong>
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="1000000"
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <label>
            <strong>Recipient:</strong>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input
                type="text"
                value={mintRecipient}
                onChange={(e) => setMintRecipient(e.target.value)}
                placeholder={address || "ST..."}
                disabled={isCalling}
                style={{ flex: 1, padding: "0.5rem" }}
              />
              {address && (
                <button
                  type="button"
                  onClick={() => setMintRecipient(address)}
                  disabled={isCalling}
                  style={{ padding: "0.5rem 1rem", whiteSpace: "nowrap" }}
                >
                  Use Wallet
                </button>
              )}
            </div>
          </label>

          <button
            onClick={handleMint}
            disabled={isCalling || !mintAmount || !mintRecipient}
            style={{ marginTop: "0.5rem", padding: "0.75rem 1.5rem" }}
          >
            {isCalling ? "Minting..." : "Mint Tokens"}
          </button>
        </div>
      </div>

      {/* Transfer Section */}
      <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
        <h3>Transfer Tokens</h3>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          Transfer tokens from your wallet to another address
        </p>

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label>
            <strong>Amount (micro-units):</strong>
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="1000000"
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <label>
            <strong>Recipient:</strong>
            <input
              type="text"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              placeholder="ST..."
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <button
            onClick={handleTransfer}
            disabled={isCalling || !transferAmount || !transferRecipient || !address}
            style={{ marginTop: "0.5rem", padding: "0.75rem 1.5rem" }}
          >
            {isCalling ? "Transferring..." : "Transfer Tokens"}
          </button>
        </div>
      </div>

      {/* Approve Section */}
      <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
        <h3>Approve Spender</h3>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          Allow another address to spend your tokens
        </p>

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label>
            <strong>Spender Address:</strong>
            <input
              type="text"
              value={approveSpender}
              onChange={(e) => setApproveSpender(e.target.value)}
              placeholder="ST..."
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <label>
            <strong>Amount (micro-units):</strong>
            <input
              type="number"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              placeholder="1000000"
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <button
            onClick={handleApprove}
            disabled={isCalling || !approveSpender || !approveAmount}
            style={{ marginTop: "0.5rem", padding: "0.75rem 1.5rem" }}
          >
            {isCalling ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>

      {/* Transfer From Section */}
      <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
        <h3>Transfer From</h3>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          Transfer tokens on behalf of another address (requires approval)
        </p>

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label>
            <strong>Owner Address:</strong>
            <input
              type="text"
              value={transferFromOwner}
              onChange={(e) => setTransferFromOwner(e.target.value)}
              placeholder="ST..."
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <label>
            <strong>Amount (micro-units):</strong>
            <input
              type="number"
              value={transferFromAmount}
              onChange={(e) => setTransferFromAmount(e.target.value)}
              placeholder="1000000"
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <label>
            <strong>Recipient:</strong>
            <input
              type="text"
              value={transferFromRecipient}
              onChange={(e) => setTransferFromRecipient(e.target.value)}
              placeholder="ST..."
              disabled={isCalling}
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
            />
          </label>

          <button
            onClick={handleTransferFrom}
            disabled={isCalling || !transferFromOwner || !transferFromAmount || !transferFromRecipient}
            style={{ marginTop: "0.5rem", padding: "0.75rem 1.5rem" }}
          >
            {isCalling ? "Transferring..." : "Transfer From"}
          </button>
        </div>
      </div>

      {/* Admin Section */}
      <div style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
        <h3>Admin Functions</h3>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          Control minting (contract owner only)
        </p>

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => handleSetMintingPaused(true)}
            disabled={isCalling}
            style={{ padding: "0.75rem 1.5rem" }}
          >
            {isCalling ? "Pausing..." : "Pause Minting"}
          </button>
          <button
            onClick={() => handleSetMintingPaused(false)}
            disabled={isCalling}
            style={{ padding: "0.75rem 1.5rem" }}
          >
            {isCalling ? "Unpausing..." : "Unpause Minting"}
          </button>
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginTop: "1rem" }}>
          <strong>Error:</strong> {error.message}
          <button onClick={clearError} style={{ marginLeft: "1rem" }}>Dismiss</button>
        </div>
      )}

      {lastTxId && (
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#e8f5e9",
          borderRadius: "4px"
        }}>
          <strong>✅ Transaction successful!</strong>
          <p>Transaction ID: <code>{lastTxId}</code></p>
          <p>
            <a
              href={`https://explorer.hiro.so/txid/${lastTxId}?chain=${network}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

