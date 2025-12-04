import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { ITEMS, SLOTS } from '../gameData/index';
import { ItemConfig } from '../types';

// --- Tooltip Component ---
const ItemTooltip: React.FC<{ item: ItemConfig; rect: DOMRect | null }> = ({ item, rect }) => {
    if (!rect) return null;

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        top: rect.bottom + 5,
        left: rect.left,
        zIndex: 9999,
    };

    // Flip if too close to bottom
    if ((tooltipStyle.top as number) + 200 > window.innerHeight) {
        // @ts-ignore
        delete tooltipStyle.top;
        tooltipStyle.bottom = (window.innerHeight - rect.top) + 5;
    }

    // Helper to format effects
    const renderEffect = (e: any, idx: number) => {
        if (e.hidden) return null;
        
        if (e.type === 'modify_max_resource_flat') {
            return <div key={idx} className="text-blue-700">{e.amount > 0 ? '+' : ''}{e.amount} Max {e.resourceId}</div>;
        }
        if (e.type === 'modify_max_resource_pct') {
             return <div key={idx} className="text-blue-700">{e.amount > 0 ? '+' : ''}{Math.round(e.amount * 100)}% Max {e.resourceId}</div>;
        }
        if (e.type === 'modify_passive_gen') {
             return <div key={idx} className="text-green-700">{e.amount > 0 ? '+' : ''}{e.amount}/s {e.resourceId}</div>;
        }
        if (e.type === 'modify_task_yield_pct') {
            return <div key={idx} className="text-purple-700">{e.amount > 0 ? '+' : ''}{Math.round(e.amount * 100)}% Yield ({e.taskId})</div>;
        }
        return null;
    };

    return createPortal(
        <div 
            style={tooltipStyle} 
            className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none z-[9999]"
        >
            <div className="font-bold text-sm mb-1">{item.name}</div>
            <div className="text-[10px] text-gray-500 italic mb-2">
                {SLOTS.find(s => s.id === item.slot)?.name}
            </div>
            <p className="text-gray-700 mb-2 leading-snug">{item.description}</p>
            
            {item.effects.length > 0 && (
                <>
                     <div className="border-t border-gray-400 my-2"></div>
                     <div className="font-semibold text-gray-600 italic mb-1">Effects</div>
                     {item.effects.map((e, i) => renderEffect(e, i))}
                </>
            )}
        </div>,
        document.body
    );
};

export const EquipmentView: React.FC = () => {
    const { state, config, unequipItem, equipItem, checkPrerequisites } = useGame();
    const [hoverItem, setHoverItem] = useState<ItemConfig | null>(null);
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = (e: React.MouseEvent, item: ItemConfig) => {
        setHoverRect(e.currentTarget.getBoundingClientRect());
        setHoverItem(item);
    };

    const handleMouseLeave = () => {
        setHoverItem(null);
        setHoverRect(null);
    };

    return (
        <div className="p-4 relative">
            {hoverItem && <ItemTooltip item={hoverItem} rect={hoverRect} />}
            
            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200 mb-4 pb-1">
                Equipment
            </h3>

            {/* Paper Doll Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {config.slots.filter(s => checkPrerequisites(s.prerequisites)).map(slot => {
                    const equippedItemId = state.equipment[slot.id];
                    const equippedItem = equippedItemId ? ITEMS.find(i => i.id === equippedItemId) : null;

                    return (
                        <div 
                            key={slot.id} 
                            className="border border-gray-300 rounded p-2 bg-gray-50 flex flex-col justify-between h-24 relative group"
                            onMouseEnter={(e) => equippedItem && handleMouseEnter(e, equippedItem)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{slot.name}</span>
                            
                            {equippedItem ? (
                                <>
                                    <div className="text-sm font-semibold text-gray-800 leading-tight">
                                        {equippedItem.name}
                                    </div>
                                    <button 
                                        onClick={() => unequipItem(slot.id)}
                                        className="text-[10px] text-red-500 hover:text-red-700 hover:underline self-end mt-1 z-10 relative"
                                    >
                                        Unequip
                                    </button>
                                </>
                            ) : (
                                <div className="text-xs text-gray-400 italic text-center my-auto">
                                    Empty
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200 mb-4 pb-1">
                Inventory
            </h3>

            {state.inventory.length === 0 ? (
                <div className="text-gray-400 italic text-sm text-center py-4">Your bag is empty.</div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {state.inventory.map((itemId, idx) => {
                        const item = ITEMS.find(i => i.id === itemId);
                        if (!item) return null;
                        
                        return (
                             <div 
                                key={`${itemId}-${idx}`} 
                                className="border border-gray-200 p-2 rounded bg-white hover:border-blue-400 cursor-pointer hover:shadow-sm" 
                                onClick={() => equipItem(itemId)}
                                onMouseEnter={(e) => handleMouseEnter(e, item)}
                                onMouseLeave={handleMouseLeave}
                             >
                                 <div className="font-semibold text-sm">{item.name}</div>
                                 <div className="text-[10px] text-blue-600 font-mono mt-1">
                                     {SLOTS.find(s=>s.id === item.slot)?.name}
                                 </div>
                             </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};