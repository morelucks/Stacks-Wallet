/**
 * Configuration Panel Component
 * Handles network, contract, and principal configuration
 */

import type { NetworkKey } from "../types/wallet";
import { formatAddress } from "../utils/wallet.utils";

interface ConfigurationPanelProps {
  network: NetworkKey;
  onNetworkChange: (network: NetworkKey) => void;
  contractAddress: string;
  onContractAddressChange: (address: string) => void;
  contractName: string;
  onContractNameChange: (name: string) => void;
  principal: string;
  onPrincipalChange: (principal: string) => void;
  isConnected: boolean;
  connectedAddress: string | null;
  onLoadTokenInfo: () => void;
  onLoadBalance: () => void;
  onLoadActivity?: () => void;
  onClearResults: () => void;
  loading: boolean;
  activityLoading?: boolean;
  showActivity?: boolean;
}

export function ConfigurationPanel({
  network,
  onNetworkChange,
  contractAddress,
  onContractAddressChange,
  contractName,
  onContractNameChange,
  principal,
  onPrincipalChange,
  isConnected,
  connectedAddress,
  onLoadTokenInfo,
  onLoadBalance,
  onLoadActivity,
  onClearResults,
  loading,
  activityLoading = false,
  showActivity = false,
}: ConfigurationPanelProps) {
  return (
    <section className="panel">
      <h2>Configuration</h2>
      <div className="grid two">
        <label className="field">
          <span>Network</span>
          <select value={network} onChange={(e) => onNetworkChange(e.target.value as NetworkKey)}>
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </label>
        <label className="field">
          <span>Contract address</span>
          <input
            value={contractAddress}
            onChange={(e) => onContractAddressChange(e.target.value)}
            placeholder="ST... contract deployer address"
          />
        </label>
        <label className="field">
          <span>Contract name</span>
          <input
            value={contractName}
            onChange={(e) => onContractNameChange(e.target.value)}
            placeholder="token-contract"
          />
        </label>
        <label className="field">
          <span>Principal to check balance</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={principal}
              onChange={(e) => onPrincipalChange(e.target.value)}
              placeholder={isConnected ? connectedAddress || "ST... or contract principal" : "ST... or contract principal"}
              style={{ flex: 1 }}
            />
            {isConnected && connectedAddress && (
              <button
                type="button"
                onClick={() => onPrincipalChange(connectedAddress)}
                style={{ padding: "0.5rem 1rem", whiteSpace: "nowrap" }}
                title="Use connected wallet address"
              >
                Use Wallet
              </button>
            )}
          </div>
        </label>
      </div>
      <div className="actions">
        <button onClick={onLoadTokenInfo} disabled={loading}>
          {loading ? "Loading..." : "Load token info"}
        </button>
        <button onClick={onLoadBalance} disabled={loading}>
          {loading ? "Loading..." : "Get balance"}
        </button>
        {showActivity && onLoadActivity && (
          <button onClick={onLoadActivity} disabled={activityLoading}>
            {activityLoading ? "Loading..." : "Load Chainhooks activity"}
          </button>
        )}
        <button onClick={onClearResults} disabled={loading}>
          Clear results
        </button>
      </div>
    </section>
  );
}

