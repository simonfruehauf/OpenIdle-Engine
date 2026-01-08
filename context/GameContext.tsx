import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { ACTIONS, CATEGORIES, RESOURCES, TASKS, SLOTS, ITEMS, CONVERTERS } from "../gameData/index";
import { ActionConfig, GameContextType, GameState, Modifier, TaskConfig, ResourceID, Cost, ActionID, TaskID, Prerequisite, SlotID, ItemID, ItemConfig, SlotConfig, CategoryConfig, TaskState, Effect, ConverterID, ConverterConfig } from "../types";

// --- Helper: Encoding for Unicode Support (Emojis) ---
function utf8_to_b64(str: string) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str: string) {
    return decodeURIComponent(escape(window.atob(str)));
}

// --- Helper: Get All Active Modifiers (Permanent + Equipment) ---
const getActiveModifiers = (state: GameState): Modifier[] => {
    const mods = [...state.modifiers];

    // Add modifiers from equipped items
    Object.values(state.equipment).forEach(itemId => {
        const item = ITEMS.find(i => i.id === itemId);
        if (item) {
            item.effects.forEach(e => {
                if (e.type === 'modify_max_resource_flat' && e.resourceId) {
                    mods.push({ sourceId: item.name, type: 'flat', value: e.amount, resourceId: e.resourceId, property: 'max' });
                } else if (e.type === 'modify_max_resource_pct' && e.resourceId) {
                    mods.push({ sourceId: item.name, type: 'percent', value: e.amount, resourceId: e.resourceId, property: 'max' });
                } else if (e.type === 'modify_yield_pct') {
                    if (e.taskId) mods.push({ sourceId: item.name, type: 'percent', value: e.amount, taskId: e.taskId, property: 'yield', resourceId: e.resourceId });
                    else if (e.actionId) mods.push({ sourceId: item.name, type: 'percent', value: e.amount, actionId: e.actionId, property: 'yield', resourceId: e.resourceId });
                    else if (e.resourceId) mods.push({ sourceId: item.name, type: 'percent', value: e.amount, resourceId: e.resourceId, property: 'yield' });
                } else if (e.type === 'modify_yield_flat') {
                    if (e.taskId) mods.push({ sourceId: item.name, type: 'flat', value: e.amount, taskId: e.taskId, property: 'yield', resourceId: e.resourceId });
                    else if (e.actionId) mods.push({ sourceId: item.name, type: 'flat', value: e.amount, actionId: e.actionId, property: 'yield', resourceId: e.resourceId });
                    else if (e.resourceId) mods.push({ sourceId: item.name, type: 'flat', value: e.amount, resourceId: e.resourceId, property: 'yield' });
                } else if (e.type === 'modify_passive_gen' && e.resourceId) {
                    mods.push({ sourceId: item.name, type: 'flat', value: e.amount, resourceId: e.resourceId, property: 'gen' });
                }
            });
        }
    });

    return mods;
};

// --- Helper: Dynamic Max Calculation ---
const calculateMax = (resId: ResourceID, modifiers: Modifier[], baseMax: number): number => {
    // 0. Check for 'set' Modifiers
    const sets = modifiers
        .filter(m => m.resourceId === resId && m.type === 'set' && (!m.property || m.property === 'max'))
        .map(m => m.value);

    // If set modifiers exist, take the MAXIMUM set value as the new base
    // This allows "Set Max to 100" and "Set Max to 500" to coexist, resulting in 500.
    const startingBase = sets.length > 0 ? Math.max(...sets) : baseMax;

    // 1. Sum Flat Bonuses (Explicitly check property is 'max' or undefined for legacy)
    const flats = modifiers
        .filter(m => m.resourceId === resId && m.type === 'flat' && (!m.property || m.property === 'max'))
        .reduce((sum, m) => sum + m.value, 0);

    // 2. Sum Percent Bonuses (Additive)
    const percents = modifiers
        .filter(m => m.resourceId === resId && m.type === 'percent' && (!m.property || m.property === 'max'))
        .reduce((sum, m) => sum + m.value, 0);

    return Math.floor((startingBase + flats) * (1 + percents));
};

// --- Helper: Universal Yield Calculation ---
const calculateYield = (baseAmount: number, sourceId: string, sourceType: 'task' | 'action', resourceId: string, modifiers: Modifier[]): number => {
    // 1. Calculate Flat Bonuses
    const flats = modifiers.filter(m => {
        if (m.property !== 'yield' || m.type !== 'flat') return false;
        // Check Source Match - Global modifiers (no taskId/actionId) apply to ALL sources
        const isGlobalModifier = !m.taskId && !m.actionId;
        if (!isGlobalModifier) {
            if (sourceType === 'task' && m.taskId !== sourceId) return false;
            if (sourceType === 'action' && m.actionId !== sourceId) return false;
        }
        // Check Resource Match (Specific or Generic - if no resourceId on modifier, it applies to all resources)
        if (m.resourceId && m.resourceId !== resourceId) return false;
        return true;
    }).reduce((sum, m) => sum + m.value, 0);

    // 2. Calculate Percent Bonuses
    const percents = modifiers.filter(m => {
        if (m.property !== 'yield' || m.type !== 'percent') return false;
        // Check Source Match - Global modifiers (no taskId/actionId) apply to ALL sources
        const isGlobalModifier = !m.taskId && !m.actionId;
        if (!isGlobalModifier) {
            if (sourceType === 'task' && m.taskId !== sourceId) return false;
            if (sourceType === 'action' && m.actionId !== sourceId) return false;
        }
        // Check Resource Match (Specific or Generic)
        if (m.resourceId && m.resourceId !== resourceId) return false;
        return true;
    }).reduce((sum, m) => sum + m.value, 0);

    return (baseAmount + flats) * (1 + percents);
};


// --- Initial State ---
const createInitialState = (): GameState => {
    const resources: GameState["resources"] = {};
    RESOURCES.forEach((r) => {
        resources[r.id] = {
            current: r.initialAmount || 0,
            unlocked: true,
        };
    });

    const actionsState: GameState["actions"] = {};
    ACTIONS.forEach(a => {
        const startUnlocked = !a.prerequisites || a.prerequisites.length === 0;
        actionsState[a.id] = { executions: 0, unlocked: startUnlocked };
    });

    const tasksState: GameState["tasks"] = {};
    TASKS.forEach(t => {
        const startUnlocked = !t.prerequisites || t.prerequisites.length === 0;
        tasksState[t.id] = { active: false, level: 1, xp: 0, unlocked: startUnlocked, progress: 0, completions: 0, paid: false };
    });

    const convertersState: GameState["converters"] = {};
    CONVERTERS.forEach(c => {
        const startUnlocked = !c.prerequisites || c.prerequisites.length === 0;
        convertersState[c.id] = { owned: false, active: false, unlocked: startUnlocked };
    });

    return {
        resources,
        actions: actionsState,
        tasks: tasksState,
        converters: convertersState,
        inventory: [],
        equipment: {},
        modifiers: [],
        log: ["Welcome. Manage your tasks and resources."],
        totalTimePlayed: 0,
        activeTaskIds: [],
        maxConcurrentTasks: 1,
        restTaskId: null,
        previousTaskId: null
    };
};

// --- Reducer ---
type Action =
    | { type: "TICK"; dt: number }
    | { type: "TRIGGER_ACTION"; actionId: string }
    | { type: "TOGGLE_TASK"; taskId: string }
    | { type: "EQUIP_ITEM"; itemId: string }
    | { type: "UNEQUIP_ITEM"; slotId: string }
    | { type: "BUY_CONVERTER"; converterId: string }
    | { type: "TOGGLE_CONVERTER"; converterId: string }
    | { type: "ADD_LOG"; msg: string }
    | { type: "LOAD_GAME"; state: GameState }
    | { type: "RESET_GAME" }
    | { type: "SET_REST_TASK"; taskId: string | null };

// --- Helper: Clone Resources to prevent mutation ---
const cloneResources = (resources: GameState["resources"]) => {
    const clone: GameState["resources"] = {};
    Object.keys(resources).forEach(k => {
        clone[k] = { ...resources[k] };
    });
    return clone;
};

