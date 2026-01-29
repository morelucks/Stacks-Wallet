import React from 'react';
import { Transaction } from '../../types/transaction';
import './transactions.css';

interface TransactionStatsProps {
  transactions: Transaction[];
  loading: boolean;
}

const TransactionStats: React.FC<TransactionStatsProps> = ({
  transactions,
  loading,
}) => {
  const calculateStats = () => {
    if (transactions.length === 0) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        failed: 0,
        totalAmount: BigInt(0),
        avgAmount: BigInt(0),
      };
    }

    const confirmed = transactions.filter(tx => tx.status === 'confirmed').length;
    const pending = transactions.filter(tx => tx.status === 'pending').length;
    const failed = transactions.filter(tx => tx.status === 'failed').length;
    
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, BigInt(0));
    const avgAmount = transactions.length > 0 ? totalAmount / BigInt(transactions.length) : BigInt(0);

    return {
      total: transactions.length,
      confirmed,
      pending,
      failed,
      totalAmount,
      avgAmount,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="transaction-stats">
        <h3>Transaction Statistics</h3>
        <p className="muted">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="transaction-stats">
      <h3>Transaction Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#4ade80' }}>
            {stats.confirmed}
          </div>
          <div className="stat-label">Confirmed</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {stats.pending}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {stats.failed}
          </div>
          <div className="stat-label">Failed</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">
            {stats.totalAmount.toString()}
          </div>
          <div className="stat-label">Total Volume</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">
            {stats.avgAmount.toString()}
          </div>
          <div className="stat-label">Average Amount</div>
        </div>
      </div>
    </div>
  );
};

export default TransactionStats;