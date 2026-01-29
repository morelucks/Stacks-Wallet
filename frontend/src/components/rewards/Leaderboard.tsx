import React from 'react';
import { Card } from '../ui/Card';

interface LeaderboardEntry {
    address: string;
    score: number;
    rank: number;
    impactLabel: string;
}

/**
 * Leaderboard Component
 * Displays the top-performing contributors in the Stacks ecosystem.
 * Motivates users by showing competitive rankings based on impact scores.
 */
export const Leaderboard: React.FC = () => {
    // Mock data for the leaderboard
    const leaders: LeaderboardEntry[] = [
        { address: 'SP12...ABCD', score: 15420, rank: 1, impactLabel: 'Core Dev' },
        { address: 'SP8K...92K1', score: 12100, rank: 2, impactLabel: 'App Builder' },
        { address: 'SP3F...X8V2', score: 9800, rank: 3, impactLabel: 'Deployer' },
        { address: 'SP2J...M5N4', score: 7500, rank: 4, impactLabel: 'Contributor' },
        { address: 'SP9A...Q1W1', score: 6200, rank: 5, impactLabel: 'Beta Tester' },
    ];

    return (
        <Card className="leaderboard-card bg-gray-900 border-gray-800 p-0 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Top Contributors</h3>
                <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded-full font-bold uppercase">Season 1</span>
            </div>

            <div className="p-0">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/20 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                            <th className="px-4 py-3 border-b border-gray-800">Rank</th>
                            <th className="px-4 py-3 border-b border-gray-800">Contributor</th>
                            <th className="px-4 py-3 border-b border-gray-800 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaders.map((leader, index) => (
                            <tr
                                key={leader.address}
                                className={`group hover:bg-white/5 transition-colors ${index !== leaders.length - 1 ? 'border-b border-gray-800/50' : ''
                                    }`}
                            >
                                <td className="px-4 py-4">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs ${leader.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                            leader.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                                leader.rank === 3 ? 'bg-orange-800/20 text-orange-400' :
                                                    'bg-gray-800 text-gray-500'
                                        }`}>
                                        {leader.rank}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div>
                                        <div className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors">{leader.address}</div>
                                        <div className="text-[10px] text-gray-600 uppercase tracking-tighter">{leader.impactLabel}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="text-sm font-bold text-white font-mono">
                                        {leader.score.toLocaleString()}
                                    </div>
                                    <div className="text-[9px] text-purple-500/60 uppercase">Impact pts</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-black/40 text-center">
                <button className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center justify-center w-full gap-2">
                    View Global Standings
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </Card>
    );
};
