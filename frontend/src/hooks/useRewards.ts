/**
 * Hook for managing and interacting with the Rewards System.
 * Handles fetching user stats, calculating potential payouts, and initiating claims.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useContractCall } from './useContractCall';
import { appKit } from '../lib/appkit.instance';
import { uintCV, bufferCV } from '@stacks/transactions';
import { githubApiService, type GitHubContributionData } from '../lib/github-api';

export interface RewardStats {
    baseScore: number;
    multiplier: number;
    totalImpact: number;
    currentPayout: number;
    isGitHubVerified: boolean;
    githubData?: GitHubContributionData;
}

export function useRewards() {
    const [stats, setStats] = useState<RewardStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { call, isCalling, lastTxId } = useContractCall();

    // Get the current connected address from AppKit state
    const address = useMemo(() => {
        const state = appKit.getState() as any;
        return state.accounts?.[0]?.address || null;
    }, [appKit.getState()]);

    /**
     * Fetches reward statistics from the on-chain contracts and internal APIs.
     */
    const fetchRewardStats = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            // Logic for fetching user stats would go here
            // For the purpose of this implementation, we simulate a response
            // which would normally be aggregated from multiple read-only contract calls
            const mockData: RewardStats = {
                baseScore: 1250,
                multiplier: 125, // 1.25x
                totalImpact: 4500,
                currentPayout: 15.625,
                isGitHubVerified: true
            };

            setStats(mockData);
        } catch (error) {
            console.error("Failed to fetch reward statistics:", error);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    /**
   * Links a GitHub account to the current Stacks address.
   */
    const linkGitHubAccount = useCallback(async (username: string) => {
        if (!address) return;

        setIsLoading(true);
        try {
            const isValid = await githubApiService.validateUser(username);
            if (!isValid) throw new Error("Invalid GitHub username");

            const ghData = await githubApiService.fetchUserContributions(username);
            const ghScore = githubApiService.calculateActivityScore(ghData);

            // Update local state temporarily
            setStats(prev => prev ? {
                ...prev,
                isGitHubVerified: true,
                baseScore: prev.baseScore + ghScore,
                githubData: ghData
            } : null);

            return true;
        } catch (error) {
            console.error("Failed to link GitHub account:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    /**
     * Initiates a claim transaction for the current available rewards.
     */
    const claimAvailableRewards = useCallback(async (
        amount: number,
        nonce: number,
        deadline: number,
        signature: string
    ) => {
        if (!address) return null;

        // Convert hex signature string to Buffer
        const sigBuffer = Buffer.from(signature.replace('0x', ''), 'hex');

        return await call({
            contractAddress: 'SPATASA6SYGCVB67NJ1XQ72BB0Q3EHGNGE9JQBQT',
            contractName: 'rewards-vault',
            functionName: 'claim-rewards',
            functionArgs: [
                uintCV(amount),
                uintCV(nonce),
                uintCV(deadline),
                bufferCV(sigBuffer)
            ],
            network: 'mainnet'
        });
    }, [address, call]);

    // Automatically fetch stats when the user connects their wallet
    useEffect(() => {
        if (address) {
            fetchRewardStats();
        }
    }, [address, fetchRewardStats]);

    return {
        stats,
        isLoading: isLoading || isCalling,
        fetchRewardStats,
        linkGitHubAccount,
        claimAvailableRewards,
        lastTxId,
        isConnected: !!address
    };
}
