/**
 * Hook for tracking Stacks-specific library usage and activity.
 * Monitors calls to @stacks/connect and @stacks/transactions to reward builders.
 */

import { useState, useEffect, useCallback } from 'react';

export interface StacksActivity {
    connectUsage: number;
    transactionCount: number;
    contractInteractions: number;
    lastActionTimestamp: number;
    currentSessionMinutes: number;
}

export function useStacksActivity() {
    const [activity, setActivity] = useState<StacksActivity>({
        connectUsage: 0,
        transactionCount: 0,
        contractInteractions: 0,
        lastActionTimestamp: Date.now(),
        currentSessionMinutes: 0
    });

    /**
     * Records a manual activity point for the current session.
     */
    const recordActivity = useCallback((type: 'connect' | 'tx' | 'contract') => {
        setActivity(prev => {
            const newActivity = { ...prev };
            if (type === 'connect') newActivity.connectUsage += 1;
            if (type === 'tx') newActivity.transactionCount += 1;
            if (type === 'contract') newActivity.contractInteractions += 1;

            newActivity.lastActionTimestamp = Date.now();
            return newActivity;
        });

        // Fire a custom event that could be picked up by an analytics engine
        window.dispatchEvent(new CustomEvent('stacks-activity-logged', {
            detail: { type, timestamp: Date.now() }
        }));
    }, []);

    // Track session duration
    useEffect(() => {
        const timer = setInterval(() => {
            setActivity(prev => ({
                ...prev,
                currentSessionMinutes: prev.currentSessionMinutes + 1
            }));
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    /**
     * Returns a multiplier bonus based on the detected activity level.
     */
    const calculateActivityBonus = useCallback(() => {
        const totalActions = activity.connectUsage + activity.transactionCount + activity.contractInteractions;
        if (totalActions > 50) return 50; // +0.5x multiplier
        if (totalActions > 20) return 20; // +0.2x multiplier
        if (totalActions > 5) return 5;   // +0.05x multiplier
        return 0;
    }, [activity]);

    return {
        activity,
        recordActivity,
        activityBonus: calculateActivityBonus(),
        isDeveloperMode: activity.contractInteractions > 0
    };
}
