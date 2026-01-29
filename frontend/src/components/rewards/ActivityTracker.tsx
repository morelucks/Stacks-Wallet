import React from 'react';
import { Card } from '../ui/Card';
import { useStacksActivity } from '../../hooks/useStacksActivity';
import { ImpactBadge } from './ImpactBadge';

/**
 * ActivityTracker Component
 * Displays a live feed of the user's on-chain and builder activity.
 * Visualizes the accumulation of impact points in real-time.
 */
export const ActivityTracker: React.FC = () => {
    const { activity, isDeveloperMode } = useStacksActivity();

    return (
        <Card className="activity-tracker bg-black border-gray-800 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Live Activity Hub</h4>
                    <p className="text-[10px] text-gray-600">Monitoring @stacks/connect & transactions</p>
                </div>
                <div className="flex gap-2">
                    {isDeveloperMode && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    )}
                    <span className="text-[9px] font-mono text-gray-500">Live Status</span>
                </div>
            </div>

            <div className="activity-badges flex flex-wrap gap-3">
                <ImpactBadge
                    label="Wallet Connection"
                    score={activity.connectUsage * 5}
                    category="community"
                />
                <ImpactBadge
                    label="Contract Interactions"
                    score={activity.contractInteractions * 25}
                    category="contract"
                />
                <ImpactBadge
                    label="Transaction Count"
                    score={activity.transactionCount * 10}
                    category="contract"
                />
            </div>

            <div className="activity-log bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Recent Audit Trail</span>
                    <span className="text-[9px] text-gray-700 font-mono">Session: {activity.currentSessionMinutes}m</span>
                </div>

                <div className="space-y-2">
                    {activity.transactionCount === 0 && activity.connectUsage === 0 ? (
                        <div className="text-[10px] text-gray-600 italic py-2">
                            Waiting for network activity signals...
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center text-[10px] font-mono border-l-2 border-purple-500 pl-2">
                                <span className="text-gray-400">CONNECT_EVENT</span>
                                <span className="text-gray-600">{new Date(activity.lastActionTimestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono border-l-2 border-blue-500 pl-2">
                                <span className="text-gray-400">TX_BROADCAST_SIGNAL</span>
                                <span className="text-gray-600">PENDING_VERIFICATION</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="footer-tip p-3 bg-gradient-to-r from-purple-900/10 to-transparent rounded border-l border-purple-500/30">
                <p className="text-[9px] text-gray-400 leading-tight">
                    <strong className="text-purple-400 uppercase">Pro Tip:</strong> Deploying complex smart contracts grants a 2x bonus to your impact score for 24 hours.
                </p>
            </div>
        </Card>
    );
};
