import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';

const TICK_RATE_MS = 100;
const TICKS_PER_SECOND = 1000 / TICK_RATE_MS; // matches engine TICK_RATE_MS
const OFFLINE_CAP_SEC = 604800;
const OFFLINE_THRESHOLD_SEC = 5;
const LOW_ESSENCE_TICKS = 10;

interface SpeedButtonConfig {
  multiplier: 1 | 2 | 4 | 8;
  costs: { resourceId: string; amount: number }[];
  prerequisites?: any[];
  name?: string;
  description?: string;
}

const SPEED_STYLES: Record<number, { base: string; active: string; ring: string; dot: string }> = {
  1: {
    base: 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-white hover:border-gray-400',
    active: 'bg-white border-gray-400 text-gray-900 shadow-sm',
    ring: 'ring-gray-400',
    dot: 'bg-gray-400',
  },
  2: {
    base: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
    active: 'bg-blue-600 border-blue-600 text-white shadow-sm',
    ring: 'ring-blue-300',
    dot: 'bg-blue-500',
  },
  4: {
    base: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300',
    active: 'bg-purple-600 border-purple-600 text-white shadow-sm',
    ring: 'ring-purple-300',
    dot: 'bg-purple-500',
  },
  8: {
    base: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300',
    active: 'bg-amber-600 border-amber-600 text-white shadow-sm',
    ring: 'ring-amber-300',
    dot: 'bg-amber-500',
  },
};

