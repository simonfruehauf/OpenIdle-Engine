
# OpenIdle Engine - Game Data Guide

This document explains how to create content for the OpenIdle Engine. It details the data structures defined in `types.ts` and how to use them to create Resources, Tasks, Actions, Items, and progression systems.

## 1. File Structure & Modularity

The engine uses a modular system. Data is split into logical files (e.g., `christmas.ts`, `necromancy.ts`) or categorized files (`resources.ts`, `tasks.ts`). You can also organize files into subfolders (e.g., `gameData/questlines/`).

To add new content:

1. Create a `.ts` file in the `gameData/` folder (or a subfolder).
2. Export arrays named `RESOURCES`, `TASKS`, `ACTIONS`, `CATEGORIES`, `ITEMS`, and `SLOTS`.
3. Import your file in `gameData/index.ts` and add it to the `modules` array.

## 2. Core Concepts & Types

### A. Categories

Visual headers used to group Tasks and Actions in the main UI.

```typescript
interface CategoryConfig {
  id: string;   // Unique ID (e.g., "survival")
  name: string; // Display Name (e.g., "I: Survival")
}
```

### B. Resources

Currencies, Stats, or Hidden Flags.

```typescript
interface ResourceConfig {
  id: string;
  name: string;
  type: 'basic' | 'stat'; 
  // 'basic': Text-based (e.g., Gold: 10/100). Left Column.
  // 'stat': Progress Bar (e.g., Health). Right Column.
  category?: string;      // Grouping ID for the UI sidebar.
  baseMax: number;        // Starting cap.
  initialAmount?: number; // Starting value (default 0).
  color?: string;         // Tailwind class for 'stat' bars (e.g., "bg-red-500").
  description?: string;   // Tooltip description.
  
  // Passive generation logic. 
  // E.g., each 1 unit of this resource generates 0.1 of target per second.
  passiveGen?: {
      targetResourceId: string;
      ratePerUnit: number;
  }[];
}
```

### C. Tasks (Loops & Progress)

Activities that take time. They can be infinite loops (grinding), timed loops (gathering), or finite projects (research).

```typescript
interface TaskConfig {
  id: string;
  name: string;
  description: string;
  category: string; // Must match a Category ID
  
  // 'rest' tasks appear in the fallback dropdown. 
  // The game auto-switches to the selected rest task if the main task fails costs.
  // Mechanic: "Auto-Return": If the game switched to a Rest task due to lack of resources,
  // it will automatically switch BACK to the original task once resources recover (> 90% of max).
  type?: 'normal' | 'rest'; 

  // Costs deducted per second. If cant afford, task stops (or switches to Rest).
  costPerSecond: { 
    resourceId: string; 
    amount: number; 
    scaleFactor?: number; // NOT IMPLEMENTED. Costs are currently flat.
  }[];
  
  // Resources gained per second.
  effectsPerSecond: Effect[]; 
  
  // Random item drops
  drops?: { 
    itemId: string; 
    chancePerSecond: number; // 0.0 to 1.0 (e.g., 0.01 = 1%)
  }[];

  xpPerSecond?: number; // Defaults to 0. Level Up = Level * 100 XP.

  // --- Progress Bar Logic ---
  // If progressRequired is set, the task acts like a progress bar.
  startCosts?: Cost[];       // One-time cost paid when starting the progress bar.
  progressRequired?: number; // Duration in seconds to finish one cycle.
  
  // If true, the task restarts automatically after filling the bar (Looping).
  // If false/undefined, the task stops after one completion (One-shot/Crafting).
  autoRestart?: boolean; 
  
  completionEffects?: Effect[];      // Rewards given when progress reaches 100%.
  firstCompletionEffects?: Effect[]; // Rewards given ONLY the first time it is finished.

  prerequisites?: Prerequisite[];
}
```

### D. Actions (One-Shots & Upgrades)
Buttons clicked once. Used for buying upgrades, unlocking features, or crafting.

```typescript
interface ActionConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  
  costs: Cost[];
  effects: Effect[]; // Effects applied EVERY time the action is used.
  firstCompletionEffects?: Effect[]; // Effects applied ONLY the first time the action is used.
  
  maxExecutions?: number; // Limit purchases (e.g., 1 for unlocks).
  cooldownMs?: number;    // Optional cooldown in milliseconds. CURRENTLY NOT IMPLEMENTED
  
  prerequisites?: Prerequisite[];
  
  // If set, buying this locks the listed IDs (Action or Task) permanently.
  // Useful for branching paths (Class A vs Class B).
  exclusiveWith?: ActionID[]; 
  locks?: string[]; // Explicitly hides/disables these IDs.

  logMessage?: string; // Custom text for the game log (e.g. "You tidied up.").
}
```

### E. Equipment (Items & Slots)

Passive buffs provided by items equipped into slots.

**Slots:**

```typescript
interface SlotConfig {
  id: string;   // e.g., "head", "hand_r"
  name: string;
  // Slots can be hidden until requirements are met (e.g., Mutation: Extra Arm)
  prerequisites?: Prerequisite[]; 
}
```

**Items:**

```typescript
interface ItemConfig {
  id: string;
  name: string;
  description: string;
  slot: string; // Must match a Slot ID
  effects: Effect[]; // Passive buffs while equipped
}
```

## 3. Logic & Mechanics

### Costs & Scaling

```typescript
interface Cost {
  resourceId: string;
  amount: number;
  // If defined, cost = amount * (scaleFactor ^ currentLevelOrExecutions)
  // For Tasks, defaults to scaling by (Level - 1).
  // For Actions, scales by Executions.
  scaleFactor?: number; 
  
  // If true (for Tasks only), scaling uses (Completions) instead of (Level - 1).
  scalesByCompletion?: boolean;

  // Defines how scaleFactor is applied.
  // 'fixed': cost = amount + (scaleFactor * exponent) (linear additive growth)
  // 'percentage': cost = amount * (1 + scaleFactor * exponent) (linear percentage growth)
  // 'exponential': cost = amount * (scaleFactor ^ exponent) (exponential growth, default if scaleType is not provided but scaleFactor is)
  // 'tiered': behaves like 'exponential' for now, intended for future more complex step-based scaling
  scaleType?: 'fixed' | 'percentage' | 'exponential' | 'tiered';
}
```

### The "Unlock Pattern" (baseMax: 0)

If you want a resource to be "hidden" until discovered:

1. Set `baseMax: 0` in `resources.ts`.
   * *Effect:* The resource is invisible and cannot be gained (capacity is 0).
2. Create an Action (e.g., "Buy Notebook") with an effect: `modify_max_resource_flat` +10.
3. When the user buys the action, Max Cap becomes 10. The resource appears and can now be collected.

### Prerequisites

Controls visibility and usability.
*Important:* If an item requires a resource that is currently Hidden (Max <= 0), the item itself will also be hidden.

```typescript
interface Prerequisite {
  resourceId?: string;
  minAmount?: number; // Requires current amount >= X
  minMax?: number;    // Requires Max Cap >= X (Great for checking if a resource is unlocked)
  
  actionId?: string;  // Requires Action to be executed at least once (or X times)
  minExecutions?: number; // (Optional) Default 1.
  
  taskId?: string; // Requires Task to be at least Level X
  minLevel?: number; // (Optional) Default 1.
}
```

### Effects

| Type | Target | Description |
| :--- | :--- | :--- |
| `add_resource` | `resourceId` | Adds currency. Affected by `scaleFactor` in Tasks. |
| `modify_max_resource_flat` | `resourceId` | Increases Resource Cap. |
| `modify_max_resource_pct` | `resourceId` | Multiplies Resource Cap (1 + Pct). |
| `modify_task_yield_pct` | `taskId` | Multiplies output of a specific task. |
| `modify_passive_gen` | `resourceId` | Adds permanent passive generation per second. |
| `increase_max_tasks` | None (uses `amount`) | Increases the global limit of concurrent tasks. |
| `add_item` | `itemId` | Adds item to inventory. |

**Effect Properties:**

```typescript
interface Effect {
  type: string;
  amount: number;
  scaleFactor?: number; // For levels/upgrades.
  chance?: number;      // 0.0 - 1.0. Probability this effect triggers.
  hidden?: boolean;     // If true, effect is applied but not shown in the tooltip.
}
```

---

## 4. Example: "The Necromancer"

```typescript
// categories.ts
export const CATEGORIES = [{ id: "graveyard", name: "The Graveyard" }];

// resources.ts
export const RESOURCES = [
  { id: "bones", name: "Bones", type: "basic", baseMax: 50 },
  { id: "mana", name: "Mana", type: "stat", baseMax: 0, color: "bg-purple-600" } // Hidden start
];

// tasks.ts
export const TASKS = [
  {
    id: "dig_grave",
    name: "Dig Grave",
    description: "Disturb the earth.",
    category: "graveyard",
    type: "rest", // Can be auto-selected
    costPerSecond: [],
    effectsPerSecond: [{ type: "add_resource", resourceId: "bones", amount: 1 }],
    xpPerSecond: 5
  },
  {
    id: "study_corpse",
    name: "Study Corpse",
    category: "graveyard",
    startCosts: [{ resourceId: "bones", amount: 5 }], // One time cost
    progressRequired: 10, // Takes 10 seconds to complete one cycle
    autoRestart: true,    // Repeats automatically
    costPerSecond: [],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "mana", amount: 10 }],
    firstCompletionEffects: [{ type: "add_item", itemId: "bone_saw", amount: 1 }]
  }
];

// actions.ts
export const ACTIONS = [
  {
    id: "unlock_magic",
    name: "Learn Necromancy",
    description: "Unlock Mana.",
    category: "graveyard",
    costs: [{ resourceId: "bones", amount: 10 }], 
    effects: [{ type: "modify_max_resource_flat", resourceId: "mana", amount: 20 }],
    firstCompletionEffects: [{ type: "add_resource", resourceId: "mana", amount: 20 }], // Bonus mana on first unlock
    maxExecutions: 1,
    logMessage: "The purple glow of mana fills your vision."
  }
];
```
