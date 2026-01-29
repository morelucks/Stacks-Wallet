/**
 * Activity Panel Component
 * Displays Chainhooks activity events
 */

interface ActivityPanelProps {
  activity: any[];
  loading: boolean;
  error: string | null;
}

export function ActivityPanel({ activity, loading, error }: ActivityPanelProps) {
  if (error) {
    return (
      <section className="panel">
        <h2>Chainhooks Activity</h2>
        <div className="error">{error}</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Chainhooks Activity</h2>
      {activity.length === 0 ? (
        <p className="muted">No activity loaded. Click "Load Chainhooks activity" to fetch recent events.</p>
      ) : (
        <div className="activity-list">
          {activity.map((event, idx) => (
            <div key={idx} className="activity-item">
              <div className="activity-header">
                <span className="activity-txid">{event.txid?.slice(0, 16)}...</span>
                <span className="activity-time">{new Date(event.received_at).toLocaleString()}</span>
              </div>
              <div className="activity-details">
                <span>Block: {event.block_height}</span>
                <span>Network: {event.network || event.chain}</span>
              </div>
              {event.matched_events && event.matched_events.length > 0 && (
                <div className="activity-events">
                  {event.matched_events.map((evt: any, i: number) => (
                    <div key={i} className="activity-event">
                      {evt.contract_identifier && (
                        <span className="event-contract">{evt.contract_identifier}</span>
                      )}
                      {evt.function_name && (
                        <span className="event-function">{evt.function_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

