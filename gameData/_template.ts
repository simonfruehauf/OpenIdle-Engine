/**
 * gameData/_template.ts - Starter module for new content packs.
 *
 * 1. Copy this file to e.g. `gameData/myPack.ts` (or `gameData/packs/myPack.ts`).
 * 2. Fill in the arrays. Delete the examples you don't need.
 * 3. Register the module in `gameData/index.ts`:
 *
 *    import * as MyPackModule from './myPack';
 *    const modules = [ ..., MyPackModule ];
 *
 * 4. Validate: every resourceId / category / taskId / actionId / itemId / slot you
 *    reference must exist (own file or another module). Run `npm run build` and check
 *    in dev that cards appear / hide per prerequisites, costs scale, and tooltips render.
 *
 * See GAMEDATA_GUIDE.md + docs/ENGINE_API.md for full reference.
 * Types are in ../types.ts.
 */

import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig, SlotConfig, ConverterConfig } from "../types";

// --- Categories (UI groups) ---
export const CATEGORIES: CategoryConfig[] = [
  // { id: "my_pack", name: "My Pack" },
];

// --- Resources ---
export const RESOURCES: ResourceConfig[] = [
  // Example: hidden resource that unlocks later via an action
  // {
  //   id: "arcane_dust",
  //   name: "Arcane Dust",
  //   type: "basic",
  //   category: "my_pack",
  //   baseMax: 0, // hidden until an effect raises capacity
  //   description: "Glitters only to those who know where to look.",
  // },

  // Example: stat bar
  // {
  //   id: "focus",
  //   name: "Focus",
  //   type: "stat",
  //   baseMax: 20,
  //   initialAmount: 20,
  //   color: "bg-purple-500",
  //   description: "Spend it to concentrate on hard tasks.",
  // },
];

// --- Tasks (loops or timed completions) ---
export const TASKS: TaskConfig[] = [
  // Example: infinite loop filling a hidden resource via yield
  // {
  //   id: "sift_dust",
  //   name: "Sift Dust",
  //   description: "Kneel and sift the floor for motes of power.",
  //   category: "my_pack",
  //   type: "normal",
  //   costPerSecond: [{ resourceId: "focus", amount: 0.5 }],
  //   effectsPerSecond: [{ type: "add_resource", resourceId: "arcane_dust", amount: 0.1 }],
  //   xpPerSecond: 5,
  //   prerequisites: [{ resourceId: "arcane_dust", minMax: 1 }], // visible only after dust is unlocked
  // },

  // Example: timed, auto-restarting task with start cost and completion reward
  // {
  //   id: "brew_tonic",
  //   name: "Brew Tonic",
  //   description: "A slow simmer that eventually pays off.",
  //   category: "my_pack",
  //   progressRequired: 10,   // seconds to complete
  //   autoRestart: true,       // loop automatically
  //   costPerSecond: [{ resourceId: "arcane_dust", amount: 0.2 }],
  //   effectsPerSecond: [],
  //   startCosts: [{ resourceId: "arcane_dust", amount: 5 }],
  //   completionEffects: [{ type: "add_resource", resourceId: "focus", amount: 5 }],
  //   firstCompletionEffects: [{ type: "add_item", itemId: "alchemist_gloves", amount: 1 }],
  //   prerequisites: [{ actionId: "unlock_alchemy", minExecutions: 1 }],
  // },
];

// --- Actions (instant purchases / branching choices) ---
export const ACTIONS: ActionConfig[] = [
  // Example: reveal a hidden resource
  // {
  //   id: "unlock_alchemy",
  //   name: "Unseal the Alembic",
  //   description: "Unlock the ability to work with arcane dust.",
  //   category: "my_pack",
  //   costs: [{ resourceId: "money", amount: 50 }],
  //   effects: [{ type: "modify_max_resource_flat", resourceId: "arcane_dust", amount: 100 }],
  //   prerequisites: [{ resourceId: "money", minAmount: 50 }],
  //   maxExecutions: 1,
  //   logMessage: "The glass hums as dust swirls inside.",
  // },

  // Example: branching choice via exclusiveWith
  // {
  //   id: "path_fire",
  //   name: "Embrace Fire",
  //   description: "Lean into volatile power.",
  //   category: "my_pack",
  //   costs: [],
  //   effects: [{ type: "modify_yield_pct", taskId: "brew_tonic", amount: 0.5 }],
  //   maxExecutions: 1,
  //   exclusiveWith: ["path_ice"],
  //   prerequisites: [{ actionId: "unlock_alchemy", minExecutions: 1 }],
  // },
  // {
  //   id: "path_ice",
  //   name: "Embrace Ice",
  //   description: "Prefer careful preservation.",
  //   category: "my_pack",
  //   costs: [],
  //   effects: [{ type: "modify_yield_pct", taskId: "sift_dust", amount: 0.5 }],
  //   maxExecutions: 1,
  //   exclusiveWith: ["path_fire"],
  //   prerequisites: [{ actionId: "unlock_alchemy", minExecutions: 1 }],
  // },
];

// --- Slots & Items (equipment) ---
export const SLOTS: SlotConfig[] = [
  // { id: "gloves", name: "Gloves" },
];

export const ITEMS: ItemConfig[] = [
  // {
  //   id: "alchemist_gloves",
  //   name: "Alchemist Gloves",
  //   description: "Slightly boosts dust sifting.",
  //   slot: "gloves",
  //   effects: [{ type: "modify_yield_pct", taskId: "sift_dust", amount: 0.2 }],
  // },
];

// --- Converters (auto-transformers) ---
export const CONVERTERS: ConverterConfig[] = [
  // {
  //   id: "dust_mill",
  //   name: "Dust Mill",
  //   description: "Grinds dust into focus while running.",
  //   cost: [{ resourceId: "arcane_dust", amount: 100 }],
  //   canBeToggled: true,
  //   costPerSecond: [{ resourceId: "arcane_dust", amount: 1 }],
  //   effectsPerSecond: [{ type: "add_resource", resourceId: "focus", amount: 0.5 }],
  //   prerequisites: [{ actionId: "unlock_alchemy", minExecutions: 1 }],
  // },
];
