import React from 'react';
import { Allowance } from '../../types/allowance';

interface AllowanceStatsProps {
  allowances: Allowance[];
  filteredAllowances: Allowance[];
}

const AllowanceStats: React.FC<AllowanceStatsProps> = ({
  allowances,
  filteredAllowances,
}) => {
  const stats = React.useMemo(() => {
    const total = allowances.length;
    const active = allowances.filter(a => a.status === 'active').length;
    const expired = allowances.filter(a => a.status === 'expired').length;
    const revoked = allowances.filter(a => a.status === 'revoked').length;
    
    const riskLevels = allowances.reduce((acc, a) => {
      const risk = a.metadata?.riskLevel || 'low';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalValue = allowances.reduce((sum, a) => sum + a.amount, BigInt(0));
    const filtered = filteredAllowances.length;

    return {
      total,
      active,
      expired,
      revoked,
      riskLevels,
      totalValue,
      filtered,
      isFiltered: filtered !== total,
    };
  }, [allowances, filteredAllowances]);

  return (
    <div className="allowance-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Overview</h3>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Total Allowances</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            {stats.isFiltered && (
              <div className="stat-item">
                <span className="stat-label">Filtered Results</span>
                <span className="stat-value">{stats.filtered}</span>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-label">Total Value</span>
              <span className="stat-value">{stats.totalValue.toString()}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Status</h3>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Active</span>
              <span className="stat-value stat-active">{stats.active}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expired</span>
              <span className="stat-value stat-expired">{stats.expired}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Revoked</span>
              <span className="stat-value stat-revoked">{stats.revoked}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Risk Levels</h3>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Low Risk</span>
              <span className="stat-value stat-low-risk">{stats.riskLevels.low || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Medium Risk</span>
              <span className="stat-value stat-medium-risk">{stats.riskLevels.medium || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High Risk</span>
              <span className="stat-value stat-high-risk">{stats.riskLevels.high || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllowanceStats;