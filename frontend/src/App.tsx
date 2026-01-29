import { useMemo, useState } from "react";
import "./App.css";
import { cvToJSON, fetchCallReadOnlyFunction, standardPrincipalCV } from "@stacks/transactions";
import { STACKS_MAINNET, STACKS_TESTNET, createNetwork } from "@stacks/network";
import { useWallet } from "./components/WalletConnect";
import { formatAddress } from "./utils/wallet.utils";
import { ContractDeploy } from "./components/ContractDeploy";
import { ContractInteract } from "./components/ContractInteract";
import { TransactionHistory } from "./components/TransactionHistory";
import { RewardCard } from "./components/rewards/RewardCard";
import { Leaderboard } from "./components/rewards/Leaderboard";
import { ActivityTracker } from "./components/rewards/ActivityTracker";
import { MultiplierSettings } from "./components/rewards/MultiplierSettings";
import "./styles/rewards.css";

type NetworkKey = "mainnet" | "testnet";

const DEFAULT_NETWORK: NetworkKey =
  (import.meta.env.VITE_STACKS_NETWORK as NetworkKey) === "mainnet" ? "mainnet" : "testnet";
const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
const DEFAULT_CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME ?? "token-contract";

function buildNetwork(network: NetworkKey) {
  const overrideUrl = import.meta.env.VITE_STACKS_API_URL as string | undefined;
  const base = network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
  return createNetwork({
    network: base,
    client: { baseUrl: overrideUrl ?? base.client.baseUrl },
  });
}

function extractOk(value: any) {
  if (value?.type === "response" && value.success) {
    return value.value;
  }
  if (value?.type === "response") {
    throw new Error(`Contract error: ${JSON.stringify(value.value)}`);
  }
  return value;
}

function formatUint(cv: any): bigint {
  if (cv?.type === "uint" && cv.value !== undefined) return BigInt(cv.value);
  throw new Error("Unexpected uint value");
}

function formatString(cv: any): string {
  if ((cv?.type === "string-ascii" || cv?.type === "string-utf8") && cv.value !== undefined) {
    return String(cv.value);
  }
  throw new Error("Unexpected string value");
}