const gameReducer = (state: GameState, action: Action): GameState => {
    // Always calculate modifiers first for calculations within actions
    const allModifiers = getActiveModifiers(state);

    // Helper function for calculating scaled costs
    const getScaledCost = (
        costConfig: Cost,
        currentExecutions: number, // For actions
        currentLevel: number,      // For tasks (default)
        currentCompletions: number // For tasks (if scalesByCompletion)
    ): number => {
        if (!costConfig.scaleFactor) return costConfig.amount; // No scaling if no scaleFactor

        let exponent: number;
        // Determine exponent based on context (Action vs Task) and scalesByCompletion flag
        // If it's a task cost and scalesByCompletion is true, use completions
        if (costConfig.scalesByCompletion) {
            exponent = currentCompletions;
        } else if (costConfig.resourceId) { // Assume it's a task cost based on resourceId if no scalesByCompletion
            exponent = currentLevel - 1; // Default task scaling
        } else { // Assume it's an action cost
            exponent = currentExecutions;
        }

        switch (costConfig.scaleType) {
            case 'fixed':
                // Linear additive growth: amount + (scaleFactor * exponent)
                return costConfig.amount + (costConfig.scaleFactor * exponent);
            case 'percentage':
                // Linear percentage growth: amount * (1 + scaleFactor * exponent)
                return costConfig.amount * (1 + costConfig.scaleFactor * exponent);
            case 'exponential':
            default:
                // Exponential growth: amount * (scaleFactor ^ exponent)
                return costConfig.amount * Math.pow(costConfig.scaleFactor, exponent);
        }
    };

    switch (action.type) {
        case "LOAD_GAME": {
            // Safe Merge: Merge loaded state with default state to ensure missing fields (schema updates) are filled
            const defaults = createInitialState();
            return {
                ...defaults,
                ...action.state,
                resources: { ...defaults.resources, ...(action.state.resources || {}) },
                actions: { ...defaults.actions, ...(action.state.actions || {}) },
                tasks: { ...defaults.tasks, ...(action.state.tasks || {}) },
                converters: { ...defaults.converters, ...(action.state.converters || {}) },
                inventory: action.state.inventory || defaults.inventory,
                equipment: action.state.equipment || defaults.equipment,
                modifiers: action.state.modifiers || defaults.modifiers,
                log: action.state.log || defaults.log,
                maxConcurrentTasks: action.state.maxConcurrentTasks || defaults.maxConcurrentTasks,
                activeTaskIds: action.state.activeTaskIds || defaults.activeTaskIds,
                restTaskId: action.state.restTaskId || defaults.restTaskId,
                previousTaskId: action.state.previousTaskId || defaults.previousTaskId
            };
        }

        case "RESET_GAME":
            return createInitialState();

        case "ADD_LOG":
            return { ...state, log: [action.msg, ...state.log].slice(0, 50) };

        case "SET_REST_TASK":
            return { ...state, restTaskId: action.taskId };

        case "EQUIP_ITEM": {
            const item = ITEMS.find(i => i.id === action.itemId);
            if (!item) return state;

            const currentEquipped = state.equipment[item.slot];
            let newInventory = state.inventory.filter(id => id !== action.itemId);

            // If something is already equipped, swap it back to inventory
            if (currentEquipped) {
                newInventory.push(currentEquipped);
            }

            return {
                ...state,
                inventory: newInventory,
                equipment: { ...state.equipment, [item.slot]: action.itemId },
                log: [`Equipped ${item.name}`, ...state.log].slice(0, 50)
            };
        }

        case "UNEQUIP_ITEM": {
            const itemId = state.equipment[action.slotId];
            if (!itemId) return state;

            const newEquipment = { ...state.equipment };
            delete newEquipment[action.slotId];

            return {
                ...state,
                inventory: [...state.inventory, itemId],
                equipment: newEquipment,
                log: [`Unequipped ${ITEMS.find(i => i.id === itemId)?.name}`, ...state.log].slice(0, 50)
            };
        }

        case "BUY_CONVERTER": {
            const config = CONVERTERS.find(c => c.id === action.converterId);
            if (!config) return state;

            const converterState = state.converters[action.converterId];
            if (converterState.owned) {
                return { ...state, log: [`Already own ${config.name}`, ...state.log].slice(0, 20) };
            }

            // Check if can afford
            const canAfford = config.cost.every(c =>
                (state.resources[c.resourceId]?.current || 0) >= c.amount
            );
            if (!canAfford) {
                return { ...state, log: [`Cannot afford ${config.name}`, ...state.log].slice(0, 20) };
            }

            // Pay costs
            const newResources = cloneResources(state.resources);
            config.cost.forEach(c => {
                newResources[c.resourceId].current -= c.amount;
            });

            // Set owned and active (if not toggleable, auto-activate)
            const newConverters = {
                ...state.converters,
                [action.converterId]: {
                    ...converterState,
                    owned: true,
                    active: !config.canBeToggled // Auto-activate if can't be toggled
                }
            };

            return {
                ...state,
                resources: newResources,
                converters: newConverters,
                log: [`Purchased ${config.name}`, ...state.log].slice(0, 20)
            };
        }

        case "TOGGLE_CONVERTER": {
            const config = CONVERTERS.find(c => c.id === action.converterId);
            if (!config) return state;

            const converterState = state.converters[action.converterId];
            if (!converterState.owned) {
                return { ...state, log: [`Don't own ${config.name}`, ...state.log].slice(0, 20) };
            }

            if (!config.canBeToggled) {
                return { ...state, log: [`${config.name} cannot be toggled`, ...state.log].slice(0, 20) };
            }

            const newConverters = {
                ...state.converters,
                [action.converterId]: {
                    ...converterState,
                    active: !converterState.active
                }
            };

            return {
                ...state,
                converters: newConverters,
                log: [`${config.name} ${!converterState.active ? 'activated' : 'deactivated'}`, ...state.log].slice(0, 20)
            };
        }

        case "TRIGGER_ACTION": {
            const config = ACTIONS.find(a => a.id === action.actionId);
            if (!config) return state;

            const actionState = state.actions[action.actionId];

            if (config.maxExecutions && actionState.executions >= config.maxExecutions) {
                return { ...state, log: [`${config.name} limit reached.`, ...state.log].slice(0, 20) };
            }

            const canAfford = config.costs.every(c => {
                const costAmount = getScaledCost(c, actionState.executions, 0, 0);
                return (state.resources[c.resourceId]?.current || 0) >= costAmount;
            });
            if (!canAfford) {
                return { ...state, log: [`Not enough resources for ${config.name}`, ...state.log].slice(0, 20) };
            }

            // Pay Costs
            const newResources = cloneResources(state.resources);
            config.costs.forEach(c => {
                const costAmount = getScaledCost(c, actionState.executions, 0, 0);
                newResources[c.resourceId].current -= costAmount;
            });

            // Apply Effects
            let newModifiers = [...state.modifiers];
            let newInventory = [...state.inventory];
            let newMaxTasks = state.maxConcurrentTasks;

            // Helper function to apply a single effect
            const applyEffect = (e: Effect) => {
                // Check Probability
                if (e.chance !== undefined && Math.random() > e.chance) return;

                if (e.type === 'add_resource' && e.resourceId) {
                    const current = newResources[e.resourceId].current;
                    const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                    const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);
                    newResources[e.resourceId].current = Math.min(current + e.amount, max);
                } else if (e.type === 'modify_max_resource_flat' && e.resourceId) {
                    newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'max' });
                } else if (e.type === 'modify_max_resource_pct' && e.resourceId) {
                    newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'percent', value: e.amount, property: 'max' });
                } else if (e.type === 'modify_passive_gen' && e.resourceId) {
                    newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'gen' });
                } else if (e.type === 'modify_yield_pct') {
                    if (e.taskId) newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    if (e.actionId) newModifiers.push({ sourceId: config.name, actionId: e.actionId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                } else if (e.type === 'modify_yield_flat') {
                    if (e.taskId) newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    if (e.actionId) newModifiers.push({ sourceId: config.name, actionId: e.actionId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                } else if (e.type === 'add_item' && e.itemId) {
                    for (let i = 0; i < e.amount; i++) {
                        newInventory.push(e.itemId);
                    }
                } else if (e.type === 'increase_max_tasks') {
                    newMaxTasks += e.amount;
                } else if (e.type === 'increase_max_executions') {
                    // Increase max executions for a task or action
                    if (e.taskId) {
                        newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'flat', value: e.amount, property: 'max_exec' });
                    } else if (e.actionId) {
                        newModifiers.push({ sourceId: config.name, actionId: e.actionId, type: 'flat', value: e.amount, property: 'max_exec' });
                    }
                }
            };

            // NOTE: applyEffect is kept for reference but replaced by applyEffectWithYield below
            // which correctly handles yield calculations for resource effects

            // NOTE: We need to update resource adding to use calculateYield
            // Redefining applyEffect to handle 'add_resource' correctly with yield
            const applyEffectWithYield = (e: Effect) => {
                // Check Probability
                if (e.chance !== undefined && Math.random() > e.chance) return;

                if (e.type === 'add_resource' && e.resourceId) {
                    const current = newResources[e.resourceId].current;
                    const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                    const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);

                    // Use calculateYield
                    const finalAmount = calculateYield(e.amount, config.id, 'action', e.resourceId, allModifiers);

                    newResources[e.resourceId].current = Math.min(current + finalAmount, max);
                } else {
                    // Delegate to standard handler for non-resource effects (or duplicate logic)
                    // Since I'm replacing the block, I'll just include the rest of logic here.
                    if (e.type === 'modify_max_resource_flat' && e.resourceId) {
                        newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'max' });
                    } else if (e.type === 'modify_max_resource_pct' && e.resourceId) {
                        newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'percent', value: e.amount, property: 'max' });
                    } else if (e.type === 'set_max_resource' && e.resourceId) {
                        newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'set', value: e.amount, property: 'max' });
                    } else if (e.type === 'reset_resource_modifiers' && e.resourceId) {
                        newModifiers = newModifiers.filter(m => m.resourceId !== e.resourceId);
                    } else if (e.type === 'modify_passive_gen' && e.resourceId) {
                        newModifiers.push({ sourceId: config.name, resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'gen' });
                    } else if (e.type === 'modify_yield_pct') {
                        if (e.taskId) newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                        if (e.actionId) newModifiers.push({ sourceId: config.name, actionId: e.actionId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    } else if (e.type === 'modify_yield_flat') {
                        if (e.taskId) newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                        if (e.actionId) newModifiers.push({ sourceId: config.name, actionId: e.actionId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    } else if (e.type === 'add_item' && e.itemId) {
                        for (let i = 0; i < e.amount; i++) {
                            newInventory.push(e.itemId);
                        }
                    } else if (e.type === 'increase_max_tasks') {
                        newMaxTasks += e.amount;
                    } else if (e.type === 'increase_max_executions') {
                        if (e.taskId) {
                            newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'flat', value: e.amount, property: 'max_exec' });
                        } else if (e.actionId) {
                            newModifiers.push({ sourceId: config.name, actionId: e.actionId, type: 'flat', value: e.amount, property: 'max_exec' });
                        }
                    }
                }
            };

            // Apply Effects
            config.effects.forEach(applyEffectWithYield);

            // First Completion Effects
            if (actionState.executions === 0 && config.firstCompletionEffects) {
                config.firstCompletionEffects.forEach(applyEffectWithYield);
            }

            const newActions = {
                ...state.actions,
                [action.actionId]: { ...actionState, executions: actionState.executions + 1, lastUsed: Date.now() }
            };

            const logMsg = config.logMessage || `Used ${config.name}`;

            return {
                ...state,
                resources: newResources,
                actions: newActions,
                modifiers: newModifiers,
                inventory: newInventory,
                log: [logMsg, ...state.log].slice(0, 20),
                maxConcurrentTasks: newMaxTasks
            };
        }

        case "TOGGLE_TASK": {
            const tState = state.tasks[action.taskId];
            const config = TASKS.find(t => t.id === action.taskId);
            if (!config) return state;

            // Check maxExecutions limit
            if (config.maxExecutions && (tState.completions || 0) >= config.maxExecutions) {
                return { ...state, log: [`${config.name} limit reached.`, ...state.log].slice(0, 20) };
            }

            const nowActive = !tState.active;
            const newResources = cloneResources(state.resources);
            let newPaid = tState.paid;

            // Prepare new state objects early
            const newTasks = { ...state.tasks };
            let newActiveTaskIds = [...state.activeTaskIds];
            let logUpdates = [...state.log];

            // Check Max Concurrent Tasks (and auto-cancel oldest if needed)
            if (nowActive) {
                if (newActiveTaskIds.length >= state.maxConcurrentTasks) {
                    const oldestId = newActiveTaskIds.shift(); // Remove oldest
                    if (oldestId) {
                        newTasks[oldestId] = { ...newTasks[oldestId], active: false };
                        const oldName = TASKS.find(t => t.id === oldestId)?.name || oldestId;
                        logUpdates.unshift(`Stopped ${oldName} to focus on ${config.name}.`);
                    }
                }
            }

            // Check Upkeep (If starting) to prevent instant-stop
            if (nowActive) {
                // We require at least enough to survive one tick (or just > 0)
                const canMaintain = config.costPerSecond.every(c =>
                    (state.resources[c.resourceId]?.current || 0) > 0
                );

                if (!canMaintain) {
                    return { ...state, log: [`Cannot start ${config.name}: Insufficient resources for upkeep.`, ...state.log].slice(0, 20) };
                }
            }

            // Check Start Costs (Only if not already paid)
            if (nowActive && config.startCosts && !tState.paid) {
                const canAfford = config.startCosts.every(c => {
                    const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                    return (state.resources[c.resourceId]?.current || 0) >= costAmount;
                });
                if (!canAfford) {
                    return { ...state, log: [`Cannot afford start costs for ${config.name}`, ...state.log].slice(0, 20) };
                }
                // Deduct start costs
                config.startCosts.forEach(c => {
                    const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                    newResources[c.resourceId].current -= costAmount;
                });
                newPaid = true;
            }

            // Apply change to target task
            newTasks[action.taskId] = { ...tState, active: nowActive, paid: newPaid };

            // Update activeTaskIds
            if (nowActive) {
                newActiveTaskIds.push(action.taskId);
            } else {
                newActiveTaskIds = newActiveTaskIds.filter(id => id !== action.taskId);
            }

            return { ...state, tasks: newTasks, resources: newResources, activeTaskIds: newActiveTaskIds, log: logUpdates.slice(0, 20) };
        }

        case "TICK": {
            const dtSeconds = action.dt / 1000;
            const newResources = cloneResources(state.resources);
            const newTasks = { ...state.tasks };
            let newInventory = [...state.inventory];
            let newModifiers = [...state.modifiers];
            let logUpdates = [...state.log];
            let newActions = state.actions;
            let actionsChanged = false;
            let newMaxTasks = state.maxConcurrentTasks;
            let newRestTaskId = state.restTaskId;
            let newPreviousTaskId = state.previousTaskId;
            let newActiveTaskIds = [...state.activeTaskIds]; // Use mutable copy for logic, update state at end

            // Helper for calculating max within tick
            const getTickMax = (rid: string) => {
                const r = RESOURCES.find(x => x.id === rid);
                return r ? calculateMax(rid, allModifiers, r.baseMax) : 0;
            };

            // Helper to apply effects (Shared logic for completion/first-completion)
            const applyTaskEffect = (e: Effect, level: number, taskId: string) => {
                if (e.chance !== undefined && Math.random() > e.chance) return;

                if (e.type === 'add_resource' && e.resourceId) {
                    let amount = e.amount;
                    if (e.scaleFactor) {
                        const exponent = level - 1;
                        switch (e.scaleType) {
                            case 'fixed':
                                amount = e.amount + (e.scaleFactor * exponent);
                                break;
                            case 'percentage':
                                amount = e.amount * (1 + e.scaleFactor * exponent);
                                break;
                            case 'exponential':
                            default:
                                amount = e.amount * Math.pow(e.scaleFactor, exponent);
                                break;
                        }
                    }

                    // Apply Yield Calculation
                    amount = calculateYield(amount, taskId, 'task', e.resourceId, allModifiers);

                    const current = newResources[e.resourceId].current;
                    const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                    const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);
                    newResources[e.resourceId].current = Math.min(current + amount, max);
                } else if (e.type === 'modify_max_resource_flat' && e.resourceId) {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'max' });
                } else if (e.type === 'modify_max_resource_pct' && e.resourceId) {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'percent', value: e.amount, property: 'max' });
                } else if (e.type === 'set_max_resource' && e.resourceId) {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'set', value: e.amount, property: 'max' });
                } else if (e.type === 'reset_resource_modifiers' && e.resourceId) {
                    newModifiers = newModifiers.filter(m => m.resourceId !== e.resourceId);
                } else if (e.type === 'modify_passive_gen' && e.resourceId) {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'gen' });
                } else if (e.type === 'modify_yield_pct') {
                    if (e.taskId) newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", taskId: e.taskId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    if (e.actionId) newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", actionId: e.actionId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                } else if (e.type === 'modify_yield_flat') {
                    if (e.taskId) newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", taskId: e.taskId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    if (e.actionId) newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", actionId: e.actionId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                } else if (e.type === 'add_item' && e.itemId) {
                    newInventory.push(e.itemId);
                    logUpdates.unshift(`Obtained: ${ITEMS.find(i => i.id === e.itemId)?.name}`);
                } else if (e.type === 'increase_max_tasks') {
                    newMaxTasks += e.amount;
                }
            };

            // 1. Process Active Tasks
            // Use activeTaskIds to iterate instead of Object.keys for better control and order
            [...newActiveTaskIds].forEach((tid) => {
                let tState = newTasks[tid]; // Get latest reference (potentially updated by other logic?)


                if (!tState.active) return;

                const config = TASKS.find(t => t.id === tid);
                if (!config) return;

                // Check Start Costs (If not paid, e.g. auto-restart)
                if (!tState.paid && config.startCosts) {
                    const canAffordStart = config.startCosts.every(c => {
                        const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                        return (newResources[c.resourceId]?.current || 0) >= costAmount;
                    });

                    if (!canAffordStart) {
                        newTasks[tid] = { ...tState, active: false };
                        logUpdates.unshift(`${config.name} stopped (cannot afford restart cost).`);
                        return;
                    }

                    // Pay Start Costs
                    config.startCosts.forEach(c => {
                        const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                        newResources[c.resourceId].current -= costAmount;
                    });
                    newTasks[tid] = { ...tState, paid: true };
                    tState = newTasks[tid]; // Update local reference
                } else if (tid === 'fester' && config.startCosts) {
                }

                // Check Costs (Continuous)
                const canAfford = config.costPerSecond.every(c => {
                    const scaledAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                    return (newResources[c.resourceId]?.current || 0) >= (scaledAmount * dtSeconds);
                });

                if (!canAfford) {
                    newTasks[tid] = { ...tState, active: false };
                    newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);
                    logUpdates.unshift(`${config.name} stopped (insufficient resources)`);

                    // AUTO REST LOGIC
                    if (newRestTaskId && newRestTaskId !== tid) {
                        // Activate Rest Task
                        const restTaskConfig = TASKS.find(t => t.id === newRestTaskId);
                        if (restTaskConfig) {
                            newPreviousTaskId = tid; // Remember what we were doing

                            // Start Rest Task
                            // Ensure we don't duplicate if already active (e.g. multitasking)
                            if (!newTasks[newRestTaskId].active) {
                                newTasks[newRestTaskId] = { ...newTasks[newRestTaskId], active: true, paid: false };
                                newActiveTaskIds.push(newRestTaskId);
                                logUpdates.unshift(`Auto-switched to ${restTaskConfig.name} to recover.`);
                            }
                        }
                    }

                    return;
                }

                // Deduct Costs
                config.costPerSecond.forEach(c => {
                    const scaledAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                    newResources[c.resourceId].current -= (scaledAmount * dtSeconds);
                });

                // AUTO REST RETURN LOGIC
                if (tid === newRestTaskId && newPreviousTaskId) {
                    const prevConfig = TASKS.find(t => t.id === newPreviousTaskId);
                    if (prevConfig) {
                        // Check if ALL resources required by previous task are MAXED
                        const allMaxed = prevConfig.costPerSecond.every(c => {
                            const rState = newResources[c.resourceId];
                            const rConfig = RESOURCES.find(r => r.id === c.resourceId);
                            if (!rState || !rConfig) return true; // Should not happen
                            const max = calculateMax(c.resourceId, allModifiers, rConfig.baseMax);
                            // Use small epsilon or just check >= max
                            return rState.current >= max - 0.01;
                        });

                        if (allMaxed) {
                            // Switch Back!
                            newTasks[tid] = { ...tState, active: false };
                            newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);

                            // Start Previous Task
                            const prevTaskState = newTasks[newPreviousTaskId];
                            newTasks[newPreviousTaskId] = { ...prevTaskState, active: true, paid: false };
                            newActiveTaskIds.push(newPreviousTaskId);

                            logUpdates.unshift(`Resources recovered. Returning to ${prevConfig.name}.`);

                            newPreviousTaskId = null; // Clear memory
                            return; // Stop processing rest task for this tick
                        }
                    }
                }

                // Timed/Progress Logic
                if (config.progressRequired) {
                    const oldProgress = tState.progress || 0;
                    const newProgress = oldProgress + dtSeconds;

                    // IMMUTABLE UPDATE
                    newTasks[tid] = { ...tState, progress: newProgress };
                    tState = newTasks[tid]; // Update local reference



                    // Use epsilon for float comparison
                    if (newProgress >= config.progressRequired - 0.0001) {
                        // --- TASK COMPLETED ---
                        tState.progress = 0;

                        const completions = tState.completions || 0;
                        tState.completions = completions + 1;

                        if (!config.autoRestart) {
                            tState.active = false;
                            newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);
                            logUpdates.unshift(`${config.name} completed.`);
                        }

                        // 1. Completion Effects (Standard)
                        if (config.completionEffects) {
                            config.completionEffects.forEach(e => {
                                applyTaskEffect(e, tState.level, tid);
                            });
                        }

                        // 2. First Time Effects
                        if (completions === 0 && config.firstCompletionEffects) {
                            config.firstCompletionEffects.forEach(e => applyTaskEffect(e, tState.level, tid));
                        }

                        // Reset Paid Status for next run
                        newTasks[tid] = { ...tState, progress: 0, paid: false };
                        tState = newTasks[tid];

                        // Check maxExecutions limit
                        if (config.maxExecutions && tState.completions >= config.maxExecutions) {
                            tState.active = false;
                            newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);
                            logUpdates.unshift(`${config.name} max completions reached.`);
                            return;
                        }

                        if (!config.autoRestart) {
                            return; // Task stops, no per-second effects for this tick if stopped
                        }
                    }
                }

                // Continuous Effects (Loop Tasks)
                config.effectsPerSecond.forEach(e => {
                    // Chance check for ticks
                    if (e.chance !== undefined) {
                        // Probability per second: chance * dt
                        // To make it frame independent for small dt:
                        // Random < chance * dtSeconds
                        if (Math.random() > (e.chance * dtSeconds)) return;
                        // If triggered, grant FULL amount (discrete event)
                        if (e.type === 'add_resource' && e.resourceId) {
                            const current = newResources[e.resourceId].current;
                            const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                            const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);
                            newResources[e.resourceId].current = Math.min(current + e.amount, max);
                        }
                    } else {
                        // Streamed effects
                        if (e.type === 'add_resource' && e.resourceId) {
                            let amount = e.amount;
                            if (e.scaleFactor) {
                                const exponent = tState.level - 1;
                                switch (e.scaleType) {
                                    case 'fixed':
                                        amount = e.amount + (e.scaleFactor * exponent);
                                        break;
                                    case 'percentage':
                                        amount = e.amount * (1 + e.scaleFactor * exponent);
                                        break;
                                    case 'exponential':
                                    default:
                                        amount = e.amount * Math.pow(e.scaleFactor, exponent);
                                        break;
                                }
                            }
                            amount = amount * dtSeconds;

                            // Apply Per-Second Yield
                            // NOTE: Flat yield usually means "per completion" or "per chunk".
                            // For continuous streamed effects, flat yield per second might be powerful.
                            // We will scale flat yield by dtSeconds as well to keep it consistent with "per second" definition.

                            // To use calculateYield, we first calculate base per second, then apply yield.
                            // But calculateYield adds FLATS directly.
                            // If I have +1 Flat Yield, does it mean +1 per second? Yes.
                            // So (Base + Flat) * Percent * dtSeconds?
                            // OR (Base * dt) + (Flat * dt)? -> (Base + Flat) * dt
                            // calculateYield does (Base + Flat) * Mul.
                            // So we should pass "amount per second" to calculateYield?
                            // If Base is 0.1/sec, Flat is 1.0 (meaning +1/sec).
                            // calculateYield(0.1, ...) -> returns 1.1.
                            // Then multiply by dtSeconds -> 1.1 * dt. Correct.

                            amount = calculateYield(amount / dtSeconds, tid, 'task', e.resourceId, allModifiers) * dtSeconds;

                            const current = newResources[e.resourceId].current;
                            const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                            const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);

                            newResources[e.resourceId].current = Math.min(current + amount, max);
                        }
                    }
                });

                // Handle Drops
                if (config.drops) {
                    config.drops.forEach(drop => {
                        if (Math.random() < drop.chancePerSecond * dtSeconds) {
                            newInventory.push(drop.itemId);
                            const itemName = ITEMS.find(i => i.id === drop.itemId)?.name || drop.itemId;
                            logUpdates.unshift(`Found item: ${itemName}!`);
                        }
                    });
                }

                // Add XP
                if (config.xpPerSecond) {
                    tState.xp += config.xpPerSecond * dtSeconds;
                    const xpNeeded = tState.level * 100;
                    if (tState.xp >= xpNeeded) {
                        tState.level++;
                        tState.xp -= xpNeeded;
                        logUpdates.unshift(`${config.name} leveled up to ${tState.level}!`);
                    }
                }
            });

            // 2. Process Passive Conversion (Resources generating other resources)
            RESOURCES.forEach(sourceConfig => {
                if (!sourceConfig.passiveGen) return;
                const sourceAmount = newResources[sourceConfig.id]?.current || 0;
                if (sourceAmount < 1) return; // Must have at least 1 full unit

                sourceConfig.passiveGen.forEach(gen => {
                    if (!newResources[gen.targetResourceId]) return;

                    // Only generate based on FULL amount
                    const delta = Math.floor(sourceAmount) * gen.ratePerUnit * dtSeconds;
                    const targetConfig = RESOURCES.find(r => r.id === gen.targetResourceId);

                    if (targetConfig) {
                        const max = calculateMax(gen.targetResourceId, allModifiers, targetConfig.baseMax ?? 0);
                        const currentTarget = newResources[gen.targetResourceId].current;
                        newResources[gen.targetResourceId].current = Math.min(currentTarget + delta, max);
                    }

                });
            });



            // 3. Process Modifier-based Passive Generation
            allModifiers.forEach(m => {
                if (m.resourceId && m.property === 'gen' && m.type === 'flat') {
                    const rConfig = RESOURCES.find(r => r.id === m.resourceId);
                    if (rConfig) {
                        const current = newResources[m.resourceId]?.current || 0;
                        const max = calculateMax(m.resourceId, allModifiers, rConfig.baseMax ?? 0);
                        const delta = m.value * dtSeconds;
                        newResources[m.resourceId].current = Math.min(current + delta, max);
                    }
                }
            });

            // 4. Process Active Converters
            let newConverters = { ...state.converters };
            let convertersChanged = false;

            Object.keys(newConverters).forEach(cid => {
                const cState = newConverters[cid];
                if (!cState.owned || !cState.active) return;

                const config = CONVERTERS.find(c => c.id === cid);
                if (!config) return;

                // Check if can afford per-second costs
                const canAfford = config.costPerSecond.every(c => {
                    const available = newResources[c.resourceId]?.current || 0;
                    const needed = c.amount * dtSeconds;
                    return available >= needed;
                });

                // Just skip if can't afford - don't deactivate
                if (!canAfford) {
                    return;
                }

                // Deduct costs
                config.costPerSecond.forEach(c => {
                    newResources[c.resourceId].current -= (c.amount * dtSeconds);
                });

                // Apply effects
                config.effectsPerSecond.forEach(e => {
                    if (e.type === 'add_resource' && e.resourceId) {
                        const current = newResources[e.resourceId].current;
                        const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                        const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);
                        newResources[e.resourceId].current = Math.min(current + (e.amount * dtSeconds), max);
                    }
                });
            });

            // Cap resources at 0 and enforce max limits
            Object.keys(newResources).forEach(rid => {
                if (newResources[rid].current < 0) newResources[rid].current = 0;

                // If max is 0, set current to 0 as well
                const rConfig = RESOURCES.find(r => r.id === rid);
                if (rConfig) {
                    const max = calculateMax(rid, allModifiers, rConfig.baseMax);
                    if (max <= 0) {
                        newResources[rid].current = 0;
                    } else if (newResources[rid].current > max) {
                        newResources[rid].current = max;
                    }
                }
            });

            // --- 4. Process Unlocks (Latch Mechanism) ---

            const checkPrereqsInternal = (pList?: Prerequisite[]) => {
                if (!pList || pList.length === 0) return true;
                return pList.every(p => {
                    if (p.resourceId) {
                        const res = newResources[p.resourceId];
                        if (!res) return false;
                        if (p.minAmount !== undefined && res.current < p.minAmount) return false;
                        if (p.maxAmount !== undefined && res.current > p.maxAmount) return false;
                        if (p.minMax !== undefined) {
                            const max = getTickMax(p.resourceId);
                            if (max < p.minMax) return false;
                        }
                    }
                    if (p.actionId) {
                        const act = newActions[p.actionId];
                        const minExec = p.minExecutions || 1;
                        if (!act || act.executions < minExec) return false;
                    }
                    if (p.taskId) {
                        const task = newTasks[p.taskId];
                        if (!task) return false;
                        // minLevel checks task level
                        if (p.minLevel !== undefined && task.level < p.minLevel) return false;
                        // minAmount checks task completions (legacy)
                        if (p.minAmount !== undefined && (task.completions || 0) < p.minAmount) return false;
                        // minExecutions checks task completions
                        if (p.minExecutions !== undefined && (task.completions || 0) < p.minExecutions) return false;
                    }
                    return true;
                });
            };

            TASKS.forEach(t => {
                if (!newTasks[t.id].unlocked) {
                    if (checkPrereqsInternal(t.prerequisites)) {
                        newTasks[t.id] = { ...newTasks[t.id], unlocked: true };
                    }
                }
            });

            ACTIONS.forEach(a => {
                if (!newActions[a.id].unlocked) {
                    if (checkPrereqsInternal(a.prerequisites)) {
                        if (!actionsChanged) {
                            newActions = { ...newActions };
                            actionsChanged = true;
                        }
                        newActions[a.id] = { ...newActions[a.id], unlocked: true };
                    }
                }
            });

            // Check Converter Unlocks
            CONVERTERS.forEach(c => {
                if (!newConverters[c.id].unlocked) {
                    if (checkPrereqsInternal(c.prerequisites)) {
                        if (!convertersChanged) {
                            newConverters = { ...newConverters };
                            convertersChanged = true;
                        }
                        newConverters[c.id] = { ...newConverters[c.id], unlocked: true };
                    }
                }
            });

            // Reconstruct activeTaskIds preserving order
            let nextActiveTaskIds = state.activeTaskIds.filter(id => newTasks[id]?.active);
            // Append any new active tasks (e.g. from auto-rest) that weren't tracked yet
            Object.keys(newTasks).forEach(id => {
                if (newTasks[id].active && !nextActiveTaskIds.includes(id)) {
                    nextActiveTaskIds.push(id);
                }
            });

            return {
                ...state,
                resources: newResources,
                tasks: newTasks,
                actions: actionsChanged ? newActions : state.actions,
                converters: convertersChanged ? newConverters : state.converters,
                modifiers: newModifiers,
                inventory: newInventory,
                log: logUpdates.slice(0, 50),
                totalTimePlayed: state.totalTimePlayed + action.dt,
                activeTaskIds: nextActiveTaskIds,
                maxConcurrentTasks: newMaxTasks
            };
        }

        default:
            return state;
    }
};

