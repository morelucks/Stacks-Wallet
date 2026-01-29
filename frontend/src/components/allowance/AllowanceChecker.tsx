import React, { useState } from 'react';
import './allowance.css';

interface AllowanceCheckerProps {
  onCheck: (owner: string, spender: string) => Promise<bigint>;
  loading: boolean;
  connectedAddress?: string;
}

const AllowanceChecker: React.FC<AllowanceCheckerProps> = ({
  onCheck,
  loading,
  connectedAddress,
}) => {
  const [owner, setOwner] = useState('');
  const [spender, setSpender] = useState('');
  const [result, setResult] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || !spender) return;

    try {
      setError(null);
      const allowance = await onCheck(owner, spender);
      setResult(allowance);
    } catch (err: any) {
      setError(err.message || 'Failed to check allowance');
      setResult(null);
    }
  };

  const useConnectedWallet = () => {
    if (connectedAddress) {
      setOwner(connectedAddress);
    }
  };

  return (
    <div className="allowance-checker">
      <h3>Check Allowance</h3>
      <form onSubmit={handleCheck}>
        <div className="grid two">
          <label className="field">
            <span>Owner Address</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="ST... owner address"
                style={{ flex: 1 }}
                required
              />
              {connectedAddress && (
                <button
                  type="button"
                  onClick={useConnectedWallet}
                  style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                >
                  Use Wallet
                </button>
              )}
            </div>
          </label>
          <label className="field">
            <span>Spender Address</span>
            <input
              type="text"
              value={spender}
              onChange={(e) => setSpender(e.target.value)}
              placeholder="ST... spender address"
              required
            />
          </label>
        </div>

        <div className="actions" style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={loading || !owner || !spender}>
            {loading ? 'Checking...' : 'Check Allowance'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {result !== null && (
        <div className="result" style={{ marginTop: '1rem' }}>
          <div className="stat">
            <p className="label">Current Allowance</p>
            <p className="value">{result.toString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllowanceChecker;