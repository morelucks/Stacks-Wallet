import { useState } from "react";
import "./App.css";
import { useWallet } from "./components/WalletConnect";
import { useNetwork } from "./hooks/useNetwork";
import { useTokenInfo } from "./hooks/useTokenInfo";
import { useActivity } from "./hooks/useActivity";
import { ContractDeploy } from "./components/ContractDeploy";
import { ContractInteract } from "./components/ContractInteract";
import { TransactionHistory } from "./components/TransactionHistory";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { WalletHeader } from "./components/WalletHeader";

const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "";
const DEFAULT_CONTRACT_NAME = import.meta.env.VITE_CONTRACT_NAME ?? "token-contract";
const HOOKS_SERVER_URL = import.meta.env.VITE_HOOKS_SERVER_URL as string | undefined;

function App() {
  const { address, isConnected, isConnecting, error: walletError, connect, disconnect, clearError } = useWallet();
  const { network, setNetwork, stacksNetwork, apiBaseUrl } = useNetwork();
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [contractName, setContractName] = useState(DEFAULT_CONTRACT_NAME);
  const [principal, setPrincipal] = useState("");

  const tokenInfo = useTokenInfo(contractAddress, contractName, network, stacksNetwork);
  const activity = useActivity(network);

  const handleLoadBalance = async () => {
    if (!principal) {
      return;
    }
    await tokenInfo.loadBalance(principal);
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
        <WalletHeader
          isConnected={isConnected}
          isConnecting={isConnecting}
          address={address}
          error={walletError}
          onConnect={connect}
          onDisconnect={disconnect}
          onClearError={clearError}
        />
      </header>

      <ConfigurationPanel
        network={network}
        onNetworkChange={setNetwork}
        contractAddress={contractAddress}
        onContractAddressChange={setContractAddress}
        contractName={contractName}
        onContractNameChange={setContractName}
        principal={principal}
        onPrincipalChange={setPrincipal}
        isConnected={isConnected}
        connectedAddress={address}
        onLoadTokenInfo={tokenInfo.loadTokenInfo}
        onLoadBalance={handleLoadBalance}
        onLoadActivity={HOOKS_SERVER_URL ? activity.loadActivity : undefined}
        onClearResults={tokenInfo.clearResults}
        loading={tokenInfo.loading}
        activityLoading={activity.loading}
        showActivity={!!HOOKS_SERVER_URL}
      />

      <ResultsPanel
        tokenName={tokenInfo.tokenName}
        totalSupply={tokenInfo.totalSupply}
        balance={tokenInfo.balance}
        network={network}
        apiBaseUrl={apiBaseUrl}
        error={tokenInfo.error}
      />

      {HOOKS_SERVER_URL && (
        <ActivityPanel
          activity={activity.activity}
          loading={activity.loading}
          error={activity.error}
        />
      )}

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
