import React, { useState, useMemo } from 'react';
import { Allowance } from '../../types/allowance';
import './allowance.css';

interface AllowanceListProps {
  allowances: Allowance[];
  loading: boolean;
  onRevoke?: (allowance: Allowance) => void;
  onSelect?: (allowanceIds: string[]) => void;
  selectedAllowances?: string[];
  showBulkActions?: boolean;
}

const AllowanceList: React.FC<AllowanceListProps> = ({
  allowances,
  loading,
  onRevoke,
  onSelect,
  selectedAllowances = [],
  showBulkActions = false,
}) => {
  const [sortField, setSortField] = useState<keyof Allowance>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRiskLevelColor = (riskLevel?: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusColor = (status: 'active' | 'expired' | 'revoked') => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'expired': return '#ff9800';
      case 'revoked': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const sortedAllowances = useMemo(() => {
    return [...allowances].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle different data types
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      } else if (typeof aValue === 'bigint' && typeof bValue === 'bigint') {
        return sortDirection === 'asc' 
          ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
          : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [allowances, sortField, sortDirection]);

  const paginatedAllowances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAllowances.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAllowances, currentPage]);

  const totalPages = Math.ceil(sortedAllowances.length / itemsPerPage);

  const handleSort = (field: keyof Allowance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = () => {
    if (!onSelect) return;
    
    if (selectedAllowances.length === paginatedAllowances.length) {
      onSelect([]);
    } else {
      onSelect(paginatedAllowances.map(a => a.id));
    }
  };

  const handleSelectItem = (allowanceId: string) => {
    if (!onSelect) return;
    
    if (selectedAllowances.includes(allowanceId)) {
      onSelect(selectedAllowances.filter(id => id !== allowanceId));
    } else {
      onSelect([...selectedAllowances, allowanceId]);
    }
  };

  if (loading) {
    return (
      <div className="allowance-list">
        <h3>Your Allowances</h3>
        <div className="loading-spinner">
          <p className="muted">Loading allowances...</p>
        </div>
      </div>
    );
  }

  if (allowances.length === 0) {
    return (
      <div className="allowance-list">
        <h3>Your Allowances</h3>
        <div className="empty-state">
          <p className="muted">No allowances found.</p>
          <p className="muted">Grant allowances to other addresses to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="allowance-list">
      <div className="list-header">
        <h3>Your Allowances ({allowances.length})</h3>
        {showBulkActions && (
          <div className="bulk-actions">
            <label className="bulk-select">
              <input
                type="checkbox"
                checked={selectedAllowances.length === paginatedAllowances.length && paginatedAllowances.length > 0}
                onChange={handleSelectAll}
              />
              Select All
            </label>
            {selectedAllowances.length > 0 && (
              <span className="selected-count">
                {selectedAllowances.length} selected
              </span>
            )}
          </div>
        )}
      </div>

      <div className="allowance-table">
        <div className="table-header">
          <div className="header-cell">
            {showBulkActions && <span className="checkbox-column"></span>}
          </div>
          <div 
            className={`header-cell sortable ${sortField === 'spender' ? 'active' : ''}`}
            onClick={() => handleSort('spender')}
          >
            Spender {sortField === 'spender' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell sortable ${sortField === 'amount' ? 'active' : ''}`}
            onClick={() => handleSort('amount')}
          >
            Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell sortable ${sortField === 'contractName' ? 'active' : ''}`}
            onClick={() => handleSort('contractName')}
          >
            Contract {sortField === 'contractName' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell sortable ${sortField === 'createdAt' ? 'active' : ''}`}
            onClick={() => handleSort('createdAt')}
          >
            Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`header-cell sortable ${sortField === 'status' ? 'active' : ''}`}
            onClick={() => handleSort('status')}
          >
            Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="header-cell">Actions</div>
        </div>

        {paginatedAllowances.map((allowance) => (
          <div key={allowance.id} className="table-row">
            <div className="table-cell">
              {showBulkActions && (
                <input
                  type="checkbox"
                  checked={selectedAllowances.includes(allowance.id)}
                  onChange={() => handleSelectItem(allowance.id)}
                />
              )}
            </div>
            <div className="table-cell">
              <div className="spender-info">
                <span className="spender-address" title={allowance.spender}>
                  {formatAddress(allowance.spender)}
                </span>
                {allowance.metadata?.purpose && (
                  <span className="spender-purpose">{allowance.metadata.purpose}</span>
                )}
              </div>
            </div>
            <div className="table-cell">
              <div className="amount-info">
                <span className="amount-value">{allowance.amount.toString()}</span>
                {allowance.metadata?.riskLevel && (
                  <span 
                    className="risk-indicator"
                    style={{ color: getRiskLevelColor(allowance.metadata.riskLevel) }}
                    title={`Risk level: ${allowance.metadata.riskLevel}`}
                  >
                    ●
                  </span>
                )}
              </div>
            </div>
            <div className="table-cell">
              <span className="contract-name" title={allowance.contractAddress}>
                {allowance.contractName}
              </span>
            </div>
            <div className="table-cell">
              <span className="created-date" title={allowance.createdAt.toISOString()}>
                {formatDate(allowance.createdAt)}
              </span>
            </div>
            <div className="table-cell">
              <span 
                className="status-badge"
                style={{ color: getStatusColor(allowance.status) }}
              >
                {allowance.status}
              </span>
              {allowance.expirationDate && allowance.status === 'active' && (
                <span className="expiration-info">
                  Expires: {formatDate(allowance.expirationDate)}
                </span>
              )}
            </div>
            <div className="table-cell">
              <div className="action-buttons">
                {onRevoke && allowance.status === 'active' && (
                  <button
                    onClick={() => onRevoke(allowance)}
                    className="revoke-button"
                    title="Revoke this allowance"
                  >
                    Revoke
                  </button>
                )}
                <button
                  className="details-button"
                  title="View allowance details"
                  onClick={() => {
                    // TODO: Implement details modal
                    console.log('View details for:', allowance.id);
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {allowances.length > itemsPerPage && (
        <div className="list-summary">
          Showing {paginatedAllowances.length} of {allowances.length} allowances
        </div>
      )}
    </div>
  );
};

export default AllowanceList;