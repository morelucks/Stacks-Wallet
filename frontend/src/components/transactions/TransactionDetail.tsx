import React from 'react';
import { Transaction } from '../../types/transaction';
import './transactions.css';

interface TransactionDetailProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed': return '#4ade80';
      case 'pending': return '#fbbf24';
      case 'failed': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Transaction Details</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h4>Basic Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Transaction ID</span>
                <div className="detail-value">
                  <span className="monospace">{transaction.txid}</span>
                  <button 
                    onClick={() => copyToClipboard(transaction.txid)}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span 
                  className="detail-value"
                  style={{ color: getStatusColor(transaction.status) }}
                >
                  {transaction.status.toUpperCase()}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Type</span>
                <span className="detail-value">{transaction.type}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Timestamp</span>
                <span className="detail-value">{formatDate(transaction.timestamp)}</span>
              </div>

              {transaction.blockHeight > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Block Height</span>
                  <span className="detail-value">{transaction.blockHeight}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h4>Addresses</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Sender</span>
                <div className="detail-value">
                  <span className="monospace">{transaction.sender}</span>
                  <button 
                    onClick={() => copyToClipboard(transaction.sender)}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {transaction.recipient && (
                <div className="detail-item">
                  <span className="detail-label">Recipient</span>
                  <div className="detail-value">
                    <span className="monospace">{transaction.recipient}</span>
                    <button 
                      onClick={() => copyToClipboard(transaction.recipient)}
                      className="copy-button"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h4>Financial Details</h4>
            <div className="detail-grid">
              {transaction.amount > 0n && (
                <div className="detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value monospace">
                    {transaction.amount.toString()} tokens
                  </span>
                </div>
              )}

              <div className="detail-item">
                <span className="detail-label">Fee</span>
                <span className="detail-value monospace">
                  {transaction.fee.toString()} STX
                </span>
              </div>
            </div>
          </div>

          {(transaction.contractAddress || transaction.functionName || transaction.memo) && (
            <div className="detail-section">
              <h4>Additional Information</h4>
              <div className="detail-grid">
                {transaction.contractAddress && (
                  <div className="detail-item">
                    <span className="detail-label">Contract</span>
                    <span className="detail-value monospace">{transaction.contractAddress}</span>
                  </div>
                )}

                {transaction.functionName && (
                  <div className="detail-item">
                    <span className="detail-label">Function</span>
                    <span className="detail-value">{transaction.functionName}</span>
                  </div>
                )}

                {transaction.memo && (
                  <div className="detail-item">
                    <span className="detail-label">Memo</span>
                    <span className="detail-value">{transaction.memo}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-button">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;