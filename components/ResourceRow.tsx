
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ResourceConfig } from '../types';
import { useGame } from '../context/GameContext';
import { ProgressBar } from './ProgressBar';

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
                            {Math.floor(current)} <span className="text-gray-600 font-normal">/ {max}</span>
                        </div>
                        <div className={`font-mono text-[10px] mt-0.5 ${totalRate > 0 ? 'text-green-700' : totalRate < 0 ? 'text-red-700' : 'text-gray-600'}`}>
                            {totalRate > 0 ? '+' : ''}{totalRate.toFixed(4)}/s
                        </div>
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
                        
                        {/* Max Cap Sources */}
                        {maxModifiers.length > 0 && (
                             <div className="mb-2">
                                <div className="font-semibold text-gray-600 italic text-[10px] mb-0.5">Max Cap Sources:</div>
                                {maxModifiers.map((mod, i) => (
                                    <div key={i} className="flex justify-between text-[10px] text-gray-600">
                                        <span>{mod.sourceName}</span>
                                        <span>{mod.value > 0 ? '+' : ''}{mod.value}{mod.type === 'percent'?'%':''}</span>
                                    </div>
                                ))}
                             </div>
                        )}

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
                <div className="flex justify-between items-start border-b border-gray-200 pb-1 last:border-0 hover:bg-gray-100 px-1 cursor-help transition-colors py-1">
                    <span className="font-semibold text-gray-700 mt-0.5">{resource.name}</span>
                    <div className="flex flex-col items-end">
                        <span className="font-mono text-gray-600">
                            {Math.floor(current)}<span className="text-gray-400">/{max}</span>
                        </span>
                        {totalRate !== 0 && (
                           <span className={`text-[10px] font-mono leading-none ${totalRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                               {totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}/s
                           </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="cursor-help">
                     <div className="flex justify-between items-end mb-1 text-xs px-1">
                        <span className="font-bold text-gray-700">{resource.name}</span>
                        <span className="font-mono text-gray-600">{current.toFixed(1)} / {max}</span>
                   </div>
                   <ProgressBar
                        value={current}
                        max={max}
                        colorClass={resource.color || 'bg-blue-500'}
                        showValue={false}
                        height="h-3"
                   />
                   {totalRate !== 0 && (
                       <div className={`text-[10px] text-right font-mono -mt-1 ${totalRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {totalRate > 0 ? '+' : ''}{totalRate.toFixed(2)}/s
                       </div>
                   )}
                </div>
            )}
        </div>
    );
};
