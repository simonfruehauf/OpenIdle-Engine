
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ConverterConfig } from '../types';
import { useGame } from '../context/GameContext';

interface ConverterCardProps {
    converter: ConverterConfig;
    isOwned: boolean;
}

export const ConverterCard: React.FC<ConverterCardProps> = ({ converter, isOwned }) => {
    const { state, config, buyConverter, toggleConverter } = useGame();
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const cState = state.converters[converter.id];
    const isActive = cState?.active || false;

    // Check affordability
    const canAffordBuy = converter.cost.every(c =>
        (state.resources[c.resourceId]?.current || 0) >= c.amount
    );
    const canAffordRun = converter.costPerSecond.every(c =>
        (state.resources[c.resourceId]?.current || 0) > 0
    );

    const getName = (id: string) => {
        const r = config.resources.find(r => r.id === id);
        if (r) return r.name;
        return id;
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
        setHoverRect(e.currentTarget.getBoundingClientRect());
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleClick = () => {
        if (isOwned) {
            if (converter.canBeToggled) {
                toggleConverter(converter.id);
            }
        } else if (canAffordBuy) {
            buyConverter(converter.id);
        }
    };

    const renderTooltip = () => {
        if (!isHovered || !hoverRect) return null;

        const tooltipStyle: React.CSSProperties = {
            position: 'fixed',
            top: hoverRect.bottom + 5,
            left: hoverRect.left,
            zIndex: 9999,
        };

        if ((tooltipStyle.top as number) + 250 > window.innerHeight) {
            delete tooltipStyle.top;
            tooltipStyle.bottom = (window.innerHeight - hoverRect.top) + 5;
        }

        return createPortal(
            <div
                style={tooltipStyle}
                className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none animate-fade-in z-[9999]"
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-black mr-2 leading-tight">{converter.name}</span>
                    <div className="text-right text-gray-600 whitespace-nowrap">
                        {isOwned && isActive && <span className="text-green-600 font-bold">Active</span>}
                        {isOwned && !isActive && <span className="text-gray-400">Inactive</span>}
                        {!isOwned && <span className="text-blue-600 font-bold">Available</span>}
                    </div>
                </div>

                <p className="text-gray-700 mb-2 leading-snug">{converter.description}</p>

                {!converter.canBeToggled && (
                    <div className="mb-2 p-1 border font-bold rounded text-center text-[10px]">
                        Cannot be turned off once purchased.
                    </div>
                )}

                {/* Purchase Cost (only for not owned) */}
                {!isOwned && converter.cost.length > 0 && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Purchase Cost</div>
                        {converter.cost.map(c => {
                            const current = state.resources[c.resourceId]?.current || 0;
                            const canPay = current >= c.amount;
                            return (
                                <div key={c.resourceId} className="flex justify-between text-gray-800">
                                    <span>{getName(c.resourceId)}</span>
                                    <span className={`font-mono ${canPay ? 'text-red-700' : 'text-red-400'}`}>
                                        {c.amount}
                                    </span>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* Running Cost */}
                {converter.costPerSecond.length > 0 && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Cost per Second</div>
                        {converter.costPerSecond.map(c => (
                            <div key={c.resourceId} className="flex justify-between text-gray-800">
                                <span>{getName(c.resourceId)}</span>
                                <span className="font-mono text-red-700">-{c.amount}</span>
                            </div>
                        ))}
                    </>
                )}

                {/* Output */}
                {converter.effectsPerSecond.length > 0 && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Output per Second</div>
                        {converter.effectsPerSecond.filter(e => e.type === 'add_resource').map((e, idx) => (
                            <div key={idx} className="flex justify-between text-gray-800">
                                <span>{getName(e.resourceId!)}</span>
                                <span className="font-mono text-green-700">+{e.amount}</span>
                            </div>
                        ))}
                    </>
                )}
            </div>,
            document.body
        );
    };

    // Styling
    let styleClass = "relative flex flex-col items-start p-2 border rounded-sm w-full text-left transition-all mb-0 overflow-visible h-full min-h-[60px] ";

    if (isOwned) {
        if (isActive) {
            styleClass += "bg-green-50/50 border-green-200 hover:border-green-400 cursor-pointer";
        } else if (converter.canBeToggled && canAffordRun) {
            styleClass += "bg-gray-50 border-gray-200 hover:border-gray-400 cursor-pointer";
        } else {
            styleClass += "bg-gray-100 border-gray-200 opacity-70 cursor-default";
        }
    } else {
        if (canAffordBuy) {
            styleClass += "bg-slate-50 border-gray-200 hover:border-blue-400 hover:shadow-sm cursor-pointer";
        } else {
            styleClass += "bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed";
        }
    }

    return (
        <>
            {renderTooltip()}
            <button
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`group ${styleClass}`}
            >
                <div className="flex justify-between items-start w-full h-full">
                    <div className="flex flex-col w-full">
                        <div className="flex justify-between items-start w-full mb-1">
                            <span className="font-semibold text-xs leading-tight text-left pr-1 text-gray-800">
                                {converter.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {isOwned && isActive && (
                                    <span className="text-[8px] px-1 py-0.5 bg-green-500 text-white rounded font-bold">ON</span>
                                )}
                                {!converter.canBeToggled && (
                                    <span className="text-[8px] px-1 py-0.5 bg-orange-400 text-white rounded font-bold">AUTO</span>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">{converter.description}</p>
                    </div>
                </div>
            </button>
        </>
    );
};