export const SpeedControl: React.FC = () => {
  const { state, config, setGameSpeed, checkPrerequisites, getMaxResource } = useGame();
  const [hoveredMultiplier, setHoveredMultiplier] = useState<number | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const speedTiers = (config.speedTiers as SpeedButtonConfig[]) || [];

  // Handle empty tier list: render nothing (or just 1x fallback)
  if (!speedTiers || speedTiers.length === 0) {
    return null;
  }

  // Sort by multiplier ascending for stable order
  const sortedTiers = [...speedTiers].sort((a, b) => a.multiplier - b.multiplier);

  const activeTier = sortedTiers.find(t => t.multiplier === state.gameSpeed) || sortedTiers.find(t => t.multiplier === 1);
  const activeMultiplier = (state.gameSpeed as number) || 1;

  // Resource helpers
  const getResourceName = (id: string) => config.resources.find(r => r.id === id)?.name || id;
  const getResourceCurrent = (id: string) => state.resources[id]?.current ?? 0;

  // Inline drain indicator helpers
  const activeCostPerTick = activeTier?.costs?.length ? activeTier.costs.reduce((sum: number, c: any) => sum + c.amount, 0) : 0;
  const costPerSecond = activeCostPerTick * TICKS_PER_SECOND;

  // Remaining ticks / seconds calculation (primary cost resource)
  let remainingTicks: number | null = null;
  let remainingSecondsReal: number | null = null;
  if (activeTier && activeTier.costs.length > 0) {
    const primaryCost = activeTier.costs[0];
    const currentEssence = getResourceCurrent(primaryCost.resourceId);
    if (primaryCost.amount > 0) {
      remainingTicks = Math.floor(currentEssence / primaryCost.amount);
      remainingSecondsReal = remainingTicks * (TICK_RATE_MS / 1000);
    }
  }

  const isLowEssence = remainingTicks !== null && remainingTicks < LOW_ESSENCE_TICKS && activeMultiplier > 1;

  // Warning container styling when low essence
  const containerWarningClass = isLowEssence
    ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
    : 'bg-white border-gray-200';

  const handleMouseEnter = (e: React.MouseEvent, mult: number) => {
    setHoverRect(e.currentTarget.getBoundingClientRect());
    setHoveredMultiplier(mult);
  };
  const handleMouseLeave = () => {
    setHoveredMultiplier(null);
    setHoverRect(null);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>, mult: number) => {
    setHoverRect(e.currentTarget.getBoundingClientRect());
    setHoveredMultiplier(mult);
  };
  const handleBlur = () => {
    setHoveredMultiplier(null);
    setHoverRect(null);
  };

  const renderTooltip = () => {
    if (hoveredMultiplier === null || !hoverRect) return null;
    const tier = sortedTiers.find(t => t.multiplier === hoveredMultiplier);
    if (!tier) return null;

    const isActive = state.gameSpeed === tier.multiplier;
    const prereqMet = checkPrerequisites(tier.prerequisites);
    const canAffordOneTick = !tier.costs || tier.costs.length === 0 || tier.costs.every((c: any) => getResourceCurrent(c.resourceId) >= c.amount);

    // Affordability ticks for this tier
    let ticksAffordable: number | null = null;
    let reason = '';
    if (tier.costs.length === 0) {
      ticksAffordable = Infinity;
    } else {
      const primary = tier.costs[0];
      if (primary.amount > 0) {
        ticksAffordable = Math.floor(getResourceCurrent(primary.resourceId) / primary.amount);
      }
      if (!canAffordOneTick) reason = 'Insufficient essence';
    }
    if (!prereqMet) reason = 'Prerequisites not met';

    // Remaining estimate for tooltip
    let tooltipRemaining = '';
    if (ticksAffordable !== null && isFinite(ticksAffordable)) {
      const secReal = (ticksAffordable * (TICK_RATE_MS / 1000)).toFixed(1);
      const secGame = (ticksAffordable * (TICK_RATE_MS / 1000) * tier.multiplier).toFixed(1);
      tooltipRemaining = `${ticksAffordable} ticks (~${secReal}s real / ${secGame}s game)`;
    } else if (tier.costs.length === 0) {
      tooltipRemaining = 'Unlimited (no cost)';
    }

    const tooltipStyle: React.CSSProperties = {
      position: 'fixed',
      top: hoverRect.bottom + 6,
      left: hoverRect.left,
      zIndex: 9999,
    };
    if ((tooltipStyle.top as number) + 220 > window.innerHeight) {
      delete (tooltipStyle as any).top;
      (tooltipStyle as any).bottom = window.innerHeight - hoverRect.top + 6;
    }
    // Keep inside viewport horizontally
    if ((tooltipStyle.left as number) + 260 > window.innerWidth) {
      (tooltipStyle.left as number) = window.innerWidth - 268;
    }
    if ((tooltipStyle.left as number) < 8) (tooltipStyle.left as number) = 8;

    return createPortal(
      <div
        style={tooltipStyle}
        className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none z-[9999]"
      >
        <div className="flex justify-between items-start mb-1">
          <span className="font-bold text-sm text-black leading-tight">{tier.name || `${tier.multiplier}×`}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isActive ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
            {isActive ? 'Active' : `${tier.multiplier}×`}
          </span>
        </div>
        {tier.description && <p className="text-gray-700 mb-2 leading-snug">{tier.description}</p>}

        {/* Costs per tick */}
        {tier.costs.length > 0 ? (
          <>
            <div className="border-t border-gray-400 my-2"></div>
            <div className="font-semibold text-gray-600 italic mb-1">Cost per tick</div>
            {tier.costs.map((c: any) => (
              <div key={c.resourceId} className="flex justify-between text-gray-800">
                <span>{getResourceName(c.resourceId)}</span>
                <span className="font-mono text-red-700">{c.amount} / tick ({c.amount * TICKS_PER_SECOND}/sec)</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="border-t border-gray-400 my-2"></div>
            <div className="text-green-700 font-semibold">No cost — always available</div>
          </>
        )}

        {/* Prerequisites */}
        {tier.prerequisites && tier.prerequisites.length > 0 && (
          <>
            <div className="border-t border-gray-400 my-2"></div>
            <div className="font-semibold text-gray-600 italic mb-1">Prerequisites</div>
            {tier.prerequisites.map((p: any, idx: number) => {
              let text = '';
              let met = true;
              if (p.resourceId) {
                const name = getResourceName(p.resourceId);
                if (p.minMax !== undefined) {
                  text = `${p.minMax} max ${name}`;
                  met = getMaxResource(p.resourceId) >= p.minMax;
                } else if (p.minAmount !== undefined) {
                  text = `${p.minAmount} ${name}`;
                  met = getResourceCurrent(p.resourceId) >= p.minAmount;
                } else {
                  text = name;
                }
              } else if (p.actionId) {
                text = `Action: ${p.actionId}`;
                met = (state.actions[p.actionId]?.executions ?? 0) >= (p.minExecutions ?? 1);
              } else if (p.taskId) {
                text = `Task: ${p.taskId}`;
                met = !!state.tasks[p.taskId]?.unlocked;
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

        {/* Affordability */}
        <div className="border-t border-gray-400 my-2"></div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-600 italic">Affordability</span>
          <span className={`font-mono font-bold ${!canAffordOneTick || !prereqMet ? 'text-red-600' : 'text-green-700'}`}>
            {!prereqMet ? 'Locked' : !canAffordOneTick ? 'Cannot afford' : `Can afford ${ticksAffordable} ticks`}
          </span>
        </div>
        {!prereqMet && reason && <div className="text-red-600 text-[11px] mt-1">{reason}</div>}
        {canAffordOneTick && prereqMet && ticksAffordable !== null && isFinite(ticksAffordable) && (
          <div className="text-gray-600 text-[11px] mt-1">{tooltipRemaining}</div>
        )}
        {!isActive && !prereqMet && <div className="text-amber-700 text-[11px] mt-1 italic">Complete prerequisites to unlock.</div>}
        {!isActive && prereqMet && !canAffordOneTick && <div className="text-amber-700 text-[11px] mt-1 italic">Gather more {tier.costs.map((c:any)=>getResourceName(c.resourceId)).join(', ')} to use.</div>}
        {isActive && <div className="text-blue-600 text-[11px] mt-1 font-semibold">Currently active</div>}
      </div>,
      document.body
    );
  };

  return (
    <>
      {renderTooltip()}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm ${containerWarningClass} ${isLowEssence ? 'animate-pulse' : ''}`} role="group" aria-label="Game speed control">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-1 hidden sm:inline">Speed</span>
        <div className="flex items-center rounded-md overflow-hidden border border-gray-200">
          {sortedTiers.map(tier => {
            const isActive = state.gameSpeed === tier.multiplier;
            const prereqMet = checkPrerequisites(tier.prerequisites);
            const canAffordOneTick = !tier.costs || tier.costs.length === 0 || tier.costs.every((c: any) => getResourceCurrent(c.resourceId) >= c.amount);
            // Inactive buttons disabled if prereq not met OR cannot afford one tick
            const isDisabled = !isActive && (!prereqMet || !canAffordOneTick);
            const styles = SPEED_STYLES[tier.multiplier] || SPEED_STYLES[1];

            let buttonClass = 'px-2.5 py-1 text-xs font-bold border-r last:border-r-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ';
            if (isActive) {
              buttonClass += styles.active + ' ';
              if (tier.multiplier > 1) {
                buttonClass += `animate-pulse ring-2 ring-offset-1 ${styles.ring} `;
              }
            } else if (isDisabled) {
              buttonClass += 'bg-gray-50 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed ';
            } else {
              buttonClass += styles.base + ' border-gray-200 ';
            }

            return (
              <button
                key={tier.multiplier}
                onClick={() => !isDisabled && setGameSpeed(tier.multiplier)}
                onMouseEnter={e => handleMouseEnter(e, tier.multiplier)}
                onMouseLeave={handleMouseLeave}
                onFocus={e => handleFocus(e, tier.multiplier)}
                onBlur={handleBlur}
                disabled={isDisabled}
                aria-pressed={isActive}
                aria-label={`Set speed to ${tier.multiplier} times, ${tier.name || ''}${tier.description ? ' - ' + tier.description : ''}`}
                className={buttonClass}
              >
                {tier.multiplier}×
              </button>
            );
          })}
        </div>

        {/* Inline drain indicator when >1× */}
        {activeMultiplier > 1 && activeTier && activeTier.costs.length > 0 && (
          <div className={`flex items-center gap-2 ml-1 text-[11px] font-mono ${isLowEssence ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
            <span className={`hidden sm:inline ${isLowEssence ? 'text-red-600' : 'text-gray-500'}`}>
              −{activeCostPerTick}/tick ({costPerSecond}/sec)
            </span>
            <span className="sm:hidden">−{activeCostPerTick}/t</span>
            {remainingTicks !== null && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${isLowEssence ? 'bg-red-100 border border-red-300 text-red-700' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
                ≈ {remainingTicks} ticks (~{remainingSecondsReal?.toFixed(1)}s)
              </span>
            )}
          </div>
        )}
        {activeMultiplier > 1 && activeTier && activeTier.costs.length === 0 && (
          <div className="text-[11px] font-mono text-green-600 ml-1">No drain</div>
        )}
        {isLowEssence && (
          <span className="text-[10px] font-bold text-red-600 uppercase hidden md:inline animate-pulse ml-1">Low Essence!</span>
        )}
      </div>
    </>
  );
};
