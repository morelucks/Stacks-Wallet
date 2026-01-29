import React, { useState, useEffect, useMemo } from 'react';
import { AllowanceFilters, SavedFilter, Allowance } from '../../types/allowance';

interface AllowanceFiltersProps {
  filters: AllowanceFilters;
  onFiltersChange: (filters: AllowanceFilters) => void;
  allowances: Allowance[];
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filters: AllowanceFilters) => void;
  onLoadFilter: (filter: SavedFilter) => void;
  onDeleteFilter: (filterId: string) => void;
}

const AllowanceFiltersComponent: React.FC<AllowanceFiltersProps> = ({
  filters,
  onFiltersChange,
  allowances,
  savedFilters,
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate search suggestions based on existing allowances
  const suggestions = useMemo(() => {
    const spenders = [...new Set(allowances.map(a => a.spender))];
    const contracts = [...new Set(allowances.map(a => a.contractName))];
    const purposes = [...new Set(allowances.flatMap(a => a.metadata?.purpose ? [a.metadata.purpose] : []))];
    const tags = [...new Set(allowances.flatMap(a => a.metadata?.tags || []))];
    
    return {
      spenders: spenders.slice(0, 5),
      contracts: contracts.slice(0, 5),
      purposes: purposes.slice(0, 5),
      tags: tags.slice(0, 10)
    };
  }, [allowances]);

  // Update search suggestions based on current search term
  useEffect(() => {
    if (filters.search.length > 0) {
      const searchTerm = filters.search.toLowerCase();
      const matchingSuggestions = [
        ...suggestions.spenders.filter(s => s.toLowerCase().includes(searchTerm)),
        ...suggestions.contracts.filter(c => c.toLowerCase().includes(searchTerm)),
        ...suggestions.purposes.filter(p => p.toLowerCase().includes(searchTerm)),
        ...suggestions.tags.filter(t => t.toLowerCase().includes(searchTerm))
      ].slice(0, 8);
      
      setSearchSuggestions(matchingSuggestions);
      setShowSuggestions(matchingSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [filters.search, suggestions]);

  const handleFilterChange = (key: keyof AllowanceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const dateRange = filters.dateRange || { start: new Date(), end: new Date() };
    const newDateRange = {
      ...dateRange,
      [type]: new Date(value)
    };
    handleFilterChange('dateRange', newDateRange);
  };

  const handleAmountRangeChange = (type: 'min' | 'max', value: string) => {
    const amountRange = filters.amountRange || { min: BigInt(0), max: BigInt(0) };
    const newAmountRange = {
      ...amountRange,
      [type]: value ? BigInt(value) : BigInt(0)
    };
    handleFilterChange('amountRange', newAmountRange);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleFilterChange('tags', newTags);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      contractAddress: undefined,
      spenderAddress: undefined,
      amountRange: undefined,
      dateRange: undefined,
      status: undefined,
      riskLevel: undefined,
      tags: undefined
    });
  };

  const hasActiveFilters = () => {
    return filters.search !== '' ||
           filters.contractAddress ||
           filters.spenderAddress ||
           filters.amountRange ||
           filters.dateRange ||
           filters.status ||
           filters.riskLevel ||
           (filters.tags && filters.tags.length > 0);
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      onSaveFilter(saveFilterName.trim(), filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  const getFilterResultCount = () => {
    return allowances.filter(allowance => {
      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          allowance.spender,
          allowance.contractName,
          allowance.contractAddress,
          allowance.metadata?.purpose || '',
          ...(allowance.metadata?.tags || [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Apply other filters
      if (filters.contractAddress && allowance.contractAddress !== filters.contractAddress) {
        return false;
      }

      if (filters.spenderAddress && allowance.spender !== filters.spenderAddress) {
        return false;
      }

      if (filters.status && allowance.status !== filters.status) {
        return false;
      }

      if (filters.riskLevel && allowance.metadata?.riskLevel !== filters.riskLevel) {
        return false;
      }

      if (filters.amountRange) {
        if (allowance.amount < filters.amountRange.min || allowance.amount > filters.amountRange.max) {
          return false;
        }
      }

      if (filters.dateRange) {
        if (allowance.createdAt < filters.dateRange.start || allowance.createdAt > filters.dateRange.end) {
          return false;
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        const allowanceTags = allowance.metadata?.tags || [];
        if (!filters.tags.some(tag => allowanceTags.includes(tag))) {
          return false;
        }
      }

      return true;
    }).length;
  };

  return (
    <div className="allowance-filters">
      <div className="filters-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search allowances..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
            onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && (
            <div className="search-suggestions">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    handleFilterChange('search', suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="filter-actions">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="expand-filters-button"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          </button>
          
          {hasActiveFilters() && (
            <button onClick={clearAllFilters} className="clear-filters-button">
              Clear All
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Contract Address</label>
              <input
                type="text"
                value={filters.contractAddress || ''}
                onChange={(e) => handleFilterChange('contractAddress', e.target.value || undefined)}
                placeholder="Filter by contract address"
              />
            </div>

            <div className="filter-group">
              <label>Spender Address</label>
              <input
                type="text"
                value={filters.spenderAddress || ''}
                onChange={(e) => handleFilterChange('spenderAddress', e.target.value || undefined)}
                placeholder="Filter by spender address"
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Risk Level</label>
              <select
                value={filters.riskLevel || ''}
                onChange={(e) => handleFilterChange('riskLevel', e.target.value || undefined)}
              >
                <option value="">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Amount Range</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountRange?.min.toString() || ''}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountRange?.max.toString() || ''}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Date Range</label>
              <div className="range-inputs">
                <input
                  type="date"
                  value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
                <span>to</span>
                <input
                  type="date"
                  value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {suggestions.tags.length > 0 && (
            <div className="filter-group">
              <label>Tags</label>
              <div className="tag-filters">
                {suggestions.tags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter ${(filters.tags || []).includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="saved-filters">
            <div className="saved-filters-header">
              <h4>Saved Filters</h4>
              {hasActiveFilters() && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="save-filter-button"
                >
                  Save Current Filter
                </button>
              )}
            </div>

            {savedFilters.length > 0 && (
              <div className="saved-filters-list">
                {savedFilters.map(filter => (
                  <div key={filter.id} className="saved-filter-item">
                    <span className="filter-name">{filter.name}</span>
                    <div className="filter-actions">
                      <button
                        onClick={() => onLoadFilter(filter)}
                        className="load-filter-button"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeleteFilter(filter.id)}
                        className="delete-filter-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="save-filter-dialog">
          <div className="dialog-content">
            <h3>Save Filter</h3>
            <input
              type="text"
              placeholder="Enter filter name"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveFilter()}
            />
            <div className="dialog-actions">
              <button onClick={handleSaveFilter} disabled={!saveFilterName.trim()}>
                Save
              </button>
              <button onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="filter-results">
        <span className="result-count">
          {hasActiveFilters() ? `${getFilterResultCount()} of ${allowances.length} allowances` : `${allowances.length} allowances`}
        </span>
      </div>
    </div>
  );
};

export default AllowanceFiltersComponent;