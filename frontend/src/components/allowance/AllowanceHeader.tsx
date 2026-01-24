import React from 'react';
import { AllowanceState } from '../../types/allowance';

interface AllowanceHeaderProps {
  state: AllowanceState;
  connectedAddress?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

const AllowanceHeader: React.FC<AllowanceHeaderProps> = ({
  state,
  connectedAddress,
  onConnect,
  onDisconnect,
  isConnecting,
}) => {
  const totalAllowances = state.allowances.length;
  const activeAllowances = state.allowances.filter(a => a.status === 'active').length;
  const totalValue = state.allowances.reduce((sum, a) => sum + a.amount, BigInt(0));

  return (
    <div className="allowance-header">
      <div className="header-content">
        <h1>Token Allowances</h1>
        <p className="header-description">
          Manage your token permissions and allowances across all connected contracts
        </p>
      </div>
      
      <div className="header-stats">
        <div className="stat-item">
          <span className="stat-label">Total Allowances</span>
          <span className="stat-value">{totalAllowances}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value">{activeAllowances}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Value</span>
          <span className="stat-value">{totalValue.toString()}</span>
        </div>
      </div>

      <div className="header-actions">
        {connectedAddress ? (
          <div className="wallet-info">
            <span className="wallet-address">{connectedAddress}</span>
            <button onClick={onDisconnect} disabled={isConnecting}>
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AllowanceHeader;