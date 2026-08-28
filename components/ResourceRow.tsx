
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ResourceConfig } from '../types';
import { useGame } from '../context/GameContext';

interface ResourceRowProps {
    resource: ResourceConfig;
}

export const ResourceRow: React.FC<ResourceRowProps> = ({ resource }) => {
    const { state, config, getMaxResource, getResourceBreakdown } = useGame();
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const current = state.resources[resource.id]?.current || 0;
    const max = getMaxResource(resource.id);
    const { maxModifiers, rates, totalRate } = getResourceBreakdown(resource.id);
    const isUncapped = max >= 999999999 || resource.id === "motes";

    // Don't render if locked (0 max)
    if (max <= 0) return null;

    const handleMouseEnter = (e: React.MouseEvent) => {
        setHoverRect(e.currentTarget.getBoundingClientRect());
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const getName = (id: string) => {
        return config.resources.find(r => r.id === id)?.name || id;
    };

    // Calculate Tooltip Position
    let tooltipStyle: React.CSSProperties = { display: 'none' };

    if (isHovered && hoverRect) {
        tooltipStyle = {
            position: 'fixed',
            top: hoverRect.top,
            zIndex: 9999,
        };

        // Basic resources (Left Col) -> Tooltip on Right
        if (resource.type === 'basic') {
            tooltipStyle.left = hoverRect.right + 10;
        }
        // Stat resources (Right Col) -> Tooltip on Left
        else {
            tooltipStyle.right = (window.innerWidth - hoverRect.left) + 10;
        }
    }

    const renderTooltip = () => {
        if (!isHovered || !hoverRect) return null;

        return createPortal(
            <div
                style={tooltipStyle}
                className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none animate-fade-in z-[9999]"
            >
                {/* Header: Name and Count/Rate */}
                <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-sm text-black mr-2">{resource.name}</div>
                    <div className="text-right">
                        <div className="font-mono font-bold leading-none text-gray-900">
                            {Math.floor(current)} <span className="text-gray-600 font-normal">{isUncapped ? "/ ∞" : `/ ${max}`}</span>
                        </div>
                        {totalRate !== 0 && (
                            <div className={`font-mono text-[10px] mt-0.5 ${totalRate > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {totalRate > 0 ? '+' : ''}{totalRate.toFixed(4)}/s
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {resource.description && (
                    <div className="mb-2 text-gray-700 italic leading-snug">
                        {resource.description}
                    </div>
                )}

                {/* Modifications (Outgoing Passive Gen) */}
                {resource.passiveGen && resource.passiveGen.length > 0 && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-900 mb-1">Modifications:</div>
                        <div className="space-y-0.5">
                            {resource.passiveGen.map((gen, idx) => {
                                const targetName = getName(gen.targetResourceId);
                                // Check if target is unlocked to avoid spoilers/clutter
                                if (getMaxResource(gen.targetResourceId) <= 0) return null;

                                return (
                                    <div key={idx} className="flex justify-between text-[11px]">
                                        <span className="text-gray-700">{targetName}</span>
                                        <span className={`font-mono ${gen.ratePerUnit > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {gen.ratePerUnit > 0 ? '+' : ''}{gen.ratePerUnit}/s
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
                {/* Sources (Incoming Rates) Breakdown */}
                {(rates.length > 0 || maxModifiers.length > 0) && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>

                        {/* Income Sources */}
                        {rates.length > 0 && (
                            <div>
                                <div className="font-semibold text-gray-600 italic text-[10px] mb-0.5">Income Sources:</div>
                                {rates.map((rate, idx) => (
                                    <div key={idx} className="flex justify-between text-[10px]">
                                        <span className="text-gray-600">{rate.source}</span>
                                        <span className={rate.amount > 0 ? 'text-green-700' : 'text-red-700'}>
                                            {rate.amount > 0 ? '+' : ''}{parseFloat(rate.amount.toFixed(3))}/s
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>,
            document.body
        );
    };
    return (
        <div
            className="group relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {renderTooltip()}

            {/* Display Logic */}
            {resource.type === 'basic' ? (
                <div className="grid h-8 grid-cols-[1fr_auto] items-center gap-x-2 border-b border-gray-200 px-1 hover:bg-gray-100 last:border-0 cursor-help transition-colors">
                    <span className="font-semibold text-gray-700">{resource.name}</span>
                    <div className="flex h-full flex-col items-end justify-center">
                        <span className="font-mono text-gray-600">
                            {current.toFixed(1)}<span className="text-gray-400">{isUncapped ? "/∞" : `/${max}`}</span>
                        </span>
                        <span className={`h-3 text-[10px] font-mono leading-none ${totalRate !== 0 ? (totalRate > 0 ? 'text-green-600' : 'text-red-600') : 'invisible'}`}>
                            {totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}/s
                        </span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 cursor-help">
                    <span className="truncate text-xs font-medium text-gray-700">{resource.name}</span>
                    <div className="relative h-5 min-w-0 w-full overflow-hidden rounded-md border border-gray-600 bg-gray-300">
                        <div
                            className={`h-full ${resource.color || 'bg-blue-500'} transition-all duration-200 ease-linear`}
                            style={{ width: `${Math.min(100, Math.max(0, (current / max) * 100))}%` }}
                        />
                        <span className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center whitespace-nowrap rounded bg-white/60 px-1.5 text-[10px] font-semibold text-gray-800 drop-shadow-sm">
                            {isUncapped ? `${current.toFixed(2)} / ∞` : `${current.toFixed(2)} / ${max.toFixed(2)}`}
                        </span>
                    </div>
                    <div className={`col-start-2 h-3 text-right font-mono text-[10px] leading-none ${totalRate !== 0 ? (totalRate > 0 ? 'text-green-600' : 'text-red-600') : 'invisible'}`}>
                        {totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}/s
                    </div>
                </div>
            )}
        </div>
    );
};
