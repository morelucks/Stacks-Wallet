/**
 * Results Panel Component
 * Displays token information query results
 */

interface ResultsPanelProps {
  tokenName: string | null;
  totalSupply: bigint | null;
  balance: bigint | null;
  network: string;
  apiBaseUrl: string;
  error: string | null;
}

export function ResultsPanel({
  tokenName,
  totalSupply,
  balance,
  network,
  apiBaseUrl,
  error,
}: ResultsPanelProps) {
  return (
    <>
      {error && <div className="error">{error}</div>}
      <section className="panel results">
        <h2>Results</h2>
        <div className="grid three">
          <div className="stat">
            <p className="label">Token name</p>
            <p className="value">{tokenName ?? "—"}</p>
          </div>
          <div className="stat">
            <p className="label">Total supply</p>
            <p className="value">{totalSupply !== null ? totalSupply.toString() : "—"}</p>
          </div>
          <div className="stat">
            <p className="label">Balance</p>
            <p className="value">{balance !== null ? balance.toString() : "—"}</p>
          </div>
          <div className="stat">
            <p className="label">Network / API</p>
            <p className="value small">
              {network} · {apiBaseUrl}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

