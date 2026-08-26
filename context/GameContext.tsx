import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";

const TICK_RATE_MS = 100;
const TICK_RATE_SECONDS = TICK_RATE_MS / 1000;
import { ACTIONS, CATEGORIES, RESOURCES, TASKS, SLOTS, ITEMS, CONVERTERS } from "../gameData/index";
import { SPELLS, ASPECTS } from "../gameData/core/aspects";
import { CASTING_FORMS } from "../gameData/core/castingForms";
import { ActionConfig, GameContextType, GameState, Modifier, TaskConfig, ResourceID, Cost, ActionID, TaskID, Prerequisite, SlotID, ItemID, ItemConfig, SlotConfig, CategoryConfig, TaskState, Effect, ConverterID, ConverterConfig, LogEntry, LogCategory, AspectID, SpellConfig, CastingFormModifier } from "../types";

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
                } else if (e.type === 'set_max_resource' && e.resourceId) {
                    mods.push({ sourceId: item.name, type: 'set', value: e.amount, resourceId: e.resourceId, property: 'max' });
                } else if (e.type === 'modify_yield_pct') {
                    // Support task-specific, action-specific, resource-specific, and global (no target) variants
                    if (e.taskId) mods.push({ sourceId: item.name, type: 'percent', value: e.amount, taskId: e.taskId, property: 'yield', resourceId: e.resourceId });
                    else if (e.actionId) mods.push({ sourceId: item.name, type: 'percent', value: e.amount, actionId: e.actionId, property: 'yield', resourceId: e.resourceId });
                    else if (e.resourceId) mods.push({ sourceId: item.name, type: 'percent', value: e.amount, resourceId: e.resourceId, property: 'yield' });
                    else mods.push({ sourceId: item.name, type: 'percent', value: e.amount, property: 'yield' });
                } else if (e.type === 'modify_yield_flat') {
                    if (e.taskId) mods.push({ sourceId: item.name, type: 'flat', value: e.amount, taskId: e.taskId, property: 'yield', resourceId: e.resourceId });
                    else if (e.actionId) mods.push({ sourceId: item.name, type: 'flat', value: e.amount, actionId: e.actionId, property: 'yield', resourceId: e.resourceId });
                    else if (e.resourceId) mods.push({ sourceId: item.name, type: 'flat', value: e.amount, resourceId: e.resourceId, property: 'yield' });
                    else mods.push({ sourceId: item.name, type: 'flat', value: e.amount, property: 'yield' });
                } else if (e.type === 'modify_passive_gen' && e.resourceId) {
                    mods.push({ sourceId: item.name, type: 'flat', value: e.amount, resourceId: e.resourceId, property: 'gen' });
                } else if (e.type === 'add_passive_gen_per_unit' && e.sourceResourceId && e.targetResourceId) {
                    mods.push({ sourceId: item.name, type: 'flat', value: e.amount, property: 'gen_per_unit', sourceResourceId: e.sourceResourceId, targetResourceId: e.targetResourceId, resourceId: e.targetResourceId });
                }
            });
        }
    });

    return mods;
};

// --- Helper: Log Categorization ---
const inferLogCategory = (msg: string): LogCategory => {
    if (/Obtained:|Found item:/i.test(msg)) return 'loot';
    if (/leveled up to|completed\.|max completions reached|Purchased/i.test(msg)) return 'unlock';
    return 'other';
};

const makeLog = (msg: string, category: LogCategory = 'other'): LogEntry => ({ msg, category });

const migrateLog = (rawLog: any): LogEntry[] => {
    if (!Array.isArray(rawLog)) return [makeLog("Welcome. Manage your tasks and resources.", 'other')];
    return rawLog.map((e: any) => {
        if (typeof e === 'string') return makeLog(e, inferLogCategory(e));
        if (e && typeof e.msg === 'string') return { msg: e.msg, category: (e.category as LogCategory) || inferLogCategory(e.msg) };
        return makeLog(String(e), 'other');
    }).slice(0, 50);
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

// --- Helper: Unified Prerequisite Evaluation ---
const evaluatePrereq = (
    p: Prerequisite,
    ctx: { resources: GameState["resources"]; actions: GameState["actions"]; tasks: GameState["tasks"]; getMax: (rid: string) => number }
): boolean => {
    if (p.resourceId) {
        const res = ctx.resources[p.resourceId];
        if (!res) return false;
        if (p.minAmount !== undefined && res.current < p.minAmount) return false;
        if (p.maxAmount !== undefined && res.current > p.maxAmount) return false;
        if (p.minMax !== undefined && ctx.getMax(p.resourceId) < p.minMax) return false;
    }
    if (p.actionId) {
        const act = ctx.actions[p.actionId];
        const needed = p.minExecutions ?? 1;
        if (!act || act.executions < needed) return false;
    }
    if (p.taskId) {
        const t = ctx.tasks[p.taskId];
        if (!t || !t.unlocked) return false;
        if (p.minLevel !== undefined && t.level < p.minLevel) return false;
        if (p.minAmount !== undefined && (t.completions || 0) < p.minAmount) return false;
        if (p.minExecutions !== undefined && (t.completions || 0) < p.minExecutions) return false;
    }
    return true;
};

const checkPrereqsList = (
    list: Prerequisite[] | undefined,
    ctx: { resources: GameState["resources"]; actions: GameState["actions"]; tasks: GameState["tasks"]; getMax: (rid: string) => number }
): boolean => {
    if (!list || list.length === 0) return true;
    return list.every(p => evaluatePrereq(p, ctx));
};

// --- Helper: v6 migration fix for cat/threads/ashes + insight clamping ---
const applyV6CatInsightFix = (
    migratedResources: GameState["resources"],
    incoming: GameState,
    migratedModifiers: Modifier[]
) => {
    const fixResources: Record<string, { gain: number; actionId: string }> = {
        "cat": { gain: 1, actionId: "find_cat" },
        "threads": { gain: 3, actionId: "trust_cat" },
        "ashes": { gain: 4, actionId: "reject_cat" }
    };
    for (const [rid, info] of Object.entries(fixResources)) {
        if ((incoming.actions?.[info.actionId]?.executions ?? 0) > 0 && (migratedResources[rid]?.current ?? 0) === 0) {
            const hasMax = migratedModifiers.some(m => m.resourceId === rid && (m.property === 'max' || !m.property));
            if (hasMax) {
                migratedResources[rid] = { ...migratedResources[rid], current: info.gain };
            }
        }
    }
    const insightActions = ["trust_cat", "reject_cat", "exploit_cat"];
    const anyInsightAction = insightActions.some(a => (incoming.actions?.[a]?.executions ?? 0) > 0);
    if (anyInsightAction && (migratedResources["insight"]?.current ?? 0) === 0) {
        const hasInsightMax = migratedModifiers.some(m => m.resourceId === "insight" && (m.property === 'max' || !m.property));
        if (hasInsightMax) {
            const expected = (incoming.actions?.["trust_cat"]?.executions ?? 0) > 0 ? 6 : (incoming.actions?.["reject_cat"]?.executions ?? 0) > 0 ? 2 : 4;
            migratedResources["insight"] = { ...migratedResources["insight"], current: Math.min(expected, 6) };
        }
    }
};

// --- SUNDERED Helpers: Spell Lookup & Casting Math ---
const getSpellById = (id: string): SpellConfig | undefined => SPELLS.find(s => s.id === id);

const getActiveForms = (selection: GameState["activeFormSelection"]): CastingFormModifier[] =>
    (["method", "duration", "target"] as const)
        .map(axis => selection[axis])
        .filter((fid): fid is string => !!fid)
        .map(fid => CASTING_FORMS.find(f => f.id === fid))
        .filter((f): f is CastingFormModifier => !!f);

const computeFailureChance = (
    spell: SpellConfig,
    focusCurrent: number,
    focusMax: number,
    forms: CastingFormModifier[]
): number => {
    const complexity = spell.tier * 10;
    const focusRatio = focusMax > 0 ? focusCurrent / focusMax : 0;
    const sufficient = focusRatio >= Math.min(1, complexity / 100);
    let base = sufficient ? 0.05 : 0.15;
    const reliability = forms.reduce((sum, f) => sum + (f.reliabilityBonus ?? 0), 0);
    return Math.max(0.01, base - reliability);
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
        version: 7,
        resources,
        actions: actionsState,
        tasks: tasksState,
        converters: convertersState,
        inventory: [],
        equipment: {},
        modifiers: [],
        log: [makeLog("Welcome. Manage your tasks and resources.", 'other')],
        totalTimePlayed: 0,
        activeTaskIds: [],
        maxConcurrentTasks: 1,
        restTaskId: null,
        previousTaskId: null,
        flags: {},
        aspectFluency: { ash: 0, root: 0, hush: 0, iron: 0 },
        failedCastings: { ash: 0, root: 0, hush: 0, iron: 0 },
        castingFormsUnlocked: {},
        activeFormSelection: { method: undefined, duration: undefined, target: undefined },
        chapter: 1,
        sustainedSpells: [],
        footprintCounter: 0
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
    | { type: "ADD_LOG"; msg: string; category?: LogCategory }
    | { type: "LOAD_GAME"; state: GameState }
    | { type: "RESET_GAME" }
    | { type: "SET_REST_TASK"; taskId: string | null }
    | { type: "CAST_SPELL"; actionId: string }
    | { type: "SELECT_FORM"; axis: "method" | "duration" | "target"; formId: string };

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
    // Correctly distinguishes task vs action via currentLevel heuristic (tasks pass level>=1, actions pass 0).
    // Also respects scalesByCompletion for tasks.
    const getScaledCost = (
        costConfig: Cost,
        currentExecutions: number, // For actions
        currentLevel: number,      // For tasks (0 for actions)
        currentCompletions: number // For tasks (if scalesByCompletion)
    ): number => {
        if (!costConfig.scaleFactor) return costConfig.amount;

        let exponent: number;
        if (costConfig.scalesByCompletion) {
            exponent = currentCompletions;
        } else if (currentLevel > 0) {
            exponent = currentLevel - 1; // Task path
        } else {
            exponent = currentExecutions; // Action path
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
            const incoming = action.state as GameState;
            const incomingVersion = (incoming as any).version ?? 0;
            const migratedVersion = incomingVersion < defaults.version ? defaults.version : incomingVersion;

            // Migration v1 -> v2: side branches were visible from start due to baseMax >0 and low prerequisites.
            // Reset their unlocked state and hide their resources if the unlock action was not legitimately earned.
            let migratedResources = { ...defaults.resources, ...(incoming.resources || {}) };
            let migratedActions = { ...defaults.actions, ...(incoming.actions || {}) };
            let migratedTasks = { ...defaults.tasks, ...(incoming.tasks || {}) };
            let migratedModifiers = incoming.modifiers || defaults.modifiers;
            let migratedInventory = incoming.inventory || defaults.inventory;
            let migratedEquipment = incoming.equipment || defaults.equipment;
            const migratedLog = migrateLog((incoming as any).log);

            // v7: Normalize SUNDERED fields on every load path (backfills pre-v7 saves)
            const normalizeCastingFields = (merged: GameState): GameState => ({
                ...merged,
                flags: { ...(defaults.flags || {}), ...(merged.flags || {}) },
                aspectFluency: { ash: 0, root: 0, hush: 0, iron: 0, ...(merged.aspectFluency || {}) },
                failedCastings: { ash: 0, root: 0, hush: 0, iron: 0, ...(merged.failedCastings || {}) },
                castingFormsUnlocked: merged.castingFormsUnlocked || {},
                activeFormSelection: merged.activeFormSelection || defaults.activeFormSelection,
                chapter: merged.chapter || 1,
                sustainedSpells: merged.sustainedSpells || [],
                footprintCounter: merged.footprintCounter || 0
            });

            if (incomingVersion < 5) {
                const sideBranchResources = ["petals", "ribbons", "may_wine", "quiet", "marginalia", "tokens", "favor", "echo", "resonance"];
                const unlockActions: Record<string, string> = {
                    "petals": "belthane_hear_festival",
                    "ribbons": "belthane_hear_festival",
                    "may_wine": "belthane_hear_festival",
                    "quiet": "library_find",
                    "marginalia": "library_find",
                    "tokens": "market_hear",
                    "favor": "market_hear",
                    "echo": "threshold_open",
                    "resonance": "threshold_open"
                };
                // Hide resources and strip their modifiers if not unlocked
                for (const rid of sideBranchResources) {
                    const unlockId = unlockActions[rid];
                    const unlocked = unlockId ? (incoming.actions?.[unlockId]?.executions ?? 0) > 0 : false;
                    if (!unlocked) {
                        if (migratedResources[rid]) migratedResources[rid] = { ...migratedResources[rid], current: 0 };
                        migratedModifiers = migratedModifiers.filter(m => m.resourceId !== rid);
                        // Also remove items from inventory/equipment that belong to locked branches
                        const branchItems: Record<string, string[]> = {
                            "belthane_hear_festival": ["flower_crown","ribbon_crown","wine_stain","bonfire_token","belthane_charm"],
                            "library_find": ["library_card_item","whispering_bookmark","bound_folio"],
                            "market_hear": ["brass_scale","market_ledger"],
                            "threshold_open": ["key_ajar","packed_bag","threshold_coat","echo_keepsake"]
                        };
                        const itemsToRemove = branchItems[unlockId] || [];
                        if (itemsToRemove.length > 0) {
                            migratedInventory = migratedInventory.filter(id => !itemsToRemove.includes(id));
                            for (const slot of Object.keys(migratedEquipment)) {
                                if (itemsToRemove.includes(migratedEquipment[slot])) delete migratedEquipment[slot];
                            }
                        }
                    }
                }
                // v4 fix: Browse/Night Market favor was deadlocked (max 0). Ensure hear gives favor max even for v3 saves.
                if ((incoming.actions?.["market_hear"]?.executions ?? 0) > 0) {
                    const hasFavorMax = migratedModifiers.some(m => m.resourceId === "favor" && m.type === "flat" && (!m.property || m.property === "max"));
                    if (!hasFavorMax) {
                        migratedModifiers.push({ sourceId: "Night Market (migration v4)", resourceId: "favor", type: "flat", value: 8, property: "max" });
                        if (migratedResources["favor"]) {
                            const cur = migratedResources["favor"].current;
                            if (cur === 0) migratedResources["favor"] = { ...migratedResources["favor"], current: 2 };
                        }
                    }
                }
                const browseCompletions = (incoming.tasks?.["market_browse"] as any)?.completions ?? 0;
                if (browseCompletions > 0) {
                    const hasBrowseFavor = migratedModifiers.some(m => m.resourceId === "favor" && m.value === 6);
                    if (!hasBrowseFavor) {
                        // Browse first completion now gives favor+6 max, retroactively grant
                        migratedModifiers.push({ sourceId: "Browse (migration v4)", resourceId: "favor", type: "flat", value: 6, property: "max" });
                    }
                }

                // Reset unlocked flags for side-branch actions/tasks so they go through proper gate again
                const sideBranchIds = [
                    "belthane_hear_festival","belthane_gather_petals","belthane_weave_garland","belthane_dance_maypole","belthane_tend_bonfire","belthane_trade_ribbons","belthane_bless_bonfire","belthane_crown_flowers","belthane_crown_ribbons","belthane_taste_wine","belthane_keep_token","belthane_stay_late",
                    "library_find","library_sit","library_copy","library_shelve","library_card","library_restricted","library_bind_book","library_whisper_stacks",
                    "market_hear","market_browse","market_carry","market_haggle","market_enter","market_deal_small","market_deal_large","market_repay","market_stall_tokens","market_stall_favor",
                    "threshold_open","threshold_hold","threshold_listen_final","ending_stay","ending_leave","ending_become","prestige_begin_again","threshold_brazier"
                ];
                for (const sid of sideBranchIds) {
                    if (migratedActions[sid]) migratedActions[sid] = { ...migratedActions[sid], unlocked: !!defaults.actions[sid]?.unlocked };
                    if (migratedTasks[sid]) migratedTasks[sid] = { ...migratedTasks[sid], unlocked: !!defaults.tasks[sid]?.unlocked, active: false, progress: 0, paid: false };
                }
                // Also reset converters unlock
                const sideConverters = ["market_stall_tokens","market_stall_favor","threshold_brazier","kettle","dryer","incense_burner"];
                const migratedConverters = { ...defaults.converters, ...(incoming.converters || {}) };
                for (const cid of sideConverters) {
                    if (migratedConverters[cid]) migratedConverters[cid] = { ...migratedConverters[cid], unlocked: !!defaults.converters[cid]?.unlocked, owned: false, active: false };
                }
                // v6 fix: cat 0/1 bug - find_cat gave max but current stayed 0 due to stale max clamp
                if (incomingVersion < 6) applyV6CatInsightFix(migratedResources, incoming as any, migratedModifiers);
                return normalizeCastingFields({
                    ...defaults,
                    ...incoming,
                    version: migratedVersion,
                    resources: migratedResources,
                    actions: migratedActions,
                    tasks: migratedTasks,
                    converters: migratedConverters,
                    inventory: migratedInventory,
                    equipment: migratedEquipment,
                    modifiers: migratedModifiers,
                    log: migratedLog,
                    maxConcurrentTasks: incoming.maxConcurrentTasks || defaults.maxConcurrentTasks,
                    activeTaskIds: [],
                    restTaskId: (incoming as any).restTaskId ?? defaults.restTaskId,
                    previousTaskId: (incoming as any).previousTaskId ?? defaults.previousTaskId
                });
            }

            // v6 migration: fix 0/1 cat (and related) for saves at version 5
            if (incomingVersion < 6) {
                applyV6CatInsightFix(migratedResources, incoming as any, migratedModifiers);
                return normalizeCastingFields({
                    ...defaults,
                    ...incoming,
                    version: migratedVersion,
                    resources: migratedResources,
                    actions: migratedActions,
                    tasks: migratedTasks,
                    converters: { ...defaults.converters, ...(incoming.converters || {}) },
                    inventory: migratedInventory,
                    equipment: migratedEquipment,
                    modifiers: migratedModifiers,
                    log: migratedLog,
                    maxConcurrentTasks: incoming.maxConcurrentTasks || defaults.maxConcurrentTasks,
                    activeTaskIds: incoming.activeTaskIds || defaults.activeTaskIds,
                    restTaskId: (incoming as any).restTaskId ?? defaults.restTaskId,
                    previousTaskId: (incoming as any).previousTaskId ?? defaults.previousTaskId
                });
            }

            return normalizeCastingFields({
                ...defaults,
                ...incoming,
                version: migratedVersion,
                resources: { ...defaults.resources, ...(incoming.resources || {}) },
                actions: { ...defaults.actions, ...(incoming.actions || {}) },
                tasks: { ...defaults.tasks, ...(incoming.tasks || {}) },
                converters: { ...defaults.converters, ...(incoming.converters || {}) },
                inventory: incoming.inventory || defaults.inventory,
                equipment: incoming.equipment || defaults.equipment,
                modifiers: incoming.modifiers || defaults.modifiers,
                log: migrateLog((incoming as any).log),
                maxConcurrentTasks: incoming.maxConcurrentTasks || defaults.maxConcurrentTasks,
                activeTaskIds: incoming.activeTaskIds || defaults.activeTaskIds,
                restTaskId: (incoming as any).restTaskId ?? defaults.restTaskId,
                previousTaskId: (incoming as any).previousTaskId ?? defaults.previousTaskId
            });
        }

        case "RESET_GAME":
            return createInitialState();

        case "ADD_LOG":
            return { ...state, log: [makeLog(action.msg, action.category || 'other'), ...state.log].slice(0, 50) };

        case "SET_REST_TASK":
            return { ...state, restTaskId: action.taskId };

        case "EQUIP_ITEM": {
            const item = ITEMS.find(i => i.id === action.itemId);
            if (!item) return state;

            let targetSlot = item.slot;

            if (item.slot === "accessory") {
                const accessorySlots = ["accessory", "accessory_2"];
                const availableSlot = accessorySlots.find(slot => !state.equipment[slot]);
                if (availableSlot) {
                    targetSlot = availableSlot;
                } else {
                    targetSlot = "accessory";
                }
            }

            const currentEquipped = state.equipment[targetSlot];
            let newInventory = state.inventory.filter(id => id !== action.itemId);

            if (currentEquipped) {
                newInventory.push(currentEquipped);
            }

            return {
                ...state,
                inventory: newInventory,
                equipment: { ...state.equipment, [targetSlot]: action.itemId },
                log: [makeLog(`Equipped ${item.name}`, 'other'), ...state.log].slice(0, 50)
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
                log: [makeLog(`Unequipped ${ITEMS.find(i => i.id === itemId)?.name}`, 'other'), ...state.log].slice(0, 50)
            };
        }

        case "BUY_CONVERTER": {
            const config = CONVERTERS.find(c => c.id === action.converterId);
            if (!config) return state;

            const converterState = state.converters[action.converterId];
            if (converterState.owned) {
                return { ...state, log: [makeLog(`Already own ${config.name}`, 'other'), ...state.log].slice(0, 20) };
            }

            // Check if can afford
            const canAfford = config.cost.every(c =>
                (state.resources[c.resourceId]?.current || 0) >= c.amount
            );
            if (!canAfford) {
                return { ...state, log: [makeLog(`Cannot afford ${config.name}`, 'other'), ...state.log].slice(0, 20) };
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
                log: [makeLog(`Purchased ${config.name}`, 'unlock'), ...state.log].slice(0, 20)
            };
        }

        case "TOGGLE_CONVERTER": {
            const config = CONVERTERS.find(c => c.id === action.converterId);
            if (!config) return state;

            const converterState = state.converters[action.converterId];
            if (!converterState.owned) {
                return { ...state, log: [makeLog(`Don't own ${config.name}`, 'other'), ...state.log].slice(0, 20) };
            }

            if (!config.canBeToggled) {
                return { ...state, log: [makeLog(`${config.name} cannot be toggled`, 'other'), ...state.log].slice(0, 20) };
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
                log: [makeLog(`${config.name} ${!converterState.active ? 'activated' : 'deactivated'}`, 'other'), ...state.log].slice(0, 20)
            };
        }

        case "TRIGGER_ACTION": {
            const config = ACTIONS.find(a => a.id === action.actionId);
            if (!config) return state;

            const actionState = state.actions[action.actionId];

            if (config.maxExecutions && actionState.executions >= config.maxExecutions) {
                return { ...state, log: [makeLog(`${config.name} limit reached.`, 'other'), ...state.log].slice(0, 20) };
            }

            const effectiveCooldown = config.cooldownMs ?? 200;
            if (actionState.lastUsed) {
                const elapsed = Date.now() - actionState.lastUsed;
                if (elapsed < effectiveCooldown) {
                    // Silently ignore spam / hold-enter; log only for long cooldowns to avoid log spam
                    if (effectiveCooldown >= 1000) {
                        const remaining = Math.ceil((effectiveCooldown - elapsed) / 1000);
                        return { ...state, log: [makeLog(`${config.name} is on cooldown (${remaining}s).`, 'other'), ...state.log].slice(0, 20) };
                    }
                    return state;
                }
            }

            const canAfford = config.costs.every(c => {
                const costAmount = getScaledCost(c, actionState.executions, 0, 0);
                return (state.resources[c.resourceId]?.current || 0) >= costAmount;
            });
            if (!canAfford) {
                return { ...state, log: [makeLog(`Not enough resources for ${config.name}`, 'other'), ...state.log].slice(0, 20) };
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

            const applyEffectWithYield = (e: Effect) => {
                // Check Probability
                if (e.chance !== undefined && Math.random() > e.chance) return;

                if (e.type === 'add_resource' && e.resourceId) {
                    const current = newResources[e.resourceId].current;
                    const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                    // Use live modifiers (newModifiers + equipment) so a preceding modify_max in the same action is respected (fixes cat 0/1)
                    const liveModifiers = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                    const max = calculateMax(e.resourceId, liveModifiers, rConfig?.baseMax ?? 100);

                    // Use calculateYield with live modifiers
                    const finalAmount = calculateYield(e.amount, config.id, 'action', e.resourceId, liveModifiers);

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
                    } else if (e.type === 'add_passive_gen_per_unit' && e.sourceResourceId && e.targetResourceId) {
                        newModifiers.push({ sourceId: config.name, resourceId: e.targetResourceId, type: 'flat', value: e.amount, property: 'gen_per_unit', sourceResourceId: e.sourceResourceId, targetResourceId: e.targetResourceId });
                    } else if (e.type === 'modify_yield_pct') {
                        newModifiers.push({ sourceId: config.name, taskId: e.taskId, actionId: e.actionId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                    } else if (e.type === 'modify_yield_flat') {
                        newModifiers.push({ sourceId: config.name, taskId: e.taskId, actionId: e.actionId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
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

            // First Completion Effects first so max is available before gains (fixes first-gain clamp for hidden resources)
            if (actionState.executions === 0 && config.firstCompletionEffects) {
                config.firstCompletionEffects.forEach(applyEffectWithYield);
            }

            // Apply Effects
            config.effects.forEach(applyEffectWithYield);

            const newActions = {
                ...state.actions,
                [action.actionId]: { ...actionState, executions: actionState.executions + 1, lastUsed: Date.now() }
            };

            const logMsg = config.logMessage || `Used ${config.name}`;
            const logCat: LogCategory = config.logMessage ? 'flavour' : 'other';

            return {
                ...state,
                resources: newResources,
                actions: newActions,
                modifiers: newModifiers,
                inventory: newInventory,
                log: [makeLog(logMsg, logCat), ...state.log].slice(0, 20),
                maxConcurrentTasks: newMaxTasks
            };
        }

        case "CAST_SPELL": {
            const config = ACTIONS.find(a => a.id === action.actionId);
            if (!config || !config.spellId) return state;
            const spell = getSpellById(config.spellId);
            if (!spell) return state;

            const aState = state.actions[action.actionId];
            if (!aState?.unlocked) return state;

            // Cooldown gate uses the spell's own cooldown; silently ignore while on cooldown
            const effectiveCooldown = spell.baseCooldownMs;
            if (aState.lastUsed) {
                const elapsed = Date.now() - aState.lastUsed;
                if (elapsed < effectiveCooldown) return state;
            }

            // Honor ActionConfig.costs if non-empty (all spell actions currently use [])
            const pendingCosts: { c: Cost; amount: number }[] = [];
            if (config.costs.length > 0) {
                for (const c of config.costs) {
                    const costAmount = getScaledCost(c, aState.executions, 0, 0);
                    if ((state.resources[c.resourceId]?.current || 0) < costAmount) {
                        return { ...state, log: [makeLog(`Not enough resources for ${config.name}`, 'other'), ...state.log].slice(0, 20) };
                    }
                    pendingCosts.push({ c, amount: costAmount });
                }
            }

            const forms = getActiveForms(state.activeFormSelection);
            const costMult = forms.reduce((m, f) => m * f.costMultiplier, 1);
            const effMult = forms.reduce((m, f) => m * f.effectMultiplier, 1);
            const variance = forms.reduce((v, f) => Math.max(v, f.variance ?? 0), 0);

            // Cost: Mana scaled by form multipliers — tier growth handled by upgrade actions
            const manaCost = Math.ceil(spell.baseManaCost * costMult);

            const manaRes = state.resources["mana"];
            if ((manaRes?.current ?? 0) < manaCost) {
                return { ...state, log: [makeLog(`Not enough Mana for ${spell.name}`, 'other'), ...state.log].slice(0, 20) };
            }

            // Failure roll: Focus sufficiency vs spell complexity + form reliability bonuses
            const focusMods = getActiveModifiers(state);
            const focusMax = calculateMax("focus", focusMods, RESOURCES.find(r => r.id === "focus")?.baseMax ?? 0);
            const failChance = computeFailureChance(spell, state.resources["focus"]?.current ?? 0, focusMax, forms);

            const aspectKey: AspectID = (spell.aspectId ?? "ash") as AspectID;
            const aspect = ASPECTS.find(a => a.id === aspectKey);

            const newResources = cloneResources(state.resources);

            // Deduct optional config costs
            pendingCosts.forEach(({ c, amount }) => {
                newResources[c.resourceId].current -= amount;
            });

            const manaState = newResources["mana"];
            if (!manaState) return state;
            manaState.current -= manaCost;

            // Every cast attempt leaves a footprint (Unwitnessed challenge tracking)
            const footprintCounter = state.footprintCounter + 1;

            let newFluency = state.aspectFluency;
            let newFailed = state.failedCastings;
            let logUpdates: LogEntry[] = [...state.log];

            if (Math.random() < failChance) {
                // Failed casting: spent Mana stays spent, but grants residue Motes
                const residue = Math.max(1, Math.floor(spell.baseMotesYield * 0.3));
                const moteMax = calculateMax("motes", focusMods, RESOURCES.find(r => r.id === "motes")?.baseMax ?? 0);
                const moteState = newResources["motes"];
                if (moteState) moteState.current = Math.min(moteState.current + residue, moteMax);
                newFailed = { ...newFailed, [aspectKey]: newFailed[aspectKey] + 1 };
                logUpdates.unshift(makeLog(`${spell.name} fails — ${spell.failureFlavor || aspect?.failureFlavor || ""}`, 'flavour'));
            } else {
                let yieldAmount = spell.baseMotesYield * effMult;
                if (variance > 0) {
                    const roll = Math.random();
                    // Wild variance: 0.4x .. (0.4 + variance*2)x output
                    yieldAmount *= (0.4 + roll * variance * 2);
                }
                const moteMax = calculateMax("motes", focusMods, RESOURCES.find(r => r.id === "motes")?.baseMax ?? 0);
                const moteState = newResources["motes"];
                if (moteState) moteState.current = Math.min(moteState.current + Math.round(yieldAmount), moteMax);
                newFluency = { ...newFluency, [aspectKey]: newFluency[aspectKey] + 1 };
                logUpdates.unshift(makeLog(config.logMessage || `${spell.name} cast cleanly.`, 'flavour'));
            }

            const newActions = {
                ...state.actions,
                [action.actionId]: { ...aState, executions: aState.executions + 1, lastUsed: Date.now() }
            };

            return {
                ...state,
                resources: newResources,
                actions: newActions,
                aspectFluency: newFluency,
                failedCastings: newFailed,
                footprintCounter,
                log: logUpdates.slice(0, 50)
            };
        }

        case "SELECT_FORM": {
            const form = CASTING_FORMS.find(f => f.id === action.formId);
            if (!form || form.axis !== action.axis) return state;
            if (!state.castingFormsUnlocked[form.id]) return state;
            return {
                ...state,
                activeFormSelection: { ...state.activeFormSelection, [action.axis]: action.formId }
            };
        }

        case "TOGGLE_TASK": {
            const tState = state.tasks[action.taskId];
            const config = TASKS.find(t => t.id === action.taskId);
            if (!config) return state;

            // Check maxExecutions limit
            if (config.maxExecutions && (tState.completions || 0) >= config.maxExecutions) {
                return { ...state, log: [makeLog(`${config.name} limit reached.`, 'other'), ...state.log].slice(0, 20) };
            }

            const nowActive = !tState.active;
            const newResources = cloneResources(state.resources);
            let newPaid = tState.paid;

            // Prepare new state objects early
            const newTasks = { ...state.tasks };
            let newActiveTaskIds = [...state.activeTaskIds];
            let logUpdates: LogEntry[] = [...state.log];

            // Check Max Concurrent Tasks (and auto-cancel oldest if needed)
            if (nowActive) {
                if (newActiveTaskIds.length >= state.maxConcurrentTasks) {
                    const oldestId = newActiveTaskIds.shift(); // Remove oldest
                    if (oldestId) {
                        newTasks[oldestId] = { ...newTasks[oldestId], active: false };
                        const oldName = TASKS.find(t => t.id === oldestId)?.name || oldestId;
                        logUpdates.unshift(makeLog(`Stopped ${oldName} to focus on ${config.name}.`, 'other'));
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
                    return { ...state, log: [makeLog(`Cannot start ${config.name}: Insufficient resources for upkeep.`, 'other'), ...state.log].slice(0, 20) };
                }
            }

            // Check Start Costs (Only if not already paid)
            if (nowActive && config.startCosts && !tState.paid) {
                const canAfford = config.startCosts.every(c => {
                    const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                    return (state.resources[c.resourceId]?.current || 0) >= costAmount;
                });
                if (!canAfford) {
                    return { ...state, log: [makeLog(`Cannot afford start costs for ${config.name}`, 'other'), ...state.log].slice(0, 20) };
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

            // Helper for calculating max within tick (uses live modifiers so first-completion bumps are visible immediately)
            const getTickMax = (rid: string) => {
                const r = RESOURCES.find(x => x.id === rid);
                const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                return r ? calculateMax(rid, live, r.baseMax) : 0;
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

                    // Apply Yield Calculation with live modifiers
                    const liveModifiers = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                    amount = calculateYield(amount, taskId, 'task', e.resourceId, liveModifiers);

                    const current = newResources[e.resourceId].current;
                    const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                    const max = calculateMax(e.resourceId, liveModifiers, rConfig?.baseMax ?? 100);
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
                } else if (e.type === 'add_passive_gen_per_unit' && e.sourceResourceId && e.targetResourceId) {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === e.taskId)?.name || "Task", resourceId: e.targetResourceId, type: 'flat', value: e.amount, property: 'gen_per_unit', sourceResourceId: e.sourceResourceId, targetResourceId: e.targetResourceId });
                } else if (e.type === 'modify_yield_pct') {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === (e.taskId || taskId))?.name || "Task", taskId: e.taskId, actionId: e.actionId, type: 'percent', value: e.amount, property: 'yield', resourceId: e.resourceId });
                } else if (e.type === 'modify_yield_flat') {
                    newModifiers.push({ sourceId: TASKS.find(t => t.id === (e.taskId || taskId))?.name || "Task", taskId: e.taskId, actionId: e.actionId, type: 'flat', value: e.amount, property: 'yield', resourceId: e.resourceId });
                } else if (e.type === 'add_item' && e.itemId) {
                    for (let i = 0; i < e.amount; i++) {
                        newInventory.push(e.itemId);
                    }
                    logUpdates.unshift(makeLog(`Obtained: ${ITEMS.find(i => i.id === e.itemId)?.name}`, 'loot'));
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
                        logUpdates.unshift(makeLog(`${config.name} stopped (cannot afford restart cost).`, 'other'));
                        return;
                    }

                    // Pay Start Costs
                    config.startCosts.forEach(c => {
                        const costAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                        newResources[c.resourceId].current -= costAmount;
                    });
                    newTasks[tid] = { ...tState, paid: true };
                    tState = newTasks[tid]; // Update local reference
                }

                // Check Costs (Continuous)
                const canAfford = config.costPerSecond.every(c => {
                    const scaledAmount = getScaledCost(c, 0, tState.level, tState.completions || 0);
                    return (newResources[c.resourceId]?.current || 0) >= (scaledAmount * dtSeconds);
                });

                if (!canAfford) {
                    newTasks[tid] = { ...tState, active: false };
                    newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);
                    logUpdates.unshift(makeLog(`${config.name} stopped (insufficient resources)`, 'other'));

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
                                logUpdates.unshift(makeLog(`Auto-switched to ${restTaskConfig.name} to recover.`, 'other'));
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
                        // Wait until ALL costPerSecond resources are essentially full (99% to avoid floating point + passive drain issues)
                        // Evening Shift was stuck at "Rest" because Time max 12 with insanity drain never hit exactly 11.99
                        const allRecovered = prevConfig.costPerSecond.every(c => {
                            const rState = newResources[c.resourceId];
                            const rConfig = RESOURCES.find(r => r.id === c.resourceId);
                            if (!rState || !rConfig) return true; // Should not happen
                            const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                            const max = calculateMax(c.resourceId, live, rConfig.baseMax);
                            if (max <= 0) return true;
                            return rState.current >= max - 0.5;
                        });

                        if (allRecovered) {
                            // Switch Back!
                            newTasks[tid] = { ...tState, active: false };
                            newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);

                            // Start Previous Task — resume same run, don't re-charge startCosts
                            const prevTaskState = newTasks[newPreviousTaskId];
                            newTasks[newPreviousTaskId] = { ...prevTaskState, active: true, paid: true };
                            newActiveTaskIds.push(newPreviousTaskId);

                            logUpdates.unshift(makeLog(`Resources recovered. Returning to ${prevConfig.name}.`, 'other'));

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
                            logUpdates.unshift(makeLog(`${config.name} completed.`, 'unlock'));
                        }

                        // 1. First Time Effects first so max is available before gains (fixes first-gain clamp)
                        if (completions === 0 && config.firstCompletionEffects) {
                            config.firstCompletionEffects.forEach(e => applyTaskEffect(e, tState.level, tid));
                        }

                        // 2. Completion Effects (Standard)
                        if (config.completionEffects) {
                            config.completionEffects.forEach(e => {
                                applyTaskEffect(e, tState.level, tid);
                            });
                        }

                        // Reset Paid Status for next run
                        newTasks[tid] = { ...tState, progress: 0, paid: false };
                        tState = newTasks[tid];

                        // Check maxExecutions limit
                        if (config.maxExecutions && tState.completions >= config.maxExecutions) {
                            tState.active = false;
                            newActiveTaskIds = newActiveTaskIds.filter(id => id !== tid);
                            logUpdates.unshift(makeLog(`${config.name} max completions reached.`, 'other'));
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
                        if (Math.random() > (e.chance * dtSeconds)) return;
                        // If triggered, grant FULL amount (discrete event)
                        if (e.type === 'add_resource' && e.resourceId) {
                            const current = newResources[e.resourceId].current;
                            const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                            const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                            const max = calculateMax(e.resourceId, live, rConfig?.baseMax ?? 100);
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

                            const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                            amount = calculateYield(amount / dtSeconds, tid, 'task', e.resourceId, live) * dtSeconds;

                            const current = newResources[e.resourceId].current;
                            const rConfig = RESOURCES.find(r => r.id === e.resourceId);
                            const max = calculateMax(e.resourceId, live, rConfig?.baseMax ?? 100);

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
                            logUpdates.unshift(makeLog(`Found item: ${itemName}!`, 'loot'));
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
                        logUpdates.unshift(makeLog(`${config.name} leveled up to ${tState.level}!`, 'unlock'));
                    }
                }
            });

            // 2. Process Sustained Spell Drain (inert until sustained spells exist — Chapter IV)
            let newSustained = state.sustainedSpells;
            if (newSustained.length > 0) {
                const sustainedForms = CASTING_FORMS.filter(f => f.value === "sustained");
                const drainPerSec = sustainedForms.reduce((m, f) => m + (f.continuousDrainPerSecond ?? 0), 0);
                if (drainPerSec > 0) {
                    const totalDrain = drainPerSec * newSustained.length * dtSeconds;
                    if ((newResources["mana"]?.current ?? 0) >= totalDrain) {
                        newResources["mana"].current -= totalDrain;
                        newSustained = newSustained.map(s => ({ ...s }));
                    } else {
                        newSustained = [];
                        logUpdates.unshift(makeLog("Sustained workings gutter out — Mana exhausted.", 'other'));
                    }
                }
            }

            // 3. Process Passive Conversion (Resources generating other resources)
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
                        const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                        const max = calculateMax(gen.targetResourceId, live, targetConfig.baseMax ?? 0);
                        const currentTarget = newResources[gen.targetResourceId].current;
                        newResources[gen.targetResourceId].current = Math.min(currentTarget + delta, max);
                    }

                });
            });



            // 3. Process Modifier-based Passive Generation
            getActiveModifiers({ ...state, modifiers: newModifiers } as GameState).forEach(m => {
                if (m.resourceId && m.property === 'gen' && m.type === 'flat') {
                    const rConfig = RESOURCES.find(r => r.id === m.resourceId);
                    if (rConfig) {
                        const current = newResources[m.resourceId]?.current || 0;
                        const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                        const max = calculateMax(m.resourceId, live, rConfig.baseMax ?? 0);
                        const delta = m.value * dtSeconds;
                        newResources[m.resourceId].current = Math.min(current + delta, max);
                    }
                }
                // 3b. Process gen_per_unit modifiers (generate target per unit of source)
                if (m.property === 'gen_per_unit' && m.sourceResourceId && m.targetResourceId && m.type === 'flat') {
                    const sourceAmount = newResources[m.sourceResourceId]?.current || 0;
                    if (sourceAmount >= 1) {
                        const targetConfig = RESOURCES.find(r => r.id === m.targetResourceId);
                        if (targetConfig) {
                            const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                            const max = calculateMax(m.targetResourceId, live, targetConfig.baseMax ?? 0);
                            const currentTarget = newResources[m.targetResourceId]?.current || 0;
                            // Use full units of source resource
                            const fullUnits = Math.floor(sourceAmount);
                            const delta = fullUnits * m.value * dtSeconds;
                            newResources[m.targetResourceId].current = Math.min(currentTarget + delta, max);
                        }
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
                        const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                        const max = calculateMax(e.resourceId, live, rConfig?.baseMax ?? 100);
                        newResources[e.resourceId].current = Math.min(current + (e.amount * dtSeconds), max);
                    }
                });
            });

            // Cap resources at 0 and enforce max limits (use live max)
            Object.keys(newResources).forEach(rid => {
                if (newResources[rid].current < 0) newResources[rid].current = 0;

                // If max is 0, set current to 0 as well
                const rConfig = RESOURCES.find(r => r.id === rid);
                if (rConfig) {
                    const live = getActiveModifiers({ ...state, modifiers: newModifiers } as GameState);
                    const max = calculateMax(rid, live, rConfig.baseMax);
                    if (max <= 0) {
                        newResources[rid].current = 0;
                    } else if (newResources[rid].current > max) {
                        newResources[rid].current = max;
                    }
                }
            });

            // --- 4. Process Unlocks (Latch Mechanism) ---

            const checkPrereqsInternal = (pList?: Prerequisite[]) =>
                checkPrereqsList(pList, { resources: newResources, actions: newActions, tasks: newTasks, getMax: getTickMax });

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
                maxConcurrentTasks: newMaxTasks,
                restTaskId: newRestTaskId,
                previousTaskId: newPreviousTaskId,
                sustainedSpells: newSustained
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
    const addLog = (msg: string, category?: LogCategory) => dispatch({ type: "ADD_LOG", msg, category });
    const setRestTask = (taskId: string | null) => dispatch({ type: "SET_REST_TASK", taskId });
    const castSpell = (actionId: ActionID) => dispatch({ type: "CAST_SPELL", actionId });
    const selectForm = (axis: 'method' | 'duration' | 'target', formId: string | null) => {
        if (!formId) return;
        dispatch({ type: "SELECT_FORM", axis, formId });
    };

    const activeModifiers = getActiveModifiers(state);

    const checkPrerequisites = (prereqs?: Prerequisite[]) =>
        checkPrereqsList(prereqs, {
            resources: state.resources,
            actions: state.actions,
            tasks: state.tasks,
            getMax: (rid) => {
                const rConfig = RESOURCES.find(r => r.id === rid);
                return calculateMax(rid, activeModifiers, rConfig?.baseMax ?? 0);
            }
        });

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

    const getFailureChance = (spellId: string): number => {
        const spell = getSpellById(spellId);
        if (!spell) return 0;
        const forms = getActiveForms(state.activeFormSelection);
        const focusMax = getMaxResource("focus");
        return computeFailureChance(spell, state.resources["focus"]?.current ?? 0, focusMax, forms);
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

            // Only continuous costs - use scaled cost like TICK does
            task.costPerSecond.forEach(c => {
                if (c.resourceId === resourceId) {
                    const exponent = c.scalesByCompletion ? (tState.completions || 0) : (tState.level - 1);
                    let scaledAmount = c.amount;
                    if (c.scaleFactor) {
                        switch (c.scaleType) {
                            case 'fixed':
                                scaledAmount = c.amount + (c.scaleFactor * exponent);
                                break;
                            case 'percentage':
                                scaledAmount = c.amount * (1 + c.scaleFactor * exponent);
                                break;
                            case 'exponential':
                            default:
                                scaledAmount = c.amount * Math.pow(c.scaleFactor, exponent);
                                break;
                        }
                    }
                    rates.push({ source: task.name, amount: -scaledAmount });
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

        // Passive Modifier Rates (gen_per_unit - generate target per unit of source)
        activeModifiers.forEach(m => {
            if (m.property === 'gen_per_unit' && m.targetResourceId === resourceId && m.sourceResourceId && m.type === 'flat') {
                const sourceAmount = state.resources[m.sourceResourceId]?.current || 0;
                if (sourceAmount >= 1) {
                    const sourceConfig = RESOURCES.find(r => r.id === m.sourceResourceId);
                    const fullUnits = Math.floor(sourceAmount);
                    rates.push({
                        source: `${m.sourceId} (${sourceConfig?.name || m.sourceResourceId}: ${fullUnits} × ${m.value}/s)`,
                        amount: fullUnits * m.value
                    });
                }
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
                const needed = c.amount * TICK_RATE_SECONDS; // ~100ms tick
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

        const filteredRates = rates.filter(r => r.amount !== 0);
        const totalRate = filteredRates.reduce((sum, r) => sum + r.amount, 0);
        // Hide zero-rate entries entirely; if all cancel to 0, filteredRates may be non-empty but totalRate 0 is still valid
        // Only omit truly zero-amount sources, keep counteracting ± rates
        return { maxModifiers, rates: filteredRates, totalRate };
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
                castSpell,
                selectForm,
                getFailureChance,
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