function App() {
  const { address, isConnected, isConnecting, error: walletError, connect, disconnect, clearError } = useWallet();
  const [network, setNetwork] = useState<NetworkKey>(DEFAULT_NETWORK);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [contractName, setContractName] = useState(DEFAULT_CONTRACT_NAME);
  const [principal, setPrincipal] = useState("");

  const [tokenName, setTokenName] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const stacksNetwork = useMemo(() => buildNetwork(network), [network]);
  const apiBaseUrl = stacksNetwork.client.baseUrl;

  const ensureContract = () => {
    if (!contractAddress || !contractName) {
      throw new Error("Contract address and name are required");
    }
  };

  const readTokenName = async () => {
    ensureContract();
    const clarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-name",
      functionArgs: [],
      senderAddress: contractAddress,
      network: stacksNetwork,
    });
    const json = cvToJSON(clarityValue) as any;
    const ok = extractOk(json);
    setTokenName(formatString(ok));
  };

  const readTotalSupply = async () => {
    ensureContract();
    const clarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-total-supply",
      functionArgs: [],
      senderAddress: contractAddress,
      network: stacksNetwork,
    });
    const json = cvToJSON(clarityValue) as any;
    const ok = extractOk(json);
    setTotalSupply(formatUint(ok));
  };

  const readBalance = async () => {
    ensureContract();
    if (!principal) throw new Error("Enter a principal to query its balance");
    const clarityValue = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-balance",
      functionArgs: [standardPrincipalCV(principal)],
      senderAddress: contractAddress,
      network: stacksNetwork,
    });
    const json = cvToJSON(clarityValue) as any;
    const ok = extractOk(json);
    setBalance(formatUint(ok));
  };

  const loadTokenInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([readTokenName(), readTotalSupply()]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load token info");
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      await readBalance();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load balance");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTokenName(null);
    setTotalSupply(null);
    setBalance(null);
    setError(null);
  };

  const hooksServerUrl = import.meta.env.VITE_HOOKS_SERVER_URL as string | undefined;

  const loadActivity = async () => {
    if (!hooksServerUrl) {
      setError("VITE_HOOKS_SERVER_URL not configured in .env");
      return;
    }
    try {
      setActivityLoading(true);
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
      setActivityLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Stacks Wallet UI</p>
          <h1>Interact with the SIP-010 token</h1>
          <p className="lede">
            Configure your deployed contract, pick a network, and query token metadata, supply,
            and balances. This UI uses read-only calls (no private keys required).
          </p>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {isConnected ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.875rem", color: "#fff", fontFamily: "monospace" }}>
                {address ? formatAddress(address) : ""}
              </span>
              <button
                onClick={disconnect}
                style={{ padding: "0.5rem 1rem" }}
                disabled={isConnecting}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              style={{ padding: "0.5rem 1rem" }}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          {walletError && (
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
              <span style={{ color: "#ff6b6b" }}>{walletError.message}</span>
              <button
                onClick={clearError}
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
      </header>

      <section className="panel">
        <h2>Configuration</h2>
        <div className="grid two">
          <label className="field">
            <span>Network</span>
            <select value={network} onChange={(e) => setNetwork(e.target.value as NetworkKey)}>
              <option value="testnet">Testnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </label>
          <label className="field">
            <span>Contract address</span>
            <input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="ST... contract deployer address"
            />
          </label>
          <label className="field">
            <span>Contract name</span>
            <input
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="token-contract"
            />
          </label>
          <label className="field">
            <span>Principal to check balance</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder={isConnected ? address || "ST... or contract principal" : "ST... or contract principal"}
                style={{ flex: 1 }}
              />
              {isConnected && address && (
                <button
                  type="button"
                  onClick={() => setPrincipal(address)}
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
          <button onClick={loadTokenInfo} disabled={loading}>
            {loading ? "Loading..." : "Load token info"}
          </button>
          <button onClick={loadBalance} disabled={loading}>
            {loading ? "Loading..." : "Get balance"}
          </button>
          {hooksServerUrl && (
            <button onClick={loadActivity} disabled={activityLoading}>
              {activityLoading ? "Loading..." : "Load Chainhooks activity"}
            </button>
          )}
          <button onClick={clearResults} disabled={loading}>
            Clear results
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="panel results">
        <h2>Results</h2>
        <div className="grid three">
          <div className="stat">
            <p className="label">Token name</p>
            <p className="value">{tokenName ?? "—"}</p>
          </div>
          <div className="stat">
            <p className="label">Total supply</p>
            <p className="value">{totalSupply !== null ? totalSupply.toString() : "—"}</p>
          </div>
          <div className="stat">
            <p className="label">Balance</p>
            <p className="value">{balance !== null ? balance.toString() : "—"}</p>
          </div>
          <div className="stat">
            <p className="label">Network / API</p>
            <p className="value small">
              {network} · {apiBaseUrl}
            </p>
          </div>
        </div>
      </section>

      {hooksServerUrl && (
        <section className="panel">
          <h2>Chainhooks Activity</h2>
          {activity.length === 0 ? (
            <p className="muted">No activity loaded. Click "Load Chainhooks activity" to fetch recent events.</p>
          ) : (
            <div className="activity-list">
              {activity.map((event, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-header">
                    <span className="activity-txid">{event.txid?.slice(0, 16)}...</span>
                    <span className="activity-time">{new Date(event.received_at).toLocaleString()}</span>
                  </div>
                  <div className="activity-details">
                    <span>Block: {event.block_height}</span>
                    <span>Network: {event.network || event.chain}</span>
                  </div>
                  {event.matched_events && event.matched_events.length > 0 && (
                    <div className="activity-events">
                      {event.matched_events.map((evt: any, i: number) => (
                        <div key={i} className="activity-event">
                          {evt.contract_identifier && (
                            <span className="event-contract">{evt.contract_identifier}</span>
                          )}
                          {evt.function_name && (
                            <span className="event-function">{evt.function_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Rewards Dashboard Section (Commit 14) */}
      <section className="rewards-dashboard py-12">
        <div className="section-header mb-8">
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Rewards & Impact</h2>
          <p className="text-gray-500 text-sm">Boost your earnings by contributing to the Stacks ecosystem.</p>
        </div>

        <div className="rewards-grid">
          <div className="rewards-main-column">
            <RewardCard />
            <div className="mt-8">
              <ActivityTracker />
            </div>
          </div>

          <div className="rewards-sidebar-column">
            <MultiplierSettings />
            <div className="mt-8">
              <Leaderboard />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <ContractDeploy network={network} />
      </section>

      {contractAddress && contractName && (
        <section className="panel">
          <ContractInteract
            contractAddress={contractAddress}
            contractName={contractName}
            network={network}
          />
        </section>
      )}

      <section className="panel">
        <TransactionHistory network={network} />
      </section>
    </div>
  );
}

export default App;
