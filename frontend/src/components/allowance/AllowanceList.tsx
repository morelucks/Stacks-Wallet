import React from 'react';
import { Allowance } from '../../types/allowance';
import './allowance.css';

interface AllowanceListProps {
  allowances: Allowance[];
  loading: boolean;
  onRevoke?: (allowance: Allowance) => void;
}

const AllowanceList: React.FC<AllowanceListProps> = ({
  allowances,
  loading,
  onRevoke,
}) => {
  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="allowance-list">
        <h3>Your Allowances</h3>
        <p className="muted">Loading allowances...</p>
      </div>
    );
  }

  if (allowances.length === 0) {
    return (
      <div className="allowance-list">
        <h3>Your Allowances</h3>
        <p className="muted">No allowances found. Grant allowances to other addresses to see them here.</p>
      </div>
    );
  }

  return (
    <div className="allowance-list">
      <h3>Your Allowances</h3>
      <div className="allowances-grid">
        {allowances.map((allowance, index) => (
          <div key={index} className="allowance-item">
            <div className="allowance-header">
              <span className="allowance-spender">
                To: {formatAddress(allowance.spender)}
              </span>
              <span className="allowance-amount">
                {allowance.amount.toString()}
              </span>
            </div>
            <div className="allowance-details">
              <span className="allowance-contract">
                {allowance.contractName}
              </span>
              {onRevoke && (
                <button
                  onClick={() => onRevoke(allowance)}
                  className="revoke-button"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllowanceList;