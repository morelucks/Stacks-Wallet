import React from 'react';

/**
 * ImpactBadge Component Props
 */
interface ImpactBadgeProps {
    score: number;
    label: string;
    category: 'contract' | 'github' | 'community';
}

/**
 * ImpactBadge Component
 * A visual indicator of a specific contribution metric and its impact score.
 * Features hover animations and category-specific styling.
 */
export const ImpactBadge: React.FC<ImpactBadgeProps> = ({ score, label, category }) => {
    /**
     * Returns Tailwind classes based on the badge category.
     */
    const getCategoryStyles = () => {
        switch (category) {
            case 'contract':
                return 'bg-purple-900/30 text-purple-400 border-purple-500/20 hover:bg-purple-900/50';
            case 'github':
                return 'bg-blue-900/30 text-blue-400 border-blue-500/20 hover:bg-blue-900/50';
            case 'community':
                return 'bg-green-900/30 text-green-400 border-green-500/20 hover:bg-green-900/50';
            default:
                return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    /**
     * Returns a relevant icon/emoji for the category.
     */
    const getIcon = () => {
        switch (category) {
            case 'contract': return '📜';
            case 'github': return '💻';
            case 'community': return '💎';
            default: return '⭐';
        }
    };

    // Calculate percentage for the visual progress ring (capped at 100)
    const percentage = Math.min(score, 100);
    const strokeDasharray = 44; // Circumference roughly
    const strokeDashoffset = strokeDasharray - (strokeDasharray * (percentage / 100));

    return (
        <div className={`
      impact-badge flex items-center gap-3 px-4 py-2 rounded-full border 
      transition-all duration-300 transform hover:scale-105 active:scale-95 
      cursor-default shadow-sm ${getCategoryStyles()}
    `}>
            <span className="text-lg filter drop-shadow-sm">{getIcon()}</span>

            <div className="flex flex-col justify-center">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-60 leading-none mb-0.5">
                    {label}
                </span>
                <span className="text-xs font-bold font-mono leading-none">
                    +{score} IMPACT
                </span>
            </div>

            {/* Visual Progress ring */}
            <div className="relative w-5 h-5 ml-1">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="10"
                        cy="10"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="opacity-10"
                    />
                    <circle
                        cx="10"
                        cy="10"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
            </div>
        </div>
    );
};
