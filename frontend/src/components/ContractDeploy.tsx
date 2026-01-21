/**
 * Contract Deployment Component
 * 
 * Provides a user-friendly UI for deploying Clarity smart contracts
 * directly from the frontend using the connected wallet via Reown AppKit.
 * 
 * Features:
 * - Contract name and source code input
 * - Configurable transaction fee
 * - Clarity version selection
 * - Real-time deployment status
 * - Transaction ID display with explorer links
 */

import { useState, useCallback } from "react";
import { useContractDeploy } from "../hooks/useContractDeploy";
import { useWallet } from "./WalletConnect";
import { ClarityVersion } from "@stacks/transactions";
import type { NetworkKey } from "../types/wallet";
import { 
  validateContractName, 
  validateContractSource,
  getRecommendedFee,
  formatFee 
} from "../utils/contract.utils";
import { contractTemplates, getTemplate } from "../data/contractTemplates";

interface ContractDeployProps {
  network: NetworkKey;
}

export function ContractDeploy({ network }: ContractDeployProps) {
  const { isConnected, address } = useWallet();
  const { deploy, isDeploying, error, clearError, lastTxId } = useContractDeploy();
  
  const [contractName, setContractName] = useState("");
  const [contractSource, setContractSource] = useState("");
  const [fee, setFee] = useState(() => getRecommendedFee(network).toString());
  const [clarityVersion, setClarityVersion] = useState<ClarityVersion>(ClarityVersion.Clarity4);
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = getTemplate(templateId);
    if (template) {
      setContractSource(template.source);
      setSelectedTemplate(templateId);
    }
  }, []);

  // Update fee when network changes
  const updateFeeForNetwork = useCallback(() => {
    setFee(getRecommendedFee(network).toString());
  }, [network]);

  // Validate contract name on change
  const handleNameChange = useCallback((value: string) => {
    setContractName(value);
    const validation = validateContractName(value);
    setNameError(validation.valid ? null : validation.error || null);
  }, []);

  const handleDeploy = useCallback(async () => {
    // Validate contract name
    const nameValidation = validateContractName(contractName);
    if (!nameValidation.valid) {
      alert(nameValidation.error);
      return;
    }

    // Validate contract source
    const sourceValidation = validateContractSource(contractSource);
    if (!sourceValidation.valid) {
      alert(sourceValidation.error);
      return;
    }

    // Validate fee
    const feeNum = Number.parseInt(fee, 10);
    if (isNaN(feeNum) || feeNum <= 0) {
      alert("Please enter a valid fee (in micro-STX)");
      return;
    }

    const txId = await deploy({
      contractName: contractName.trim(),
      contractSource: contractSource.trim(),
      network,
      fee: feeNum,
      clarityVersion,
    });

    if (txId) {
      // Success - form will show txId
      console.log("Contract deployed:", txId);
    }
  }, [contractName, contractSource, fee, clarityVersion, network, deploy]);

  if (!isConnected) {
    return (
      <div className="section">
        <h2>Deploy Smart Contract</h2>
        <p>Please connect your wallet to deploy contracts.</p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Deploy Smart Contract</h2>
      <p>Deploy Clarity contracts directly from your connected wallet.</p>
      
      <div style={{ marginTop: "1rem" }}>
        <label>
          <strong>Contract Name:</strong>
          <input
            type="text"
            value={contractName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="my-contract"
            disabled={isDeploying}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
          />
          {nameError && (
            <div style={{ color: "#ff6b6b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              {nameError}
            </div>
          )}
        </label>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>
          <strong>Contract Templates (optional):</strong>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            disabled={isDeploying}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem" }}
          >
            <option value="">Select a template...</option>
            {contractTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>
          <strong>Contract Source Code (Clarity):</strong>
          <textarea
            value={contractSource}
            onChange={(e) => setContractSource(e.target.value)}
            placeholder={"(define-public (hello-world)\n  (ok \"Hello, World!\"))"}
            disabled={isDeploying}
            rows={15}
            style={{ 
              width: "100%", 
              marginTop: "0.5rem", 
              padding: "0.5rem",
              fontFamily: "monospace",
              fontSize: "0.875rem"
            }}
          />
        </label>
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label>
          <strong>Fee (micro-STX):</strong>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              disabled={isDeploying}
              style={{ width: "150px", padding: "0.5rem" }}
            />
            <span style={{ fontSize: "0.875rem", color: "#666" }}>
              ({formatFee(Number.parseInt(fee) || 0)} STX)
            </span>
            <button
              type="button"
              onClick={updateFeeForNetwork}
              disabled={isDeploying}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              title="Reset to recommended fee"
            >
              Reset
            </button>
          </div>
        </label>

        <label>
          <strong>Clarity Version:</strong>
          <select
            value={clarityVersion}
            onChange={(e) => setClarityVersion(Number(e.target.value) as ClarityVersion)}
            disabled={isDeploying}
            style={{ marginTop: "0.5rem", padding: "0.5rem" }}
          >
            <option value={ClarityVersion.Clarity1}>Clarity 1</option>
            <option value={ClarityVersion.Clarity2}>Clarity 2</option>
            <option value={ClarityVersion.Clarity3}>Clarity 3</option>
            <option value={ClarityVersion.Clarity4}>Clarity 4</option>
          </select>
        </label>
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
          <strong>✅ Contract deployed successfully!</strong>
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

      <button
        onClick={handleDeploy}
        disabled={isDeploying || !contractName.trim() || !contractSource.trim() || !!nameError}
        style={{ 
          marginTop: "1rem", 
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          cursor: isDeploying ? "wait" : "pointer"
        }}
      >
        {isDeploying ? "Deploying..." : "Deploy Contract"}
      </button>

      <div style={{ 
        marginTop: "1rem", 
        padding: "1rem", 
        backgroundColor: "#f5f5f5", 
        borderRadius: "4px",
        fontSize: "0.875rem" 
      }}>
        <p><strong>Deploying from:</strong> {address}</p>
        <p><strong>Network:</strong> {network === "mainnet" ? "Mainnet" : "Testnet"}</p>
        <p><strong>Estimated fee:</strong> {formatFee(Number.parseInt(fee) || 0)} STX</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#999" }}>
          Make sure you have sufficient STX balance to cover the deployment fee.
        </p>
      </div>
    </div>
  );
}
