import React, { useState } from 'react';
import { Transaction } from '../../types/transaction';
import TransactionDetail from './TransactionDetail';
import './transactions.css';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading,
  onLoadMore,
  hasMore = false,
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const formatAddress = (address: string) => {
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: bigint) => {
    return amount.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed': return '#4ade80';
      case 'pending': return '#fbbf24';
      case 'failed': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'transfer': return '→';
      case 'mint': return '+';
      case 'approve': return '✓';
      case 'contract-call': return '⚡';
      default: return '•';
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTransaction(null);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transaction-list">
        <h3>Transaction History</h3>
        <p className="muted">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="transaction-list">
        <h3>Transaction History</h3>
        <p className="muted">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <h3>Transaction History</h3>
      <div className="transactions-container">
        {transactions.map((tx) => (
          <div 
            key={tx.txid} 
            className="transaction-item"
            onClick={() => handleTransactionClick(tx)}
          >
            <div className="transaction-header">
              <div className="transaction-type">
                <span className="type-icon">{getTypeIcon(tx.type)}</span>
                <span className="type-text">{tx.type}</span>
              </div>
              <div 
                className="transaction-status"
                style={{ color: getStatusColor(tx.status) }}
              >
                {tx.status}
              </div>
            </div>
            
            <div className="transaction-details">
              <div className="transaction-addresses">
                <div className="address-row">
                  <span className="label">From:</span>
                  <span className="address">{formatAddress(tx.sender)}</span>
                </div>
                {tx.recipient && (
                  <div className="address-row">
                    <span className="label">To:</span>
                    <span className="address">{formatAddress(tx.recipient)}</span>
                  </div>
                )}
              </div>
              
              <div className="transaction-meta">
                <div className="amount">
                  {tx.amount > 0n && `${formatAmount(tx.amount)} tokens`}
                </div>
                <div className="date">{formatDate(tx.timestamp)}</div>
              </div>
            </div>

            <div className="transaction-footer">
              <span className="txid">
                TX: {formatAddress(tx.txid)}
              </span>
              {tx.blockHeight > 0 && (
                <span className="block">
                  Block: {tx.blockHeight}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button 
            onClick={onLoadMore} 
            disabled={loading}
            className="load-more-button"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      <TransactionDetail
        transaction={selectedTransaction}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default TransactionList;