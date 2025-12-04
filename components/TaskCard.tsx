
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TaskConfig } from '../types';
import { useGame } from '../context/GameContext';

// --- Icons ---
const LoopIcon = () => (
    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const ProjectIcon = () => (
    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface TaskCardProps {
    task: TaskConfig;
    isLocked?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isLocked = false }) => {
    const { toggleTask, state, config } = useGame();
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const taskState = state.tasks[task.id];
    const isActive = taskState.active;

    // Calculate Multiplier for this task
    const modifiers = state.modifiers.filter(m => m.taskId === task.id && m.type === 'percent');
    const yieldMultiplier = 1 + modifiers.reduce((sum, m) => sum + m.value, 0);

    const canAffordStart = !task.startCosts || task.startCosts.every(c => {
        const res = state.resources[c.resourceId];
        return res && res.current >= c.amount;
    });

    const getScaledAmount = (base: number, scaleFactor?: number) => {
        if (!scaleFactor) return base;
        return base * Math.pow(scaleFactor, taskState.level - 1);
    };

    // Distinguish based on restart behavior
    const isLoop = task.autoRestart === true;
    const isProject = !isLoop;
    
    const isDisabled = isLocked || (!isActive && !canAffordStart);

    // Progress bar for all tasks
    const progressPercentage = Math.min(100, ((taskState.progress || 0) / (task.progressRequired || 1)) * 100);
    
    // Helper format time
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
        setHoverRect(e.currentTarget.getBoundingClientRect());
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleClick = () => {
        if (!isDisabled) {
            toggleTask(task.id);
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

    const renderTooltip = () => {
        if (!isHovered || !hoverRect) return null;

        const tooltipStyle: React.CSSProperties = {
            position: 'fixed',
            top: hoverRect.bottom + 5, // Under the card
            left: hoverRect.left,
            zIndex: 9999,
        };

        // Boundary check for bottom
        if ((tooltipStyle.top as number) + 350 > window.innerHeight) {
            // @ts-ignore
            delete tooltipStyle.top;
            tooltipStyle.bottom = (window.innerHeight - hoverRect.top) + 5;
        }

        return createPortal(
            <div 
                style={tooltipStyle} 
                className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none animate-fade-in z-[9999]"
            >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-black mr-2 leading-tight">{task.name}</span>
                    <div className="text-right text-gray-600 whitespace-nowrap">
                        <span>Completed: {taskState.completions || 0}</span>
                        {isLocked && <div className="text-red-600 font-bold text-[10px] uppercase">Locked</div>}
                    </div>
                </div>
                
                <p className="text-gray-700 mb-2 leading-snug">{task.description}</p>
                
                {!isLoop && (
                    <div className="text-gray-600 font-mono mb-2 text-[10px]">
                        Completion time: {formatTime(task.progressRequired || 0)}
                    </div>
                )}

                {/* Requirements */}
                {isLocked && task.prerequisites && (
                     <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Need</div>
                        {task.prerequisites.map((req, idx) => {
                            let met = true;
                            let text = "";
                            if (req.resourceId) {
                                const current = state.resources[req.resourceId]?.current || 0;
                                if (req.minAmount && current < req.minAmount) met = false;
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

                {/* Start Costs */}
                {task.startCosts && task.startCosts.length > 0 && (
                    <>
                         <div className="border-t border-gray-400 my-2"></div>
                         <div className="font-semibold text-gray-600 italic mb-1">Cost</div>
                         {task.startCosts.map(c => (
                            <div key={c.resourceId} className="flex justify-between text-gray-800">
                                <span>{getName(c.resourceId)}</span>
                                <span className={`font-mono ${state.resources[c.resourceId]?.current >= c.amount ? 'text-red-700' : 'text-red-400'}`}>{c.amount}</span>
                            </div>
                         ))}
                    </>
                )}

                {/* Continuous Costs */}
                {task.costPerSecond.length > 0 && (
                    <>
                         <div className="border-t border-gray-400 my-2"></div>
                         <div className="font-semibold text-gray-600 italic mb-1">Progress Cost</div>
                         {task.costPerSecond.map(c => (
                            <div key={c.resourceId} className="flex justify-between text-gray-800">
                                <span>{getName(c.resourceId)}</span>
                                <span className="font-mono text-red-700">{c.amount}/s</span>
                            </div>
                         ))}
                    </>
                )}

                {/* Effects (Per Second) */}
                {task.effectsPerSecond.some(e => !e.hidden) && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Effects</div>
                        {task.effectsPerSecond.filter(e => !e.hidden).map((e, idx) => {
                             let val = getScaledAmount(e.amount, e.scaleFactor);
                             if (e.type === 'add_resource') {
                                 val *= yieldMultiplier;
                             }
                             return (
                                <div key={idx} className="flex justify-between text-gray-800">
                                    <span>{getName(e.resourceId!)}</span>
                                    <span className="font-mono text-green-700">+{val.toFixed(2)} {e.chance ? `(${e.chance * 100}%)` : ''}</span>
                                </div>
                             );
                        })}
                    </>
                )}

                {/* Completion Rewards */}
                {task.completionEffects && task.completionEffects.some(e => !e.hidden) && (
                    <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1">Upon Completion</div>
                         {task.completionEffects.filter(e => !e.hidden).map((e, idx) => (
                             <div key={idx} className="flex justify-between text-gray-800">
                                 <span>{e.resourceId ? getName(e.resourceId) : e.itemId ? getName(e.itemId) : 'Effect'}</span>
                                 <span className="font-mono text-green-700">+{e.amount}</span>
                             </div>
                         ))}
                    </>
                )}

                {/* First Time Bonus */}
                {task.firstCompletionEffects && task.firstCompletionEffects.some(e => !e.hidden) && (taskState.completions || 0) === 0 && (
                     <>
                        <div className="border-t border-gray-400 my-2"></div>
                        <div className="font-semibold text-gray-600 italic mb-1 flex justify-between">
                            First Completion
                        </div>
                        {task.firstCompletionEffects.filter(e => !e.hidden).map((e, idx) => (
                            <div key={idx} className="flex justify-between text-gray-800">
                                <span>{e.resourceId ? getName(e.resourceId) : e.itemId ? getName(e.itemId) : 'Effect'}</span>
                                <span className="font-mono text-green-700">+{e.amount}</span>
                            </div>
                        ))}
                     </>
                )}
                
                {/* Yield Bonus */}
                {yieldMultiplier > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-400 text-purple-700 font-bold text-[10px] text-center">
                        Active Yield Bonus: +{((yieldMultiplier - 1) * 100).toFixed(0)}%
                    </div>
                )}
            </div>,
            document.body
        );
    };

    // --- Dynamic Styling ---
    let containerClass = "cursor-pointer";
    let activeColorClass = "";
    
    // Locked State
    if (isLocked) {
        containerClass = "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale";
    } 
    // Unaffordable Start State
    else if (!isActive && !canAffordStart) {
         containerClass = "bg-slate-50 border-gray-200 text-gray-500 opacity-70 cursor-not-allowed";
    }
    // Active State
    else if (isActive) {
        if (isProject) {
            containerClass = "bg-blue-50 border-blue-400 shadow-sm";
            activeColorClass = "bg-blue-500";
        } else {
            containerClass = "bg-orange-50 border-orange-400 shadow-sm";
            activeColorClass = "bg-orange-500";
        }
    } 
    // Inactive State
    else {
        containerClass = "bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50";
    }

    return (
        <>
            {renderTooltip()}
            <div 
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`
                    group relative flex flex-col p-2 border rounded-sm w-full transition-all mb-0 select-none overflow-visible h-full min-h-[60px]
                    ${containerClass}
                `}
            >
                {/* Active Indicator Strip */}
                {isActive && <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-sm ${activeColorClass}`}></div>}
                
                {/* Locked Icon */}
                {isLocked && (
                      <div className="absolute top-2 right-2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                      </div>
                 )}

                {/* Header: Always Visible */}
                <div className="flex justify-between items-start pl-2 h-full">
                    <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center w-full mb-1">
                            {/* Title & Completions */}
                            <div className="flex flex-col w-full pr-1">
                                <div className="flex justify-between items-center">
                                    <span className={`font-semibold text-xs leading-tight truncate ${isActive ? (isProject ? 'text-blue-900' : 'text-orange-900') : 'text-gray-800'} ${isLocked ? 'text-gray-500' : ''}`}>
                                        {task.name}
                                    </span>
                                    
                                    {/* Type Icon */}
                                    {!isLocked && (
                                        <div className={`shrink-0 ml-1 ${isActive ? (isProject ? 'text-blue-400' : 'text-orange-400') : 'text-gray-300'}`}>
                                            {isProject ? <ProjectIcon /> : <LoopIcon />}
                                        </div>
                                    )}
                                </div>
                                
                                {!isLocked && (
                                    <span className="text-[9px] text-gray-500 mt-0.5">
                                        Completed: {taskState.completions || 0}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Progress Bar for ALL Tasks (if active) */}
                        {isActive && (
                             <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1 border border-gray-200">
                                <div className={`h-full transition-all duration-100 ease-linear ${isProject ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${progressPercentage}%` }}></div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
