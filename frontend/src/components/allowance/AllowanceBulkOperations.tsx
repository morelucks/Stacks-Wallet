import React, { useState, useMemo } from 'react';
import { Allowance, BulkOperation, OperationProgress } from '../../types/allowance';

interface AllowanceBulkOperationsProps {
  selectedAllowances: string[];
  allowances: Allowance[];
  onBulkRevoke: (allowanceIds: string[]) => Promise<void>;
  onBulkApprove?: (allowanceIds: string[], newAmount: bigint) => Promise<void>;
  onClearSelection: () => void;
  activeBulkOperations: BulkOperation[];
}

const AllowanceBulkOperations: React.FC<AllowanceBulkOperationsProps> = ({
  selectedAllowances,
  allowances,
  onBulkRevoke,
  onBulkApprove,
  onClearSelection,
  activeBulkOperations
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [operationType, setOperationType] = useState<'revoke' | 'approve'>('revoke');
  const [newAmount, setNewAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedAllowanceObjects = useMemo(() => {
    return allowances.filter(allowance => selectedAllowances.includes(allowance.id));
  }, [allowances, selectedAllowances]);

  const bulkOperationStats = useMemo(() => {
    const stats = {
      totalSelected: selectedAllowances.length,
      activeAllowances: 0,
      expiredAllowances: 0,
      revokedAllowances: 0,
      totalValue: BigInt(0),
      highRiskCount: 0,
      contracts: new Set<string>(),
      spenders: new Set<string>()
    };

    selectedAllowanceObjects.forEach(allowance => {
      switch (allowance.status) {
        case 'active':
          stats.activeAllowances++;
          break;
        case 'expired':
          stats.expiredAllowances++;
          break;
        case 'revoked':
          stats.revokedAllowances++;
          break;
      }

      stats.totalValue += allowance.amount;
      stats.contracts.add(allowance.contractName);
      stats.spenders.add(allowance.spender);

      if (allowance.metadata?.riskLevel === 'high') {
        stats.highRiskCount++;
      }
    });

    return stats;
  }, [selectedAllowanceObjects]);

  const canPerformBulkRevoke = useMemo(() => {
    return bulkOperationStats.activeAllowances > 0;
  }, [bulkOperationStats]);

  const canPerformBulkApprove = useMemo(() => {
    return onBulkApprove && selectedAllowances.length > 0 && newAmount && !isNaN(Number(newAmount));
  }, [onBulkApprove, selectedAllowances.length, newAmount]);

  const handleBulkOperation = async (type: 'revoke' | 'approve') => {
    if (selectedAllowances.length === 0) return;

    setIsProcessing(true);
    try {
      if (type === 'revoke') {
        await onBulkRevoke(selectedAllowances);
      } else if (type === 'approve' && onBulkApprove && newAmount) {
        await onBulkApprove(selectedAllowances, BigInt(newAmount));
      }
      
      setShowConfirmDialog(false);
      onClearSelection();
    } catch (error) {
      console.error(`Bulk ${type} operation failed:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openConfirmDialog = (type: 'revoke' | 'approve') => {
    setOperationType(type);
    setShowConfirmDialog(true);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getOperationProgress = (operationId: string): OperationProgress | null => {
    const operation = activeBulkOperations.find(op => op.id === operationId);
    return operation?.progress || null;
  };

  const hasActiveBulkOperations = activeBulkOperations.length > 0;

  if (selectedAllowances.length === 0 && !hasActiveBulkOperations) {
    return null;
  }

  return (
    <div className="bulk-operations">
      {selectedAllowances.length > 0 && (
        <div className="bulk-operations-panel">
          <div className="bulk-operations-header">
            <h3>Bulk Operations</h3>
            <button 
              onClick={onClearSelection}
              className="clear-selection-button"
              title="Clear selection"
            >
              Clear Selection
            </button>
          </div>

          <div className="bulk-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Selected</span>
                <span className="stat-value">{bulkOperationStats.totalSelected}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active</span>
                <span className="stat-value">{bulkOperationStats.activeAllowances}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Value</span>
                <span className="stat-value">{bulkOperationStats.totalValue.toString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">High Risk</span>
                <span className="stat-value stat-high-risk">{bulkOperationStats.highRiskCount}</span>
              </div>
            </div>

            <div className="bulk-details">
              <div className="detail-item">
                <span className="detail-label">Contracts:</span>
                <span className="detail-value">
                  {Array.from(bulkOperationStats.contracts).slice(0, 3).join(', ')}
                  {bulkOperationStats.contracts.size > 3 && ` +${bulkOperationStats.contracts.size - 3} more`}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Spenders:</span>
                <span className="detail-value">
                  {Array.from(bulkOperationStats.spenders).slice(0, 2).map(formatAddress).join(', ')}
                  {bulkOperationStats.spenders.size > 2 && ` +${bulkOperationStats.spenders.size - 2} more`}
                </span>
              </div>
            </div>
          </div>

          <div className="bulk-actions">
            <button
              onClick={() => openConfirmDialog('revoke')}
              disabled={!canPerformBulkRevoke || isProcessing}
              className="bulk-revoke-button"
              title={`Revoke ${bulkOperationStats.activeAllowances} active allowances`}
            >
              {isProcessing ? 'Processing...' : `Revoke ${bulkOperationStats.activeAllowances} Active`}
            </button>

            {onBulkApprove && (
              <div className="bulk-approve-section">
                <input
                  type="number"
                  placeholder="New amount"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="bulk-amount-input"
                  min="1"
                />
                <button
                  onClick={() => openConfirmDialog('approve')}
                  disabled={!canPerformBulkApprove || isProcessing}
                  className="bulk-approve-button"
                  title="Update all selected allowances to new amount"
                >
                  {isProcessing ? 'Processing...' : 'Update All'}
                </button>
              </div>
            )}
          </div>

          {bulkOperationStats.highRiskCount > 0 && (
            <div className="bulk-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                {bulkOperationStats.highRiskCount} high-risk allowances selected. 
                Please review carefully before proceeding.
              </span>
            </div>
          )}
        </div>
      )}

      {hasActiveBulkOperations && (
        <div className="active-bulk-operations">
          <h4>Active Bulk Operations</h4>
          {activeBulkOperations.map(operation => (
            <div key={operation.id} className="bulk-operation-status">
              <div className="operation-header">
                <span className="operation-type">
                  {operation.type === 'revoke' ? 'Bulk Revoke' : 'Bulk Approve'}
                </span>
                <span className="operation-progress">
                  {operation.progress.completed} / {operation.progress.total}
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(operation.progress.completed / operation.progress.total) * 100}%` 
                  }}
                />
              </div>
              
              <div className="operation-details">
                <span className="detail">
                  Completed: {operation.progress.completed}
                </span>
                <span className="detail">
                  Failed: {operation.progress.failed}
                </span>
                {operation.progress.currentItem && (
                  <span className="detail">
                    Current: {formatAddress(operation.progress.currentItem)}
                  </span>
                )}
              </div>

              {operation.results.length > 0 && (
                <div className="operation-results">
                  <div className="results-summary">
                    <span className="success-count">
                      ✅ {operation.results.filter(r => r.success).length} successful
                    </span>
                    <span className="error-count">
                      ❌ {operation.results.filter(r => !r.success).length} failed
                    </span>
                  </div>
                  
                  {operation.results.filter(r => !r.success).length > 0 && (
                    <div className="failed-operations">
                      <h5>Failed Operations:</h5>
                      {operation.results
                        .filter(r => !r.success)
                        .slice(0, 3)
                        .map((result, index) => (
                          <div key={index} className="failed-operation">
                            <span className="failed-id">{result.allowanceId.slice(-8)}</span>
                            <span className="failed-error">{result.error}</span>
                          </div>
                        ))}
                      {operation.results.filter(r => !r.success).length > 3 && (
                        <div className="more-failures">
                          +{operation.results.filter(r => !r.success).length - 3} more failures
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showConfirmDialog && (
        <div className="bulk-confirm-dialog">
          <div className="dialog-overlay" onClick={() => setShowConfirmDialog(false)} />
          <div className="dialog-content">
            <h3>Confirm Bulk {operationType === 'revoke' ? 'Revoke' : 'Update'}</h3>
            
            <div className="confirmation-details">
              <p>
                You are about to {operationType === 'revoke' ? 'revoke' : 'update'} {' '}
                <strong>{selectedAllowances.length}</strong> allowances.
              </p>
              
              {operationType === 'revoke' && (
                <div className="revoke-warning">
                  <p>⚠️ This action cannot be undone. The selected allowances will be permanently revoked.</p>
                  <p>Active allowances to revoke: <strong>{bulkOperationStats.activeAllowances}</strong></p>
                </div>
              )}
              
              {operationType === 'approve' && (
                <div className="approve-details">
                  <p>New amount for all selected allowances: <strong>{newAmount}</strong></p>
                </div>
              )}

              {bulkOperationStats.highRiskCount > 0 && (
                <div className="high-risk-warning">
                  <p>🚨 <strong>{bulkOperationStats.highRiskCount}</strong> high-risk allowances included!</p>
                </div>
              )}
            </div>

            <div className="dialog-actions">
              <button
                onClick={() => handleBulkOperation(operationType)}
                disabled={isProcessing}
                className={`confirm-button ${operationType}`}
              >
                {isProcessing ? 'Processing...' : `Confirm ${operationType === 'revoke' ? 'Revoke' : 'Update'}`}
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllowanceBulkOperations;