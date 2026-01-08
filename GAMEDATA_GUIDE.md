# OpenIdle Engine - Game Data Guide

Everything you need to create content for the OpenIdle Engine. All game data lives in `gameData/` as TypeScript files exporting typed arrays.

---

## File Structure

Data is organized into modules. Each module exports some subset of: `RESOURCES`, `TASKS`, `ACTIONS`, `CATEGORIES`, `ITEMS`, `SLOTS`, and `CONVERTERS`.

To add content:
1. Create a new `.ts` file in `gameData/` (e.g., `necromancy.ts`).
2. Export your arrays, typed against interfaces in `types.ts`.
3. Import your file in `gameData/index.ts` and add it to the `modules` array.

You can organize files however you want—by theme (`pirates.ts`), by type (`resources.ts`), or in subfolders (`gameData/quests/`) as long as they are imported in `gameData/index.ts`.

---

## Core Types

### Categories

Visual groupings for the UI. Tasks and Actions reference these by ID.

```typescript
interface CategoryConfig {
  id: string;   // e.g. "survival" or "upgrades"
  name: string; // e.g. "Chapter One: Survival" or "Upgrades"
}
```

### Resources

Currencies, stats, and hidden progression flags.

```typescript
interface ResourceConfig {
  id: string;
  name: string;
  type: 'basic' | 'stat';  // 'basic' = text display, 'stat' = progress bar on the right of the screen
  category?: string;       // UI grouping
  baseMax: number;         // Starting capacity, if 0 it will be hidden
  initialAmount?: number;  // Starting value (default: 0)
  color?: string;          // Tailwind class for **stat bars** (e.g. "bg-red-500"), 
  // can also be more complex, e.g. for a "Peppermint stick stripe" effect:
  // color: "bg-[repeating-linear-gradient(45deg,_#10b981_0px,_#10b981_10px,_#ffffff_10px,_#ffffff_20px)]"
  description?: string;    // Tooltip text

  // Passive generation: each unit of this resource generates ratePerUnit of targetResourceId/sec
  passiveGen?: {
    targetResourceId: string;
    ratePerUnit: number;
  };
}
```

### Tasks

Time-based activities. Can be infinite loops, finite projects, or repeating timed tasks.

```typescript
interface TaskConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  
  type?: 'normal' | 'rest';  // 'rest' = appears in fallback dropdown
  
  // Per-second costs/gains while running
  costPerSecond: Cost[];
  effectsPerSecond: Effect[];
  
  xpPerSecond?: number;  // Level up threshold = Level × 100 XP
  drops?: { itemId: string; chancePerSecond: number }[];  // Random loot (0-1)

  // Progress bar mode (set progressRequired to enable)
  startCosts?: Cost[];        // One-time cost when starting
  progressRequired?: number;  // Seconds to complete
  autoRestart?: boolean;      // Loop automatically? (default: false)
  
  completionEffects?: Effect[];       // Rewards on each completion
  firstCompletionEffects?: Effect[];  // Bonus for first completion only
  maxExecutions?: number;             // Limit total completions

  prerequisites?: Prerequisite[];
  locks?: string[];           // IDs to hide/disable when this task is available
  lockDescription?: string;   // Tooltip explaining the lock
  hideWhenComplete?: boolean; // Hide after maxExecutions reached
}
```

### Actions

Instant buttons for purchases, upgrades, and crafting.

```typescript
interface ActionConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  
  costs: Cost[];
  effects: Effect[];
  firstCompletionEffects?: Effect[];  // First purchase bonus
  
  maxExecutions?: number;   // Purchase limit
  prerequisites?: Prerequisite[];
  
  exclusiveWith?: string[]; // Locks these action IDs when purchased
  locks?: string[];         // Hides these IDs entirely
  lockDescription?: string;
  hideWhenComplete?: boolean;
  
  logMessage?: string;  // Custom log entry (e.g. "You learned a new skill.")
}
```

### Equipment

Items you can equip into slots for passive bonuses.

**Slots:**

```typescript
interface SlotConfig {
  id: string;   // e.g. "head", "hand_r"
  name: string;
  prerequisites?: Prerequisite[];  // Unlock conditions (e.g. mutation)
}
```

**Items:**

```typescript
interface ItemConfig {
  id: string;
  name: string;
  description: string;
  slot: string;      // Must match a slot ID
  effects: Effect[]; // Passive bonuses while equipped
}
```

### Converters

Background processes that transform resources automatically.

```typescript
interface ConverterConfig {
  id: string;
  name: string;
  description: string;
  cost: Cost[];               // One-time purchase price
  canBeToggled: boolean;      // false = always active when owned
  effectsPerSecond: Effect[]; // Production
  costPerSecond: Cost[];      // Consumption
  prerequisites?: Prerequisite[];
}
```

---

## Mechanics

### Costs & Scaling

```typescript
interface Cost {
  resourceId: string;
  amount: number;
  
  scaleFactor?: number;  // Growth rate
  scaleType?: 'fixed' | 'percentage' | 'exponential';
  // 'fixed':       cost = amount + (scaleFactor × exponent)
  // 'percentage':  cost = amount × (1 + scaleFactor × exponent)
  // 'exponential': cost = amount × (scaleFactor ^ exponent)  [default]
  
  scalesByCompletion?: boolean;  // Tasks only: scale by completions instead of level
}
```

