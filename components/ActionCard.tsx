
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ActionConfig, Cost } from '../types';
import { useGame } from '../context/GameContext';

// --- Icons ---
const ActionIcon = () => (
    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
);

const UpgradeIcon = () => (
    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    </svg>
);

interface ActionCardProps {
    action: ActionConfig;
    isLocked?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, isLocked = false }) => {
    const { triggerAction, state, config, checkPrerequisites } = useGame();
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const actionState = state.actions[action.id];

    // Helper function for calculating scaled costs (mirrors GameContext logic)
    const getScaledCost = (
        costConfig: Cost,
        executions: number
    ): number => {
        if (!costConfig.scaleFactor) return costConfig.amount;

        let exponent = executions;

        switch (costConfig.scaleType) {
            case 'fixed':
                return costConfig.amount + (costConfig.scaleFactor * exponent);
            case 'percentage':
                return costConfig.amount * (1 + costConfig.scaleFactor * exponent);
            case 'exponential':
            default:
                return costConfig.amount * Math.pow(costConfig.scaleFactor, exponent);
        }
    };

    // Determine if affordable
    const canAfford = action.costs.every(cost => {
        const res = state.resources[cost.resourceId];
        const scaledAmount = getScaledCost(cost, actionState.executions);
        return res && res.current >= scaledAmount;
    });

    // Check Mutually Exclusive Actions
    const exclusiveBlocked = action.exclusiveWith?.some(exId => {
        const exState = state.actions[exId];
        return exState && exState.executions > 0;
    });

    // Find name of blocking action for display
    const blockingActionName = exclusiveBlocked
        ? config.actions.find(a => action.exclusiveWith?.includes(a.id) && state.actions[a.id]?.executions > 0)?.name
        : null;

    const isLimited = action.maxExecutions !== undefined;
    const isCompleted = isLimited && actionState.executions >= (action.maxExecutions || 0);
    const isDisabled = !canAfford || isCompleted || !!exclusiveBlocked || isLocked;

    const isUpgrade = isLimited && (action.maxExecutions || 0) < 100; // Heuristic for "Upgrade" vs "Repeatable Action"

    const handleMouseEnter = (e: React.MouseEvent) => {
        setHoverRect(e.currentTarget.getBoundingClientRect());
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleClick = () => {
        if (!isDisabled) {
            triggerAction(action.id);
        }
    };

    // Helper to get friendly name
    const getName = (id: string) => {
        const r = config.resources.find(r => r.id === id);
        if (r) return r.name;
        const a = config.actions.find(a => a.id === id);
        if (a) return a.name;
        const t = config.tasks.find(t => t.id === id);
        if (t) return t.name;
        const i = config.items.find(i => i.id === id);
        if (i) return i.name;
        return id;
    };

    // Helper to render an effect row
    const renderEffect = (e: any, idx: number) => {
        if (e.hidden) return null; // Skip hidden effects

        const chanceStr = e.chance ? `(${e.chance * 100}%) ` : '';
        if (e.type === 'add_resource') {
            return (
                <div key={idx} className="flex justify-between text-gray-800">
                    <span>{getName(e.resourceId!)}</span>
                    <span className="font-mono text-green-700">{e.amount > 0 ? "+" : ""}{e.amount} {chanceStr}</span>
                </div>
            );
        }
        if (e.type === 'modify_max_resource_flat') {
            return (
                <div key={idx} className="text-blue-700">
                    {chanceStr}{e.amount > 0 ? "+" : ""}{e.amount} Max {getName(e.resourceId!)}
                </div>
            );
        }
        if (e.type === 'modify_max_resource_pct') {
            return (
                <div key={idx} className="text-blue-700">
                    {chanceStr}+{(e.amount * 100).toFixed(0)}% Max {getName(e.resourceId!)}
                </div>
            );
        }
        if (e.type === 'modify_passive_gen' && e.resourceId) {
            return (
                <div key={idx} className="text-green-700">
                    {chanceStr}+{e.amount}/sec {getName(e.resourceId)}
                </div>
            );
        }
        if (e.type === 'modify_task_yield_pct' && e.taskId) {
            return (
                <div key={idx} className="text-purple-700">
                    {chanceStr}{e.amount > 0 ? "+" : ""}{(e.amount * 100).toFixed(0)}% Yield ({getName(e.taskId)})
                </div>
            );
        }
        if (e.type === 'add_item' && e.itemId) {
            return (
                <div key={idx} className="text-orange-700">
                    {chanceStr}Gain: {getName(e.itemId)}
                </div>
            );
        }
        if (e.type === 'increase_max_tasks') {
            return (
                <div key={idx} className="text-purple-700">
                    {chanceStr}Increases max tasks by {e.amount}
                </div>
            );
        }
        return null;
    };

    const renderTooltip = () => {
        if (!isHovered || !hoverRect) return null;

        const tooltipStyle: React.CSSProperties = {
            position: 'fixed',
            top: hoverRect.bottom + 5, // Under the card
            left: hoverRect.left,
            zIndex: 9999,
        };

        // If too low on screen, flip to top
        if ((tooltipStyle.top as number) + 250 > window.innerHeight) {
            // @ts-ignore
            delete tooltipStyle.top;
            tooltipStyle.bottom = (window.innerHeight - hoverRect.top) + 5;
        }

        return createPortal(
            <div
                style={tooltipStyle}
                className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none animate-fade-in z-[9999]"
            >
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-black mr-2 leading-tight">{action.name}</span>
                    <div className="text-right text-gray-600 whitespace-nowrap">
                        {isLocked && <span className="text-red-600 font-bold uppercase">Locked</span>}
                        {isLimited && (
                            <span className={isCompleted ? 'text-gray-400' : 'text-gray-800 font-mono'}>
                                {isCompleted ? 'Maxed' : `${actionState.executions}/${action.maxExecutions}`}
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-gray-700 mb-2 leading-snug">{action.description}</p>

                {action.lockDescription && actionState.executions === 0 && (
                    <div className="mb-2 p-1 bg-red-100 border border-red-300 text-red-700 rounded text-center">
                        {action.lockDescription}
                    </div>
                )}


                {exclusiveBlocked && (
                    <div className="mb-2 p-1 bg-red-100 border border-red-300 text-red-700 rounded text-center">
                        Incompatible with {blockingActionName}
                    </div>
                )}

                {action.exclusiveWith && !exclusiveBlocked && (
                    <div className="mb-2 text-yellow-700 italic text-[10px]">
                        Mutually exclusive with: {action.exclusiveWith.map(id => getName(id)).join(", ")}
                    </div>
                )}

                {/* Requirements */}
                {isLocked && action.prerequisites && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Need</div>
                        {action.prerequisites.map((req, idx) => {
                            let met = true;
                            let text = "";
                            if (req.resourceId) {
                                const current = state.resources[req.resourceId]?.current || 0;
                                if (req.minAmount && current < req.minAmount) met = false;
                                if (req.maxAmount && current > req.maxAmount) met = false;
                                text = `${req.minAmount} ${getName(req.resourceId)}`;
                            } else if (req.actionId) {
                                const act = state.actions[req.actionId];
                                if (!act || act.executions < 1) met = false;
                                text = `Upgrade: ${getName(req.actionId)}`;
                            }

                            return (
                                <div key={idx} className={`flex justify-between ${met ? 'text-gray-900' : 'text-red-600'}`}>
                                    <span>{text}</span>
                                    <span>{met ? '✔' : '✖'}</span>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* Costs */}
                {action.costs.length > 0 && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Cost</div>
                        {action.costs.map(c => {
                            const scaledAmount = getScaledCost(c, actionState.executions);
                            const canPay = (state.resources[c.resourceId]?.current || 0) >= scaledAmount;
                            return (
                                <div key={c.resourceId} className="flex justify-between text-gray-800">
                                    <span>{getName(c.resourceId)}</span>
                                    <span className={`font-mono ${canPay ? 'text-red-700' : 'text-red-400'}`}>
                                        {Number.isInteger(scaledAmount) ? scaledAmount : scaledAmount.toFixed(1)}
                                    </span>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* Effects */}
                {action.effects.some(e => !e.hidden) && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Effects</div>
                        {action.effects.map((e, idx) => renderEffect(e, idx))}
                    </>
                )}

                {/* First Time Bonus */}
                {action.firstCompletionEffects && action.firstCompletionEffects.some(e => !e.hidden) && actionState.executions === 0 && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1 flex justify-between">
                            First Use Bonus
                        </div>
                        {action.firstCompletionEffects.map((e, idx) => renderEffect(e, idx))}
                    </>
                )}
            </div>,
            document.body
        );
    };

    // --- Dynamic Styling ---
    let styleClass = "relative flex flex-col items-start p-2 border rounded-sm w-full text-left transition-all mb-0 overflow-visible h-full min-h-[60px] ";

    if (exclusiveBlocked) {
        styleClass += "bg-gray-200 border-gray-300 opacity-50 cursor-not-allowed";
    } else if (isCompleted) {
        styleClass += "bg-gray-50 border-gray-200 text-gray-400 cursor-default grayscale";
    } else if (isLocked) {
        // Updated styling for locked items: significantly darker/grayer
        styleClass += "bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed grayscale";
    } else if (!canAfford) {
        styleClass += "bg-slate-50 border-gray-200 text-gray-500 opacity-70 cursor-not-allowed";
    } else {
        // Affordable & Available
        if (isUpgrade) {
            styleClass += "bg-yellow-50/20 border-yellow-200 hover:border-yellow-400 hover:shadow-sm cursor-pointer hover:bg-yellow-50/50 border-b-2";
        } else {
            // Brighter background for unlocked actions
            styleClass += "bg-orange-10 border-orange-300 hover:border-orange-400 hover:shadow-sm cursor-pointer hover:bg-orange-100";
        }
    }

    return (
        <>
            {renderTooltip()}
            <button
                onClick={handleClick}
                aria-disabled={isDisabled}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`group ${styleClass}`}
            >
                {exclusiveBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-80">BLOCKED</div>
                    </div>
                )}
                {isLocked && !exclusiveBlocked && (
                    <div className="absolute top-2 right-2 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                )}

                <div className="flex justify-between items-start w-full h-full">
                    <div className="flex flex-col w-full">
                        {/* Header Row */}
                        <div className="flex justify-between items-start w-full mb-1">
                            <span className={`font-semibold text-xs leading-tight text-left pr-1 ${exclusiveBlocked ? 'line-through' : ''} ${isLocked ? 'text-gray-600' : 'text-gray-800'}`}>
                                {action.name}
                            </span>

                            {/* Type Icon */}
                            {!isLocked && !exclusiveBlocked && (
                                <div className={`flex flex-col items-end shrink-0 ${isUpgrade ? 'text-yellow-500' : 'text-slate-400'}`}>
                                    {isUpgrade ? <UpgradeIcon /> : <ActionIcon />}
                                </div>
                            )}
                        </div>

                        {/* Limit Badge */}
                        {isLimited && !exclusiveBlocked && !isLocked && (
                            <div className={`text-[9px] font-mono mt-auto pt-1 self-start ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isCompleted ? 'Maxed' : `${actionState.executions}/${action.maxExecutions}`}
                            </div>
                        )}
                    </div>
                </div>
            </button>
        </>
    );
};
