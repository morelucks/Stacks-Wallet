import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '../components/WalletConnect';
import { formatAddress } from '../utils/wallet.utils';
import { STACKS_MAINNET, STACKS_TESTNET, createNetwork } from '@stacks/network';
import { TransactionService } from '../services/transactionService';
import { useTransactions } from '../hooks/useTransactions';
import TransactionList from '../components/transactions/TransactionList';
import TransactionFilter from '../components/transactions/TransactionFilter';
import TransactionStats from '../components/transactions/TransactionStats';
import { TransactionFilter as TxFilter } from '../types/transaction';
import { exportTransactionsToCSV, exportTransactionsToJSON } from '../utils/transactionExport';

type NetworkKey = "mainnet" | "testnet";

const DEFAULT_NETWORK: NetworkKey =
  (import.meta.env.VITE_STACKS_NETWORK as NetworkKey) === "mainnet" ? "mainnet" : "testnet";

function buildNetwork(network: NetworkKey) {
  const overrideUrl = import.meta.env.VITE_STACKS_API_URL as string | undefined;
  const base = network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
  return createNetwork({
    network: base,
    client: { baseUrl: overrideUrl ?? base.client.baseUrl },
  });
}

const TransactionsPage: React.FC = () => {
  const { address, isConnected, isConnecting, error: walletError, connect, disconnect, clearError } = useWallet();
  const [network, setNetwork] = useState<NetworkKey>(DEFAULT_NETWORK);
  const [currentFilter, setCurrentFilter] = useState<TxFilter>({});

  const stacksNetwork = useMemo(() => buildNetwork(network), [network]);
  
  const transactionService = useMemo(() => {
    return new TransactionService(stacksNetwork);
  }, [stacksNetwork]);

  const { 
    transactions, 
    loading, 
    error, 
    hasMore, 
    loadTransactions, 
    refreshTransactions, 
    clearError: clearTxError 
  } = useTransactions(transactionService);

  useEffect(() => {
    if (isConnected && address) {
      refreshTransactions(address, currentFilter);
    }
  }, [isConnected, address, network, refreshTransactions]);

  const handleFilterChange = (filter: TxFilter) => {
    setCurrentFilter(filter);
    if (isConnected && address) {
      refreshTransactions(address, filter);
    }
  };

  const handleLoadMore = () => {
    if (isConnected && address && hasMore && !loading) {
      loadTransactions(address, false, currentFilter);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length > 0) {
      exportTransactionsToCSV(transactions);
    }
  };

  const handleExportJSON = () => {
    if (transactions.length > 0) {
      exportTransactionsToJSON(transactions);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Member Transactions</p>
          <h1>Transaction History</h1>
          <p className="lede">
            View and analyze your wallet's transaction history. Filter by type, status, 
            date range, and amount to find specific transactions.
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

      {!isConnected && (
        <section className="panel">
          <h2>Connect Your Wallet</h2>
          <p className="muted">
            Please connect your wallet to view transaction history. You need a connected wallet 
            to access your transaction data.
          </p>
        </section>
      )}

      {isConnected && (
        <>
          <section className="panel">
            <h2>Network Configuration</h2>
            <div className="grid two">
              <label className="field">
                <span>Network</span>
                <select value={network} onChange={(e) => setNetwork(e.target.value as NetworkKey)}>
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </label>
              <div className="stat">
                <p className="label">API Endpoint</p>
                <p className="value small">{stacksNetwork.client.baseUrl}</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <TransactionStats transactions={transactions} loading={loading} />
          </section>

          <section className="panel">
            <TransactionFilter onFilterChange={handleFilterChange} loading={loading} />
            
            {transactions.length > 0 && (
              <div className="export-actions" style={{ marginBottom: '1rem' }}>
                <button 
                  onClick={handleExportCSV}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    marginRight: '0.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Export CSV
                </button>
                <button 
                  onClick={handleExportJSON}
                  style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Export JSON
                </button>
              </div>
            )}
            
            {error && (
              <div className="error" style={{ marginBottom: '1rem' }}>
                {error}
                <button 
                  onClick={clearTxError}
                  style={{ 
                    marginLeft: '1rem', 
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <TransactionList 
              transactions={transactions}
              loading={loading}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
            />
          </section>
        </>
      )}
    </div>
  );
};

export default TransactionsPage;