For Tasks, the exponent defaults to `level - 1`. For Actions, it's `executions`.

### Prerequisites

Control when things become visible and usable.

```typescript
interface Prerequisite {
  // Resource conditions
  resourceId?: string;
  minAmount?: number;  // current >= X
  maxAmount?: number;  // current <= X
  minMax?: number;     // capacity >= X (useful for "is unlocked?" checks)
  
  // Action conditions
  actionId?: string;
  minExecutions?: number;  // default: 1
  
  // Task conditions
  taskId?: string;
  minLevel?: number;  // default: 1
}
```

**Note:** If any prerequisite references a hidden resource (capacity = 0), the item stays hidden until that resource is unlocked.

### Effects

| Type | Target Property | Description |
|------|-----------------|-------------|
| `add_resource` | `resourceId` | Add/subtract amounts. Scales with task level. |
| `modify_max_resource_flat` | `resourceId` | Increase capacity by a flat amount. |
| `modify_max_resource_pct` | `resourceId` | Multiply capacity by (1 + amount). |
| `set_max_resource` | `resourceId` | Set max capacity to a fixed value. Overrides baseMax but stacks with flat/pct modifiers. |
| `reset_resource_modifiers` | `resourceId` | Removes all persistent modifiers for this resource (flat, pct, set). Does not affect equipment bonuses. |
| `modify_yield_pct` | `taskId` / `actionId` / `resourceId` | Multiply output by (1 + amount). Can target specific resources. |
| `modify_yield_flat` | `taskId` / `actionId` / `resourceId` | Add flat bonus to output. Can target specific resources. |
| `modify_passive_gen` | `resourceId` | Add permanent passive generation per second. |
| `increase_max_tasks` | — | Raise concurrent task limit by `amount`. |
| `increase_max_executions` | `taskId` / `actionId` | Raise execution cap. |
| `add_item` | `itemId` | Grant an item to inventory. |

**Effect properties:**
```typescript
interface Effect {
  type: string;
  amount: number;
  
  // Targeting (depends on effect type)
  resourceId?: string;
  taskId?: string;
  actionId?: string;
  itemId?: string;
  
  // Scaling
  scaleFactor?: number;
  scaleType?: 'fixed' | 'percentage' | 'exponential';
  
  chance?: number;   // 0-1, probability to trigger (default: 1)
  hidden?: boolean;  // true = applied but not shown in tooltips
}
```

### The "Hidden Resource" Pattern

Use `baseMax: 0` to hide a resource until the player unlocks it:

1. Define the resource with `baseMax: 0` — invisible and can't hold anything.
2. Create an action that applies `modify_max_resource_flat` to increase capacity.
3. When purchased, the resource appears and becomes usable.

This is great for hiding spoilers and gating progression.

---

## Example: Simple Necromancy Module

```typescript
// gameData/necromancy.ts
import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig } from "../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "graveyard", name: "The Graveyard" }
];

export const RESOURCES: ResourceConfig[] = [
  { id: "bones", name: "Bones", type: "basic", baseMax: 50 },
  { id: "mana", name: "Mana", type: "stat", baseMax: 0, color: "bg-purple-600" }
];

export const TASKS: TaskConfig[] = [
  {
    id: "dig_grave",
    name: "Dig Grave",
    description: "Disturb the earth.",
    category: "graveyard",
    type: "rest",
    costPerSecond: [],
    effectsPerSecond: [{ type: "add_resource", resourceId: "bones", amount: 1 }],
    xpPerSecond: 5
  },
  {
    id: "study_corpse",
    name: "Study Corpse",
    description: "Examine the remains for arcane secrets.",
    category: "graveyard",
    startCosts: [{ resourceId: "bones", amount: 5 }],
    progressRequired: 10,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "mana", amount: 10 }],
    firstCompletionEffects: [{ type: "add_item", itemId: "bone_saw", amount: 1 }],
    prerequisites: [{ resourceId: "mana", minMax: 1 }]
  }
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "unlock_magic",
    name: "Learn Necromancy",
    description: "Open yourself to the dark arts.",
    category: "graveyard",
    costs: [{ resourceId: "bones", amount: 10 }],
    effects: [{ type: "modify_max_resource_flat", resourceId: "mana", amount: 20 }],
    firstCompletionEffects: [{ type: "add_resource", resourceId: "mana", amount: 20 }],
    maxExecutions: 1,
    logMessage: "The purple glow of mana fills your vision."
  }
];
```

Then register it in `gameData/index.ts`:
```typescript
import * as NecromancyModule from './necromancy';

const modules = [
  // ... existing modules
  NecromancyModule
];
```

---

## Tips

- **Test incrementally.** Add one thing, reload, verify. Much easier to debug.
- **Use `prerequisites` liberally.** They're the main tool for pacing progression.
- **Hidden effects** (`hidden: true`) are great for internal bookkeeping without cluttering tooltips.
