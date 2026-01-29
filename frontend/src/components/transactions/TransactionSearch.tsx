import React, { useState } from 'react';
import './transactions.css';

interface TransactionSearchProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const TransactionSearch: React.FC<TransactionSearchProps> = ({
  onSearch,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery.trim());
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="transaction-search">
      <h3>Search Transactions</h3>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction ID, address, or contract..."
            className="search-input"
            disabled={loading}
          />
          <div className="search-buttons">
            <button 
              type="submit" 
              disabled={loading || !searchQuery.trim()}
              className="search-button"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {searchQuery && (
              <button 
                type="button" 
                onClick={handleClear}
                className="clear-button"
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>
      
      <div className="search-tips">
        <p className="tips-title">Search Tips:</p>
        <ul className="tips-list">
          <li>Enter a full transaction ID to find a specific transaction</li>
          <li>Search by wallet address to filter transactions</li>
          <li>Use contract address to find contract interactions</li>
          <li>Search is case-insensitive</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionSearch;