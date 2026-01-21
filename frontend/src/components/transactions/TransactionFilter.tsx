import React, { useState } from 'react';
import { TransactionFilter } from '../../types/transaction';
import './transactions.css';

interface TransactionFilterProps {
  onFilterChange: (filter: TransactionFilter) => void;
  loading: boolean;
}

const TransactionFilterComponent: React.FC<TransactionFilterProps> = ({
  onFilterChange,
  loading,
}) => {
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  const clearFilters = () => {
    const emptyFilter = {};
    setFilter(emptyFilter);
    onFilterChange(emptyFilter);
  };

  const hasActiveFilters = Object.keys(filter).some(key => 
    filter[key as keyof TransactionFilter] !== undefined && 
    filter[key as keyof TransactionFilter] !== ''
  );

  return (
    <div className="transaction-filter">
      <div className="filter-header">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="filter-toggle"
        >
          Filters {hasActiveFilters && '(Active)'} {isExpanded ? '▼' : '▶'}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters">
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filter-content">
          <div className="filter-grid">
            <label className="filter-field">
              <span>Transaction Type</span>
              <select
                value={filter.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                disabled={loading}
              >
                <option value="">All Types</option>
                <option value="transfer">Transfer</option>
                <option value="mint">Mint</option>
                <option value="approve">Approve</option>
                <option value="contract-call">Contract Call</option>
              </select>
            </label>

            <label className="filter-field">
              <span>Status</span>
              <select
                value={filter.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                disabled={loading}
              >
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label className="filter-field">
              <span>From Date</span>
              <input
                type="date"
                value={filter.dateFrom ? filter.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                disabled={loading}
              />
            </label>

            <label className="filter-field">
              <span>To Date</span>
              <input
                type="date"
                value={filter.dateTo ? filter.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                disabled={loading}
              />
            </label>

            <label className="filter-field">
              <span>Min Amount</span>
              <input
                type="number"
                placeholder="0"
                value={filter.minAmount ? filter.minAmount.toString() : ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? BigInt(e.target.value) : undefined)}
                disabled={loading}
                min="0"
              />
            </label>

            <label className="filter-field">
              <span>Max Amount</span>
              <input
                type="number"
                placeholder="No limit"
                value={filter.maxAmount ? filter.maxAmount.toString() : ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value ? BigInt(e.target.value) : undefined)}
                disabled={loading}
                min="0"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilterComponent;