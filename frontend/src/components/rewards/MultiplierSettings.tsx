import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

/**
 * MultiplierSettings Component
 * Allows users to configure how their rewards are calculated.
 * Simulates the selection of different loyalty tiers and focus areas.
 */
export const MultiplierSettings: React.FC = () => {
    const [selectedFocus, setSelectedFocus] = useState<'dev' | 'trader' | 'holder'>('dev');

    const focusOptions = [
        { id: 'dev', label: 'Developer Focus', multiplier: '1.5x', description: 'Priority on contract activity and GitHub' },
        { id: 'trader', label: 'Trader Focus', multiplier: '1.2x', description: 'Bonus for high volume Sip-010 transfers' },
        { id: 'holder', label: 'Holder Focus', multiplier: '1.1x', description: 'Passive rewards for STX staking duration' },
    ];

    return (
        <Card className="multiplier-settings bg-gray-900/80 border-gray-700/50 p-6 backdrop-blur-md">
            <div className="mb-6">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Reward Multipliers</h3>
                <p className="text-xs text-gray-500">Customize your earning potential based on your activity profile.</p>
            </div>

            <div className="flex flex-col gap-4">
                {focusOptions.map((option) => (
                    <div
                        key={option.id}
                        onClick={() => setSelectedFocus(option.id as any)}
                        className={`
                            p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${selectedFocus === option.id
                                ? 'bg-purple-900/20 border-purple-500 ring-2 ring-purple-500/20'
                                : 'bg-black/40 border-gray-800 hover:border-gray-700'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-white text-sm">{option.label}</span>
                            <span className={`text-xs font-mono font-black ${selectedFocus === option.id ? 'text-purple-400' : 'text-gray-500'}`}>
                                {option.multiplier}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-normal">{option.description}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Estimated Bonus</span>
                    <span className="text-sm font-black text-purple-400 font-mono">+25.4%</span>
                </div>
                <Button className="w-full bg-white text-black hover:bg-gray-200 transition-colors uppercase font-black text-xs h-10 tracking-widest">
                    Lock In Selection
                </Button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping"></div>
                <span className="text-[8px] text-yellow-500 uppercase font-bold tracking-widest">Settings propagate in next block</span>
            </div>
        </Card>
    );
};
