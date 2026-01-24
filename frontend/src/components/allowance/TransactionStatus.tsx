import React from 'react';
import { TransactionState } from '../../types/allowance';

interface TransactionStatusProps {
  transactions: TransactionState[];
  onRetry: (transactionId: string) => void;
  onCancel: (transactionId: string) => void;
  onClear: (transactionId: string) => void;
  showCompleted?: boolean;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  transactions,
  onRetry,
  onCancel,
  onClear,
  showCompleted = false
}) => {
  const getStatusIcon = (status: TransactionState['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: TransactionState['status']) => {
    switch (status) {
      case 'pending':
        return '#ffa726';
      case 'confirmed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getTransactionTypeLabel = (type: TransactionState['type']) => {
    switch (type) {
      case 'approve':
        return 'Approve Allowance';
      case 'revoke':
        return 'Revoke Allowance';
      case 'bulk_approve':
        return 'Bulk Approve';
      case 'bulk_revoke':
        return 'Bulk Revoke';
      default:
        return 'Transaction';
    }
  };

  const formatTimeRemaining = (estimatedCompletion?: Date) => {
    if (!estimatedCompletion) return null;
    
    const now = new Date();
    const remaining = estimatedCompletion.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Completing...';
    
    const seconds = Math.ceil(remaining / 1000);
    if (seconds < 60) return `${seconds}s remaining`;
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
  };

  const visibleTransactions = showCompleted 
    ? transactions 
    : transactions.filter(tx => tx.status !== 'confirmed');

  if (visibleTransactions.length === 0) {
    return null;
  }

  return (
    <div className="transaction-status">
      <div className="transaction-status-header">
        <h3>Transaction Status</h3>
        <div className="transaction-summary">
          {transactions.filter(tx => tx.status === 'pending').length > 0 && (
            <span className="status-count pending">
              {transactions.filter(tx => tx.status === 'pending').length} pending
            </span>
          )}
          {transactions.filter(tx => tx.status === 'failed').length > 0 && (
            <span className="status-count failed">
              {transactions.filter(tx => tx.status === 'failed').length} failed
            </span>
          )}
          {showCompleted && transactions.filter(tx => tx.status === 'confirmed').length > 0 && (
            <span className="status-count completed">
              {transactions.filter(tx => tx.status === 'confirmed').length} completed
            </span>
          )}
        </div>
      </div>

      <div className="transaction-list">
        {visibleTransactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className={`transaction-item ${transaction.status}`}
          >
            <div className="transaction-header">
              <div className="transaction-info">
                <span className="transaction-icon">
                  {getStatusIcon(transaction.status)}
                </span>
                <div className="transaction-details">
                  <span className="transaction-type">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                  <span className="transaction-id">
                    ID: {transaction.id.slice(-8)}
                  </span>
                </div>
              </div>
              
              <div className="transaction-status-info">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(transaction.status) }}
                >
                  {transaction.status.toUpperCase()}
                </span>
                {transaction.status === 'pending' && transaction.estimatedCompletion && (
                  <span className="time-remaining">
                    {formatTimeRemaining(transaction.estimatedCompletion)}
                  </span>
                )}
              </div>
            </div>

            {transaction.status === 'pending' && (
              <div className="transaction-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${transaction.progress}%` }}
                  />
                </div>
                <span className="progress-text">
                  {transaction.progress}%
                </span>
              </div>
            )}

            {transaction.error && (
              <div className="transaction-error">
                <div className="error-message">
                  <strong>Error:</strong> {transaction.error.message}
                </div>
                {transaction.error.suggestedAction && (
                  <div className="error-suggestion">
                    <strong>Suggestion:</strong> {transaction.error.suggestedAction}
                  </div>
                )}
                {transaction.retryCount > 0 && (
                  <div className="retry-info">
                    Retry attempt: {transaction.retryCount}
                  </div>
                )}
              </div>
            )}

            <div className="transaction-actions">
              {transaction.status === 'failed' && transaction.error?.recoverable && (
                <button
                  onClick={() => onRetry(transaction.id)}
                  className="retry-button"
                  title="Retry this transaction"
                >
                  Retry
                </button>
              )}
              
              {transaction.status === 'pending' && (
                <button
                  onClick={() => onCancel(transaction.id)}
                  className="cancel-button"
                  title="Cancel this transaction"
                >
                  Cancel
                </button>
              )}
              
              {(transaction.status === 'confirmed' || 
                (transaction.status === 'failed' && !transaction.error?.recoverable)) && (
                <button
                  onClick={() => onClear(transaction.id)}
                  className="clear-button"
                  title="Remove from list"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {transactions.filter(tx => tx.status === 'confirmed').length > 0 && !showCompleted && (
        <div className="completed-transactions-notice">
          <span>
            {transactions.filter(tx => tx.status === 'confirmed').length} completed transactions hidden
          </span>
        </div>
      )}
    </div>
  );
};

export default TransactionStatus;