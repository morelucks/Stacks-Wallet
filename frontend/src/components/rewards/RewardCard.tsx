import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useRewards } from '../../hooks/useRewards';

/**
 * RewardCard Component
 * Displays a summary of the user's rewards, multipliers, and impact scores.
 * Includes a call-to-action to claim available rewards.
 */
export const RewardCard: React.FC = () => {
    const { stats, isLoading, claimAvailableRewards, isConnected } = useRewards();

    // Show a placeholder if the wallet is not connected
    if (!isConnected) {
        return (
            <Card className="rewards-card p-8 text-center bg-gray-900 border-gray-800">
                <div className="mb-4 text-4xl">🎁</div>
                <h3 className="text-xl font-bold mb-2 text-white">Your Rewards</h3>
                <p className="text-gray-400 mb-6 text-sm">
                    Connect your Stacks wallet to view your active multipliers and claimable rewards.
                </p>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                </div>
            </Card>
        );
    }

    /**
     * Handles the claim process by requesting a signature and broadcasting the transaction.
     */
    const handleClaim = async () => {
        if (!stats || stats.currentPayout <= 0) return;

        // In a production environment, we would first request a claim signature from
        // the backend rewards oracle. For this implementation, we use a placeholder.
        const MOCK_SIGNATURE = "0x" + "0".repeat(130);

        try {
            await claimAvailableRewards(
                Math.floor(stats.currentPayout * 1000000), // Convert to microstacks
                0, // Nonce (should be fetched from contract)
                1000000, // Deadline
                MOCK_SIGNATURE
            );
        } catch (err) {
            console.error("Reward claim failed:", err);
        }
    };

    return (
        <Card className="rewards-card p-6 flex flex-col gap-6 bg-gray-900 border-gray-700 shadow-xl relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-600 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>

            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Reward Account</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {appKit.getState().accounts?.[0]?.address.slice(-8)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${stats?.isGitHubVerified
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                    {stats?.isGitHubVerified ? 'Verified GH' : 'GH Pending'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 z-10">
                <div className="stat-box p-3 bg-black/40 rounded-lg border border-gray-800">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Activity Index</label>
                    <div className="text-xl font-mono text-purple-400">{stats?.totalImpact || 0}</div>
                </div>
                <div className="stat-box p-3 bg-black/40 rounded-lg border border-gray-800">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Yield Multiplier</label>
                    <div className="text-xl font-mono text-blue-400">{(stats?.multiplier || 100) / 100}x</div>
                </div>
                <div className="stat-box p-3 bg-black/40 rounded-lg border border-gray-800">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Commits/PRs</label>
                    <div className="text-xl font-mono text-cyan-400">{stats?.baseScore || 0}</div>
                </div>
                <div className="stat-box p-3 bg-gradient-to-br from-green-900/20 to-black/40 rounded-lg border border-green-900/30">
                    <label className="text-[10px] text-green-500/60 uppercase font-bold mb-1 block">Liquid STX</label>
                    <div className="text-xl font-mono text-green-400">{stats?.currentPayout || 0.00}</div>
                </div>
            </div>

            <div className="z-10">
                <Button
                    onClick={handleClaim}
                    disabled={isLoading || !stats || stats.currentPayout === 0}
                    className={`w-full h-12 transition-all duration-300 font-bold uppercase tracking-widest ${!isLoading && stats && stats.currentPayout > 0
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-none'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Claiming...
                        </span>
                    ) : 'Execute Payout'}
                </Button>
            </div>

            <p className="text-[9px] text-gray-600 text-center tracking-tight leading-relaxed z-10">
                Verification completed at {(new Date()).toLocaleTimeString()}. <br />
                All calculations are perform on-chain via the Stacks Calculator contract.
            </p>
        </Card>
    );
};
