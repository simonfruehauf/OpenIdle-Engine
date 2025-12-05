import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { ACTIONS, CATEGORIES, RESOURCES, TASKS, SLOTS, ITEMS } from "../gameData/index";
import { ActionConfig, GameContextType, GameState, Modifier, TaskConfig, ResourceID, Cost, ActionID, TaskID, Prerequisite, SlotID, ItemID, ItemConfig, SlotConfig, CategoryConfig, TaskState, Effect } from "../types";

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
                 } else if (e.type === 'modify_task_yield_pct' && e.taskId) {
                     mods.push({ sourceId: item.name, type: 'percent', value: e.amount, taskId: e.taskId });
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
    // 1. Sum Flat Bonuses (Explicitly check property is 'max' or undefined for legacy)
    const flats = modifiers
        .filter(m => m.resourceId === resId && m.type === 'flat' && (!m.property || m.property === 'max'))
        .reduce((sum, m) => sum + m.value, 0);

    // 2. Sum Percent Bonuses (Additive)
    const percents = modifiers
        .filter(m => m.resourceId === resId && m.type === 'percent' && (!m.property || m.property === 'max'))
        .reduce((sum, m) => sum + m.value, 0);

    return Math.floor((baseMax + flats) * (1 + percents));
};

// --- Helper: Task Yield Multiplier ---
const calculateTaskYieldMultiplier = (taskId: TaskID, modifiers: Modifier[]): number => {
    const mods = modifiers.filter(m => m.taskId === taskId && m.type === 'percent');
    const totalPercent = mods.reduce((sum, m) => sum + m.value, 0);
    return 1 + totalPercent;
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

  return {
    resources,
    actions: actionsState,
    tasks: tasksState,
    inventory: [],
    equipment: {},
    modifiers: [],
    log: ["Welcome. Manage your tasks and resources."],
    totalTimePlayed: 0,
    activeTaskIds: [],
    maxConcurrentTasks: 1,
    selectedRestTaskId: "sleep", // Default rest task
    lastActiveTaskId: undefined
  };
};

// --- Reducer ---
type Action =
  | { type: "TICK"; dt: number }
  | { type: "TRIGGER_ACTION"; actionId: string }
  | { type: "TOGGLE_TASK"; taskId: string }
  | { type: "SET_REST_TASK"; taskId: string }
  | { type: "EQUIP_ITEM"; itemId: string }
  | { type: "UNEQUIP_ITEM"; slotId: string }
  | { type: "ADD_LOG"; msg: string }
  | { type: "LOAD_GAME"; state: GameState }
  | { type: "RESET_GAME" };

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
            inventory: action.state.inventory || defaults.inventory,
            equipment: action.state.equipment || defaults.equipment,
            modifiers: action.state.modifiers || defaults.modifiers,
            log: action.state.log || defaults.log,
            selectedRestTaskId: action.state.selectedRestTaskId || defaults.selectedRestTaskId,
            maxConcurrentTasks: action.state.maxConcurrentTasks || defaults.maxConcurrentTasks,
            activeTaskIds: action.state.activeTaskIds || defaults.activeTaskIds
        };
    }
    
    case "RESET_GAME":
        return createInitialState();

    case "ADD_LOG":
      return { ...state, log: [action.msg, ...state.log].slice(0, 50) };

    case "SET_REST_TASK":
        return { ...state, selectedRestTaskId: action.taskId };

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
            log: [`Unequipped ${ITEMS.find(i=>i.id===itemId)?.name}`, ...state.log].slice(0, 50)
        };
    }

    case "TRIGGER_ACTION": {
        const config = ACTIONS.find(a => a.id === action.actionId);
        if (!config) return state;

        const actionState = state.actions[action.actionId];
        
        if (config.maxExecutions && actionState.executions >= config.maxExecutions) {
            return { ...state, log: [`${config.name} limit reached.`, ...state.log].slice(0,20) };
        }

        const canAfford = config.costs.every(c => {
            const costAmount = getScaledCost(c, actionState.executions, 0, 0);
            return (state.resources[c.resourceId]?.current || 0) >= costAmount;
        });
        if (!canAfford) {
             return { ...state, log: [`Not enough resources for ${config.name}`, ...state.log].slice(0,20) };
        }

        // Pay Costs
        const newResources = cloneResources(state.resources);
        config.costs.forEach(c => {
            const costAmount = getScaledCost(c, actionState.executions, 0, 0);
            newResources[c.resourceId].current -= costAmount;
        });

        // Apply Effects
        const newModifiers = [...state.modifiers];
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
            } else if (e.type === 'modify_task_yield_pct' && e.taskId) {
                newModifiers.push({ sourceId: config.name, taskId: e.taskId, type: 'percent', value: e.amount });
            } else if (e.type === 'add_item' && e.itemId) {
                for (let i = 0; i < e.amount; i++) {
                    newInventory.push(e.itemId);
                }
            } else if (e.type === 'increase_max_tasks') {
                newMaxTasks += e.amount;
            }
        };

        // Standard Effects
        config.effects.forEach(applyEffect);

        // First Completion Effects
        if (actionState.executions === 0 && config.firstCompletionEffects) {
             config.firstCompletionEffects.forEach(applyEffect);
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

        return { ...state, tasks: newTasks, resources: newResources, activeTaskIds: newActiveTaskIds, lastActiveTaskId: undefined, log: logUpdates.slice(0, 20) };
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
        let newLastActiveTaskId = state.lastActiveTaskId;
        let newMaxTasks = state.maxConcurrentTasks;

        // Helper for calculating max within tick
        const getTickMax = (rid: string) => {
             const r = RESOURCES.find(x => x.id === rid);
             return r ? calculateMax(rid, allModifiers, r.baseMax) : 0;
        };
        
        // Helper to apply effects (Shared logic for completion/first-completion)
        const applyTaskEffect = (e: Effect, level: number, yieldMulti: number) => {
             if (e.chance !== undefined && Math.random() > e.chance) return;

             if (e.type === 'add_resource' && e.resourceId) {
                const scale = e.scaleFactor ? Math.pow(e.scaleFactor, level - 1) : 1;
                const amount = e.amount * scale * yieldMulti;
                const current = newResources[e.resourceId].current;
                const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                const max = calculateMax(e.resourceId, allModifiers, rConfig?.baseMax ?? 100);
                newResources[e.resourceId].current = Math.min(current + amount, max);
            } else if (e.type === 'modify_max_resource_flat' && e.resourceId) {
                newModifiers.push({ sourceId: TASKS.find(t=>t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'max' });
            } else if (e.type === 'modify_max_resource_pct' && e.resourceId) {
                newModifiers.push({ sourceId: TASKS.find(t=>t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'percent', value: e.amount, property: 'max' });
            } else if (e.type === 'modify_passive_gen' && e.resourceId) {
                newModifiers.push({ sourceId: TASKS.find(t=>t.id === e.taskId)?.name || "Task", resourceId: e.resourceId, type: 'flat', value: e.amount, property: 'gen' });
            } else if (e.type === 'modify_task_yield_pct' && e.taskId) {
                newModifiers.push({ sourceId: "Task Reward", taskId: e.taskId, type: 'percent', value: e.amount });
            } else if (e.type === 'add_item' && e.itemId) {
                newInventory.push(e.itemId);
                logUpdates.unshift(`Obtained: ${ITEMS.find(i=>i.id===e.itemId)?.name}`);
            } else if (e.type === 'increase_max_tasks') {
                newMaxTasks += e.amount;
            }
        };

        // 1. Process Active Tasks
        Object.keys(newTasks).forEach((tid) => {
            let tState = newTasks[tid]; // Get latest reference (potentially updated by other logic?)
            // Actually, we want to work with a local mutable copy or handle updates carefully.
            // But since we are iterating keys, we can re-fetch.
            
            if (!tState.active) return;
            // if (tid === 'fester') logUpdates.unshift(`DEBUG: Fester Active. Progress: ${tState.progress?.toFixed(2)}`);

            const config = TASKS.find(t => t.id === tid);
            if (!config) return;

            const yieldMulti = calculateTaskYieldMultiplier(tid, allModifiers);

            // Check for Auto-Return from Rest
            if (config.type === 'rest' && newLastActiveTaskId && state.selectedRestTaskId === tid) {
                 const oldTask = TASKS.find(t => t.id === newLastActiveTaskId);
                 if (oldTask) {
                     // Determine if the old task can now afford to resume
                     let oldTaskCanAffordResume = true;
                     const oldTaskState = newTasks[newLastActiveTaskId];

                     // Check Start Costs (if not already paid for the current cycle)
                     if (oldTask.startCosts && !oldTaskState.paid) {
                         const canAffordStart = oldTask.startCosts.every(c => {
                             const costAmount = getScaledCost(c, 0, oldTaskState.level, oldTaskState.completions || 0);
                             return (newResources[c.resourceId]?.current || 0) >= costAmount;
                         });
                         if (!canAffordStart) {
                             oldTaskCanAffordResume = false;
                         }
                     }

                     // Check Continuous Costs
                     if (oldTaskCanAffordResume && oldTask.costPerSecond) {
                         const canAffordPerSecond = oldTask.costPerSecond.every(c => {
                             const costAmount = getScaledCost(c, 0, oldTaskState.level, oldTaskState.completions || 0); // Scale factor for tasks uses Level
                             return (newResources[c.resourceId]?.current || 0) >= (costAmount * dtSeconds);
                         });
                         if (!canAffordPerSecond) {
                             oldTaskCanAffordResume = false;
                         }
                     }
                     
                     if (oldTaskCanAffordResume) {
                        tState.active = false; // Stop rest
                        newTasks[newLastActiveTaskId].active = true;
                        logUpdates.unshift(`Rest complete. Resuming ${oldTask.name}.`);
                        newLastActiveTaskId = undefined;
                        return; // Stop processing this rest task
                     }
                 }
            }
            
            // Check Start Costs (If not paid, e.g. auto-restart)
            if (!tState.paid && config.startCosts) {
                 if (tid === 'fester') logUpdates.unshift("DEBUG: Fester !paid -> Paying Start Cost");
                 const canAffordStart = config.startCosts.every(c => {
                     const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                     return (newResources[c.resourceId]?.current || 0) >= costAmount;
                 });

                 if (!canAffordStart) {
                     tState.active = false;
                     logUpdates.unshift(`${config.name} stopped (cannot afford restart cost).`);
                     // Fallback to Rest
                     if (state.selectedRestTaskId && state.selectedRestTaskId !== tid) {
                        newTasks[state.selectedRestTaskId].active = true;
                        newLastActiveTaskId = tid;
                        logUpdates.unshift(`Switched to ${TASKS.find(t => t.id === state.selectedRestTaskId)?.name} (low resources)`);
                        return; 
                     }
                     return;
                 }
                 
                 // Pay Start Costs
                 config.startCosts.forEach(c => {
                     const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                     newResources[c.resourceId].current -= costAmount;
                 });
                 newTasks[tid] = { ...tState, paid: true };
                 tState = newTasks[tid];
            } else if (tid === 'fester' && config.startCosts) {
                 // Removed: logUpdates.unshift(`DEBUG: Fester already paid (${tState.paid})`);
            }

            // Check Costs (Continuous)
            const canAfford = config.costPerSecond.every(c => 
                (newResources[c.resourceId]?.current || 0) >= (c.amount * dtSeconds)
            );

            if (!canAfford) {
                tState.active = false;
                
                // Fallback to Rest Task
                if (state.selectedRestTaskId && state.selectedRestTaskId !== tid) {
                    const restTask = TASKS.find(t => t.id === state.selectedRestTaskId);
                    if (restTask && restTask.type === 'rest') {
                         // Note: Rest tasks shouldn't really have start costs, but if they did, check them here.
                         // For now assuming rest tasks are free to start.
                         newTasks[state.selectedRestTaskId].active = true;
                         newLastActiveTaskId = tid;
                         logUpdates.unshift(`Switched to ${restTask.name} (low resources)`);
                         return; 
                    }
                }

                logUpdates.unshift(`${config.name} stopped (insufficient resources)`);
                return;
            }

            // Deduct Costs
            config.costPerSecond.forEach(c => {
                newResources[c.resourceId].current -= (c.amount * dtSeconds);
            });

            // Timed/Progress Logic
            if (config.progressRequired) {
                const oldProgress = tState.progress || 0;
                const newProgress = oldProgress + dtSeconds;
                
                // IMMUTABLE UPDATE
                newTasks[tid] = { ...tState, progress: newProgress };
                tState = newTasks[tid]; // Update local reference
                
                // Heartbeat Log Removed
                // if (tid === 'fester' && Math.floor(newProgress) > Math.floor(oldProgress)) {
                //     logUpdates.unshift(`DEBUG: Fester Heartbeat ${Math.floor(newProgress)}s`);
                // }
                
                // Use epsilon for float comparison
                if (newProgress >= config.progressRequired - 0.0001) {
                    // --- TASK COMPLETED ---
                    // Completion Log Removed
                    // if (tid === 'fester') logUpdates.unshift(`DEBUG: Fester ENTERING COMPLETION BLOCK.`);
                    tState.progress = 0;
                    
                    const completions = tState.completions || 0;
                    tState.completions = completions + 1;
                    
                    if (!config.autoRestart) {
                        tState.active = false;
                        logUpdates.unshift(`${config.name} completed.`);
                    }

                    // 1. Completion Effects (Standard)
                    if (config.completionEffects) {
                        config.completionEffects.forEach(e => {
                            applyTaskEffect(e, tState.level, yieldMulti);
                            // Applied Effect Log Removed
                            // if (tid === 'fester') logUpdates.unshift(`DEBUG: Applied ${e.type} ${e.amount}`);
                        });
                    }

                    // 2. First Time Effects
                    if (completions === 0 && config.firstCompletionEffects) {
                        config.firstCompletionEffects.forEach(e => applyTaskEffect(e, tState.level, yieldMulti));
                    }

                    // Reset Paid Status for next run
                    newTasks[tid] = { ...tState, progress: 0, paid: false };
                    tState = newTasks[tid]; 
                    
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
                        const scale = e.scaleFactor ? Math.pow(e.scaleFactor, tState.level - 1) : 1;
                        const amount = e.amount * scale * dtSeconds * yieldMulti;

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

        // Cap resources at 0
        Object.keys(newResources).forEach(rid => {
            if (newResources[rid].current < 0) newResources[rid].current = 0;
        });

        // --- 4. Process Unlocks (Latch Mechanism) ---
        
        const checkPrereqsInternal = (pList?: Prerequisite[]) => {
            if (!pList || pList.length === 0) return true;
            return pList.every(p => {
                if (p.resourceId) {
                    const res = newResources[p.resourceId];
                    if (!res) return false;
                    if (p.minAmount !== undefined && res.current < p.minAmount) return false;
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
                    const minLvl = p.minLevel || 1;
                    if (!task || task.level < minLvl) return false;
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
            modifiers: newModifiers,
            inventory: newInventory,
            log: logUpdates.slice(0, 50),
            totalTimePlayed: state.totalTimePlayed + action.dt,
            lastActiveTaskId: newLastActiveTaskId,
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

interface ResourceBreakdown {
    maxModifiers: { sourceName: string; value: number; type: 'flat' | 'percent' }[];
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

  const triggerAction = (actionId: string) => dispatch({ type: "TRIGGER_ACTION", actionId });
  const toggleTask = (taskId: string) => dispatch({ type: "TOGGLE_TASK", taskId });
  const setRestTask = (taskId: string) => dispatch({ type: "SET_REST_TASK", taskId });
  const equipItem = (itemId: string) => dispatch({ type: "EQUIP_ITEM", itemId });
  const unequipItem = (slotId: string) => dispatch({ type: "UNEQUIP_ITEM", slotId });
  const addLog = (msg: string) => dispatch({ type: "ADD_LOG", msg });
  
  const activeModifiers = getActiveModifiers(state);

  const getMaxResource = (id: string) => {
      const res = RESOURCES.find(r => r.id === id);
      return res ? calculateMax(id, activeModifiers, res.baseMax) : 0;
  };

  const checkPrerequisites = (prereqs?: Prerequisite[]) => {
      if (!prereqs || prereqs.length === 0) return true;
      return prereqs.every(p => {
          if (p.resourceId) {
              const res = state.resources[p.resourceId];
              if (!res) return false;
              if (p.minAmount !== undefined && res.current < p.minAmount) return false;
              if (p.minMax !== undefined) {
                   const max = getMaxResource(p.resourceId);
                   if (max < p.minMax) return false;
              }
          }
          if (p.actionId) {
              const act = state.actions[p.actionId];
              const minExec = p.minExecutions || 1;
              if (!act || act.executions < minExec) return false;
          }
          if (p.taskId) {
              const task = state.tasks[p.taskId];
              const minLvl = p.minLevel || 1;
              if (!task || task.level < minLvl) return false;
          }
          return true;
      });
  };

  const checkIsVisible = (id: string, prereqs?: Prerequisite[]) => {
      // 1. Check Global Locks
      const isLocked = Object.keys(state.actions).some(actId => {
          const actState = state.actions[actId];
          if (actState.executions > 0) {
              const config = ACTIONS.find(a => a.id === actId);
              if (config && config.locks && config.locks.includes(id)) {
                  return true;
              }
          }
          return false;
      });

      if (isLocked) return false;

      // 2. Check Latch State
      if (state.tasks[id]?.unlocked) return true;
      if (state.actions[id]?.unlocked) return true;

      return false;
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

          const yieldMulti = calculateTaskYieldMultiplier(tid, activeModifiers);

          // Only continuous costs
          task.costPerSecond.forEach(c => {
              if (c.resourceId === resourceId) {
                  rates.push({ source: task.name, amount: -c.amount });
              }
          });

          // Only continuous effects
          task.effectsPerSecond.forEach(e => {
              if (e.resourceId === resourceId && e.type === 'add_resource') {
                  const scale = e.scaleFactor ? Math.pow(e.scaleFactor, tState.level - 1) : 1;
                  rates.push({ source: task.name, amount: e.amount * scale * yieldMulti });
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

      const totalRate = rates.reduce((sum, r) => sum + r.amount, 0);
      return { maxModifiers, rates, totalRate };
  };

  return (
    <GameContext.Provider
      value={{
        state,
        config: { resources: RESOURCES, actions: ACTIONS, tasks: TASKS, categories: CATEGORIES, items: ITEMS, slots: SLOTS },
        triggerAction,
        toggleTask,
        setRestTask,
        equipItem,
        unequipItem,
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