interface RateBreakdown {
    source: string;
    amount: number;
}

export interface ResourceBreakdown {
    maxModifiers: { sourceName: string; value: number; type: 'flat' | 'percent' | 'set' }[];
    rates: RateBreakdown[];
    totalRate: number;
}

interface ExtendedGameContextType extends GameContextType {
    getActiveModifiers: () => Modifier[];
    getResourceBreakdown: (resourceId: string) => ResourceBreakdown;
}

const GameContext = createContext<ExtendedGameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, createInitialState());
    const tickRef = useRef<number | null>(null);
    const stateRef = useRef(state);

    // Sync ref for access in intervals
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Game Loop
    useEffect(() => {
        const TICK_RATE = 100; // ms
        const loop = () => {
            dispatch({ type: "TICK", dt: TICK_RATE });
        };
        const id = setInterval(loop, TICK_RATE);
        tickRef.current = id as unknown as number;
        return () => clearInterval(id);
    }, []);

    // --- Persistence Logic ---
    const SAVE_KEY = 'openidle_save';

    const saveGame = () => {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
            dispatch({ type: "ADD_LOG", msg: "Game Saved." });
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    const loadGame = () => {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                dispatch({ type: "LOAD_GAME", state: parsed });
                dispatch({ type: "ADD_LOG", msg: "Game Loaded." });
            }
        } catch (e) {
            console.error("Load failed", e);
        }
    };

    const resetGame = () => {
        localStorage.removeItem(SAVE_KEY);
        dispatch({ type: "RESET_GAME" });
        dispatch({ type: "ADD_LOG", msg: "Game Reset." });
    };

    const exportSave = () => {
        try {
            return utf8_to_b64(JSON.stringify(stateRef.current));
        } catch (e) {
            console.error("Export failed", e);
            return "";
        }
    };

    const importSave = (saveData: string) => {
        try {
            const json = b64_to_utf8(saveData);
            const parsed = JSON.parse(json);
            dispatch({ type: "LOAD_GAME", state: parsed });
            dispatch({ type: "ADD_LOG", msg: "Game Imported successfully." });
            return true;
        } catch (e) {
            console.error("Import failed", e);
            dispatch({ type: "ADD_LOG", msg: "Import Failed: Invalid Data." });
            return false;
        }
    };

    // Auto-Load on Mount
    useEffect(() => {
        loadGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-Save Interval
    useEffect(() => {
        const id = setInterval(() => {
            saveGame();
        }, 30000); // 30 seconds
        return () => clearInterval(id);
    }, []);

    const toggleTask = (taskId: TaskID) => {
        // If user manually toggles, we might want to interact with auto-rest logic?
        // For now, let's say if you manually toggle a task, it just does it.
        // BUT if you manually STOP the Rest Task, we should probably clear previousTaskId so it 
        // doesn't jump back later unexpectedly.

        const isRestTask = state.restTaskId === taskId;
        const isActive = state.tasks[taskId]?.active;



        dispatch({ type: "TOGGLE_TASK", taskId });
    };

    const triggerAction = (actionId: ActionID) => dispatch({ type: "TRIGGER_ACTION", actionId });
    const equipItem = (itemId: ItemID) => dispatch({ type: "EQUIP_ITEM", itemId });
    const unequipItem = (slotId: SlotID) => dispatch({ type: "UNEQUIP_ITEM", slotId });
    const buyConverter = (converterId: ConverterID) => dispatch({ type: "BUY_CONVERTER", converterId });
    const toggleConverter = (converterId: ConverterID) => dispatch({ type: "TOGGLE_CONVERTER", converterId });
    const addLog = (msg: string) => dispatch({ type: "ADD_LOG", msg });
    const setRestTask = (taskId: string | null) => dispatch({ type: "SET_REST_TASK", taskId });

    const activeModifiers = getActiveModifiers(state);

    const checkPrerequisites = (prereqs?: Prerequisite[]) => {
        if (!prereqs || prereqs.length === 0) return true;
        return prereqs.every(p => {
            if (p.resourceId) {
                const amount = state.resources[p.resourceId]?.current || 0;
                if (p.minAmount !== undefined && amount < p.minAmount) return false;
                if (p.maxAmount !== undefined && amount > p.maxAmount) return false;
                if (p.minMax !== undefined) {
                    const rConfig = RESOURCES.find(r => r.id === p.resourceId);
                    const modifiers = getActiveModifiers(state);
                    const max = calculateMax(p.resourceId, modifiers, rConfig?.baseMax ?? 0);
                    if (max < p.minMax) return false;
                }
            }
            if (p.actionId) {
                const executions = state.actions[p.actionId]?.executions || 0;
                if (p.minExecutions !== undefined && executions < p.minExecutions) return false;
            }
            if (p.taskId) {
                const tState = state.tasks[p.taskId];
                if (p.minLevel !== undefined && (tState?.level || 1) < p.minLevel) return false;
            }
            return true;
        });
    };

    const checkIsVisible = (id: string, prereqs?: Prerequisite[]) => {
        // 1. Check Global Locks (Actions)
        const isActionLocked = Object.keys(state.actions).some(actId => {
            const actState = state.actions[actId];
            if (actState.executions > 0) {
                const config = ACTIONS.find(a => a.id === actId);
                if (config && config.locks && config.locks.includes(id)) {
                    return true;
                }
            }
            return false;
        });

        if (isActionLocked) return false;

        // 2. Check Global Locks (Tasks)
        const isTaskLocked = Object.keys(state.tasks).some(taskId => {
            const taskState = state.tasks[taskId];
            if (taskState.active || (taskState.completions || 0) > 0 || taskState.level > 1) {
                const config = TASKS.find(t => t.id === taskId);
                if (config && config.locks && config.locks.includes(id)) {
                    return true;
                }
            }
            return false;
        });

        if (isTaskLocked) return false;

        if (state.tasks[id]?.unlocked) return true;
        if (state.actions[id]?.unlocked) return true;

        return false;
    };

    const getMaxResource = (id: string) => {
        const res = RESOURCES.find(r => r.id === id);
        return res ? calculateMax(id, activeModifiers, res.baseMax) : 0;
    };

    const getResourceBreakdown = (resourceId: string): ResourceBreakdown => {
        // 1. Max Modifiers
        const maxModifiers = activeModifiers
            .filter(m => m.resourceId === resourceId && (!m.property || m.property === 'max'))
            .map(m => {
                return {
                    sourceName: m.sourceId,
                    value: m.value,
                    type: m.type
                };
            });

        // 2. Active Rates
        const rates: RateBreakdown[] = [];

        // Task Rates
        Object.entries(state.tasks).forEach(([tid, tState]: [string, TaskState]) => {
            if (!tState.active) return;
            const task = TASKS.find(t => t.id === tid);
            if (!task) return;

            // Only continuous costs
            task.costPerSecond.forEach(c => {
                if (c.resourceId === resourceId) {
                    rates.push({ source: task.name, amount: -c.amount });
                }
            });

            // Only continuous effects
            task.effectsPerSecond.forEach(e => {
                if (e.resourceId === resourceId && e.type === 'add_resource') {
                    let amount = e.amount;
                    if (e.scaleFactor) {
                        const exponent = tState.level - 1;
                        switch (e.scaleType) {
                            case 'fixed':
                                amount = e.amount + (e.scaleFactor * exponent);
                                break;
                            case 'percentage':
                                amount = e.amount * (1 + e.scaleFactor * exponent);
                                break;
                            case 'exponential':
                            default:
                                amount = e.amount * Math.pow(e.scaleFactor, exponent);
                                break;
                        }
                    }
                    amount = calculateYield(amount, tid, 'task', e.resourceId, activeModifiers);
                    rates.push({ source: task.name, amount: amount });
                }
            });
        });

        // Passive Conversion Rates
        RESOURCES.forEach(sourceConfig => {
            if (!sourceConfig.passiveGen) return;
            const sourceAmount = state.resources[sourceConfig.id]?.current || 0;
            if (sourceAmount < 1) return;

            sourceConfig.passiveGen.forEach(gen => {
                if (gen.targetResourceId === resourceId) {
                    rates.push({
                        source: `${sourceConfig.name} (Passive)`,
                        amount: Math.floor(sourceAmount) * gen.ratePerUnit
                    });
                }
            });
        });

        // Passive Modifier Rates (Generation)
        activeModifiers.forEach(m => {
            if (m.resourceId === resourceId && m.property === 'gen' && m.type === 'flat') {
                rates.push({
                    source: `${m.sourceId} (Passive)`,
                    amount: m.value
                });
            }
        });

        // Converter Rates
        Object.entries(state.converters).forEach(([cid, cState]: [string, { owned: boolean; active: boolean }]) => {
            if (!cState.owned || !cState.active) return;
            const converter = CONVERTERS.find(c => c.id === cid);
            if (!converter) return;

            // Check if converter can afford to run (same check as TICK)
            const canAfford = converter.costPerSecond.every(c => {
                const available = state.resources[c.resourceId]?.current || 0;
                const needed = c.amount * 0.1; // ~100ms tick
                return available >= needed;
            });
            if (!canAfford) return;

            // Converter costs
            converter.costPerSecond.forEach(c => {
                if (c.resourceId === resourceId) {
                    rates.push({ source: converter.name, amount: -c.amount });
                }
            });

            // Converter effects
            converter.effectsPerSecond.forEach(e => {
                if (e.resourceId === resourceId && e.type === 'add_resource') {
                    rates.push({ source: converter.name, amount: e.amount });
                }
            });
        });

        const totalRate = rates.reduce((sum, r) => sum + r.amount, 0);
        return { maxModifiers, rates, totalRate };
    };

    return (
        <GameContext.Provider
            value={{
                state,
                config: { resources: RESOURCES, actions: ACTIONS, tasks: TASKS, categories: CATEGORIES, items: ITEMS, slots: SLOTS, converters: CONVERTERS },
                triggerAction,
                toggleTask,
                setRestTask,
                equipItem,
                unequipItem,
                buyConverter,
                toggleConverter,
                getMaxResource,
                addLog,
                checkPrerequisites,
                checkIsVisible,
                getActiveModifiers: () => activeModifiers,
                getResourceBreakdown,
                saveGame,
                resetGame,
                exportSave,
                importSave
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
