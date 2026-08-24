# Early Game Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand early game with 3 parallel job paths, 3 side-branches, and loot drops across new and existing tasks.

**Architecture:** Data-driven content via `gameData/` modules. No `types.ts` changes. Each job/branch is a self-contained file exporting `CATEGORIES`, `RESOURCES`, `TASKS`, `ACTIONS`, `ITEMS`, `CONVERTERS`, `SLOTS` as applicable, aggregated by `gameData/index.ts:19`.

**Tech Stack:** TypeScript, React, Vite, Tailwind CSS 4, existing engine reducer (`context/GameContext.tsx:171`).

## Global Constraints

- No `types.ts` changes — all effect types, `TaskDrop`, `Prerequisite` fields already exist.
- Additive only — do not delete/rename existing IDs; only add `drops` arrays to existing tasks in `gameData/tasks.ts` (new field, optional).
- All new IDs `snake_case`, unique across `gameData/` — validate via `Select-String` grep.
- Every referenced `resourceId`/`category`/`taskId`/`actionId`/`itemId`/`slotId` must be defined.
- `baseMax: 0` resources require `modify_max_resource_flat/pct/set` unlock path.
- `npm run build` must pass after every task.

---

## File Structure

```
gameData/
  categories.ts                 # MODIFY: add 7 categories
  tasks.ts                      # MODIFY: add drops: TaskDrop[] to 5 tasks
  scavenging.ts                 # CREATE: 3 tasks + 13 items + scavenging resources? (items only here)
  jobs/
    libraryAssistant.ts         # CREATE
    barista.ts                  # CREATE
    communityGarden.ts          # CREATE
  sideBranches/
    subwayTunnels.ts            # CREATE
    rooftopGarden.ts            # CREATE
    fightingRing.ts             # CREATE
  index.ts                      # MODIFY: import + modules.push for 7 new modules
```

Each new module file exports typed arrays; no cross-module imports. Resources defined alongside their branch (e.g., `produce` in `communityGarden.ts`). Shared scavenging loot items live in `scavenging.ts`.

---

### Task 1: Categories + Foundation Resources

**Files:**
- Modify: `gameData/categories.ts`
- Modify: `gameData/index.ts` (no new imports yet, just verify pattern)
- Test: `npm run build`

**Interfaces:**
- Consumes: `CategoryConfig` from `types.ts:144`
- Produces: 7 new `CategoryConfig.id` values used by Tasks 2-8

- [ ] **Step 1: Add 7 categories to `gameData/categories.ts`**

Replace file content:

```typescript
import { CategoryConfig } from "../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "basic", name: "Basic" },
  { id: "starting", name: "Starting Out" },
  { id: "upgrades", name: "Upgrades" },
  { id: "oddness", name: "Oddness" },
  { id: "strange", name: "Strange" },
  { id: "library_job", name: "Library Assistant" },
  { id: "cafe", name: "Cafe Work" },
  { id: "garden", name: "Community Garden" },
  { id: "tunnels", name: "Abandoned Tunnels" },
  { id: "rooftop", name: "Rooftop Garden" },
  { id: "fighting", name: "Fighting Ring" },
  { id: "scavenging", name: "Scavenging" },
];
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: PASS (no type errors)

- [ ] **Step 3: Commit**

```bash
git add gameData/categories.ts
git commit -m "feat: add categories for early game expansion"
```

---

### Task 2: Library Assistant Job

**Files:**
- Create: `gameData/jobs/libraryAssistant.ts`
- Modify: `gameData/index.ts:3-32` — add import + module entry
- Test: `npm run build` + manual QA: `library_find` → lore 5 → new tasks visible

**Interfaces:**
- Consumes: Category `library_job` (Task 1), resources `quiet`, `lore`, `insight`, `mana` (existing)
- Produces: Task IDs `lib_job_shelve`, `lib_job_catalog`, `lib_job_research`; Action IDs `lib_job_head_start`, `lib_job_archive`; Items `archivist_glasses`, `library_cardigan`, `cataloging_folio`

- [ ] **Step 1: Create `gameData/jobs/libraryAssistant.ts`**

```typescript
import { CategoryConfig, TaskConfig, ActionConfig, ItemConfig } from "../../types";

// Library Assistant — parallel job, independent of other jobs
// Unlocks after library_find + lore 5

export const TASKS: TaskConfig[] = [
  {
    id: "lib_job_shelve",
    name: "Shelve Returns",
    description: "You push the cart. Spines out, aligned, quiet work that teaches you where everything lives.",
    category: "library_job",
    progressRequired: 8,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "quiet", amount: 1.2 },
      { type: "add_resource", resourceId: "lore", amount: 0.6 }
    ],
    prerequisites: [{ actionId: "library_find", minExecutions: 1 }],
    xpPerSecond: 4,
  },
  {
    id: "lib_job_catalog",
    name: "Catalog New Acquisitions",
    description: "You transcribe titles, subjects, and the occasional marginal note someone tried to erase.",
    category: "library_job",
    progressRequired: 18,
    autoRestart: true,
    startCosts: [{ resourceId: "quiet", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 0.3 },
      { type: "add_resource", resourceId: "lore", amount: 0.5 },
      { type: "add_resource", resourceId: "quiet", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "insight", amount: 4 }],
    prerequisites: [{ taskId: "lib_job_shelve", minLevel: 2 }],
    maxExecutions: 10,
  },
  {
    id: "lib_job_research",
    name: "Assist Patron Research",
    description: "Someone asks for 'everything on echoes.' You find more than they asked for.",
    category: "library_job",
    progressRequired: 25,
    autoRestart: true,
    startCosts: [{ resourceId: "quiet", amount: 8 }, { resourceId: "lore", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 0.6 },
      { type: "add_resource", resourceId: "mana", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "lib_job_catalog", minLevel: 2 }],
    maxExecutions: 6,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "lib_job_head_start",
    name: "Request Head Librarian Role",
    description: "You ask. The head librarian looks at your hands and says: 'Show me how you shelve.'",
    category: "library_job",
    costs: [{ resourceId: "insight", amount: 6 }, { resourceId: "lore", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "quiet", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "insight", amount: 8 }
    ],
    prerequisites: [{ taskId: "lib_job_catalog", minLevel: 3 }],
    maxExecutions: 1,
  },
  {
    id: "lib_job_archive",
    name: "Manage Special Collections",
    description: "A locked cabinet, a key that is also a bookmark. Inside: things that were not supposed to be kept.",
    category: "library_job",
    costs: [{ resourceId: "insight", amount: 12 }, { resourceId: "quiet", amount: 15 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "lore", amount: 0.05 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 10 },
      { type: "add_item", itemId: "archivist_glasses", amount: 1 }
    ],
    prerequisites: [{ actionId: "lib_job_head_start", minExecutions: 1 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  {
    id: "archivist_glasses",
    name: "Archivist Glasses",
    description: "You see dust and handwriting more clearly. Both tell you things.",
    slot: "head",
    effects: [{ type: "modify_yield_pct", taskId: "lib_job_catalog", amount: 0.18 }],
  },
  {
    id: "library_cardigan",
    name: "Library Cardigan",
    description: "Pockets deep enough for a notebook, a pencil, and a secret.",
    slot: "body",
    effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.03 }],
  },
  {
    id: "cataloging_folio",
    name: "Cataloging Folio",
    description: "Your own system, cross-referenced and slightly obsessive.",
    slot: "accessory",
    effects: [{ type: "modify_yield_pct", taskId: "lib_job_shelve", amount: 0.15 }],
  },
];
```

- [ ] **Step 2: Register module in `gameData/index.ts`**

Add at top:

```typescript
import * as LibraryAssistantModule from './jobs/libraryAssistant';
```

Add to `modules` array (after `WellnessModule`):

```typescript
    LibraryAssistantModule,
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add gameData/jobs/libraryAssistant.ts gameData/index.ts
git commit -m "feat: add Library Assistant job path"
```

---

### Task 3: Barista Job

**Files:**
- Create: `gameData/jobs/barista.ts`
- Modify: `gameData/index.ts`
- Test: `npm run build` + QA: apartment + money 30 unlocks cafe tasks

**Interfaces:**
- Consumes: Category `cafe` (Task 1)
- Produces: Task IDs `cafe_shift_morning`, `cafe_shift_evening`, `cafe_learn_recipes`, `cafe_regulars`; Actions `cafe_promo_shift_lead`, `cafe_promo_manager`; Items `barista_apron`, `chipped_mug`, `bag_of_beans`

- [ ] **Step 1: Create `gameData/jobs/barista.ts`**

```typescript
import { TaskConfig, ActionConfig, ItemConfig } from "../../types";

export const TASKS: TaskConfig[] = [
  {
    id: "cafe_shift_morning",
    name: "Morning Rush",
    description: "Steam, clatter, and names you learn before faces. You get fast or you get burned.",
    category: "cafe",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.4 }, { resourceId: "health", amount: 0.05 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 6 },
      { type: "add_resource", resourceId: "favor", amount: 0.6 }
    ],
    prerequisites: [{ actionId: "appartment", minExecutions: 1 }],
    xpPerSecond: 5,
  },
  {
    id: "cafe_shift_evening",
    name: "Evening Calm",
    description: "Fewer orders, more lingering. People talk. You listen.",
    category: "cafe",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.3 }, { resourceId: "health", amount: 0.03 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 4 },
      { type: "add_resource", resourceId: "mana", amount: 0.7 },
      { type: "add_resource", resourceId: "favor", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "cafe_shift_morning", minLevel: 2 }],
    xpPerSecond: 4,
  },
  {
    id: "cafe_learn_recipes",
    name: "Learn Specialty Drinks",
    description: "Latte art, cold brew ratios, the drink that has no name yet.",
    category: "cafe",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "money", amount: 5 }, { resourceId: "favor", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 0.2 },
      { type: "add_resource", resourceId: "health", amount: 0.3 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "favor", amount: 6 }],
    prerequisites: [{ taskId: "cafe_shift_morning", minLevel: 2 }],
    maxExecutions: 8,
  },
  {
    id: "cafe_regulars",
    name: "Remember Regulars' Orders",
    description: "You know what they want before they do. They notice.",
    category: "cafe",
    progressRequired: 15,
    autoRestart: true,
    startCosts: [{ resourceId: "favor", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 3 },
      { type: "add_resource", resourceId: "favor", amount: 1.2 },
      { type: "add_resource", resourceId: "lore", amount: 0.15 }
    ],
    prerequisites: [{ taskId: "cafe_learn_recipes", minLevel: 2 }],
    maxExecutions: 12,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "cafe_promo_shift_lead",
    name: "Become Shift Lead",
    description: "Keys, a clipboard, and the understanding that you open even when you don't want to.",
    category: "cafe",
    costs: [{ resourceId: "money", amount: 40 }, { resourceId: "favor", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "money", amount: 50 },
      { type: "modify_max_resource_flat", resourceId: "favor", amount: 10 }
    ],
    prerequisites: [{ taskId: "cafe_shift_morning", minLevel: 4 }],
    maxExecutions: 1,
  },
  {
    id: "cafe_promo_manager",
    name: "Assistant Manager",
    description: "You schedule. You order beans. The espresso machine listens to you now.",
    category: "cafe",
    costs: [{ resourceId: "money", amount: 120 }, { resourceId: "favor", amount: 20 }, { resourceId: "insight", amount: 4 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "money", amount: 0.08 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 8 },
      { type: "add_item", itemId: "barista_apron", amount: 1 }
    ],
    prerequisites: [{ actionId: "cafe_promo_shift_lead", minExecutions: 1 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  {
    id: "barista_apron",
    name: "Barista Apron",
    description: "Stained, practical, yours. The pockets know coins by feel.",
    slot: "body",
    effects: [{ type: "modify_yield_pct", taskId: "cafe_shift_morning", amount: 0.12 }],
  },
  {
    id: "chipped_mug",
    name: "Chipped Mug",
    description: "Your mug. No one else uses it. It keeps things warm longer than it should.",
    slot: "accessory",
    effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.025 }],
  },
  {
    id: "bag_of_beans",
    name: "Bag of Beans",
    description: "A sample bag, gifted. You grind slowly, deliberately.",
    slot: "accessory_2",
    effects: [{ type: "modify_passive_gen", resourceId: "health", amount: 0.02 }],
  },
];
```

Note: `favor` is defined in `nightmarket.ts` (baseMax 0, unlock via `market_hear`). If nightmarket not yet visited, `favor` max is 0 but `cafe_shift_morning` still grants `favor` amount — firstCompletionEffects of `cafe_learn_recipes` provides max. Ensure this unlock path exists. Also add fallback: add `modify_max_resource_flat` for favor on first morning shift completion if needed. For now, include `firstCompletionEffects` on `cafe_shift_morning`:

```typescript
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "favor", amount: 8 }],
```

- [ ] **Step 2: Register in `gameData/index.ts`**

```typescript
import * as BaristaModule from './jobs/barista';
```

Add to modules array.

- [ ] **Step 3: Build check** `npm run build` → PASS
- [ ] **Step 4: Commit**

```bash
git add gameData/jobs/barista.ts gameData/index.ts
git commit -m "feat: add Barista job path"
```

---

### Task 4: Community Garden Job

**Files:**
- Create: `gameData/jobs/communityGarden.ts`
- Modify: `gameData/index.ts`
- Test: `npm run build` + QA: seeds/produce resources appear, tend beds loop works

**Interfaces:**
- Consumes: Category `garden` (Task 1)
- Produces: Resources `produce`, `seeds`; Tasks `garden_tend_beds`, `garden_plant_seasonal`, `garden_compost`, `garden_harvest_festival`; Actions `garden_tool_shed`, `garden_greenhouse_key`; Items `gardening_gloves`, `sun_hat`, `woven_basket`, `almanac`

- [ ] **Step 1: Create `gameData/jobs/communityGarden.ts`**

```typescript
import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  { id: "produce", name: "Produce", type: "basic", category: "garden", baseMax: 0, initialAmount: 0, description: "What the beds give back. Heavier than it looks." },
  { id: "seeds", name: "Seeds", type: "basic", category: "garden", baseMax: 0, initialAmount: 0, description: "Small promises. You keep them in paper envelopes." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "garden_tend_beds",
    name: "Tend the Beds",
    description: "Water, weed, thin. The soil is warm.",
    category: "garden",
    progressRequired: 10,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.5 }, { resourceId: "health", amount: 0.08 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "produce", amount: 1.5 },
      { type: "add_resource", resourceId: "health", amount: 0.4 },
      { type: "add_resource", resourceId: "mana", amount: 0.25 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "produce", amount: 12 },
      { type: "modify_max_resource_flat", resourceId: "seeds", amount: 10 }
    ],
    prerequisites: [{ actionId: "appartment", minExecutions: 1 }],
    xpPerSecond: 4,
  },
  {
    id: "garden_plant_seasonal",
    name: "Plant Seasonal Crop",
    description: "You tuck seeds into dark lines. You cover them and wait.",
    category: "garden",
    progressRequired: 30,
    autoRestart: true,
    startCosts: [{ resourceId: "seeds", amount: 5 }, { resourceId: "produce", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "produce", amount: 4 },
      { type: "add_resource", resourceId: "insight", amount: 0.3 },
      { type: "add_resource", resourceId: "mana", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "garden_tend_beds", minLevel: 2 }],
    maxExecutions: 4,
  },
  {
    id: "garden_compost",
    name: "Manage Compost",
    description: "Everything returns. You turn it and it steams in the cold.",
    category: "garden",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "produce", amount: 8 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "seeds", amount: 3 },
      { type: "add_resource", resourceId: "health", amount: 0.5 },
      { type: "add_resource", resourceId: "lore", amount: 0.2 }
    ],
    prerequisites: [{ taskId: "garden_tend_beds", minLevel: 3 }],
    maxExecutions: 6,
  },
  {
    id: "garden_harvest_festival",
    name: "Organize Harvest Share",
    description: "Tables on the street, everyone takes what they need. You are thanked in a way that feels like currency.",
    category: "garden",
    progressRequired: 40,
    autoRestart: true,
    startCosts: [{ resourceId: "produce", amount: 20 }, { resourceId: "favor", amount: 10 }],
    costPerSecond: [{ resourceId: "time", amount: 0.4 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 30 },
      { type: "add_resource", resourceId: "favor", amount: 8 },
      { type: "add_resource", resourceId: "reputation", amount: 5 }
    ],
    prerequisites: [{ taskId: "garden_plant_seasonal", minLevel: 2 }],
    maxExecutions: 2,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "garden_tool_shed",
    name: "Access Tool Shed",
    description: "The shed is unlocked. Inside: everything has its place, even the rust.",
    category: "garden",
    costs: [{ resourceId: "money", amount: 60 }, { resourceId: "produce", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "produce", amount: 20 },
      { type: "modify_max_resource_flat", resourceId: "seeds", amount: 15 },
      { type: "add_item", itemId: "gardening_gloves", amount: 1 }
    ],
    prerequisites: [{ taskId: "garden_tend_beds", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "garden_greenhouse_key",
    name: "Get Greenhouse Key",
    description: "The coordinator hands you a key. 'It was always for you,' she says, though you've never met.",
    category: "garden",
    costs: [{ resourceId: "produce", amount: 30 }, { resourceId: "insight", amount: 8 }, { resourceId: "mana", amount: 15 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.03 },
      { type: "add_item", itemId: "sun_hat", amount: 1 }
    ],
    prerequisites: [{ taskId: "garden_plant_seasonal", minLevel: 2 }, { actionId: "garden_tool_shed", minExecutions: 1 }],
    maxExecutions: 1,
    logMessage: "The greenhouse key is cold. The glass house waits."
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "gardening_gloves", name: "Gardening Gloves", description: "Stained at the fingertips. You feel roots before you see them.", slot: "hand_r", effects: [{ type: "modify_yield_pct", taskId: "garden_tend_beds", amount: 0.15 }] },
  { id: "sun_hat", name: "Sun Hat", description: "Wide brim, faded. You wear it even in shade.", slot: "head", effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.02 }] },
  { id: "woven_basket", name: "Woven Basket", description: "Holds more than it should.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "produce", amount: 10 }] },
  { id: "almanac", name: "Almanac", description: "Planting dates, moon phases, marginal notes in three hands.", slot: "accessory_2", effects: [{ type: "modify_passive_gen", resourceId: "insight", amount: 0.015 }] },
];
```

Note: `reputation` is defined in Task 7 (fighting ring). If Tasks 4 and 7 load together, forward reference is okay (resources aggregated). To avoid load-order dependency, also define `reputation` here OR ensure fighting module loads. Simpler: define `reputation` in fightingRing.ts only; harvest festival's `add_resource: reputation` will create hidden 0-max resource until fighting is unlocked — acceptable per AGENTS.md §4 sharp edge #1, but avoid. Fix: add `reputation` resource also here OR change reward to `favor`. Decision: keep `reputation` reward but add resource definition here too (duplicate ID check will deduplicate? No, duplicates collide silently). Instead, define `reputation` in communityGarden.ts and fightingRing.ts will reuse it — need to ensure only one definition. Define `reputation` in communityGarden.ts and make fightingRing.ts depend on it via prerequisite. Or define `reputation` in a single place. Decision in plan: define `reputation` in `communityGarden.ts` (as above by adding to RESOURCES), and fightingRing.ts will NOT redefine it (just use it).

Update: add to communityGarden RESOURCES:

```typescript
  { id: "reputation", name: "Reputation", type: "stat", category: "garden", baseMax: 0, initialAmount: 0, description: "People know your work. They talk when you're not there.", passiveGen: [{ targetResourceId: 'favor', ratePerUnit: 0.005 }] },
```

- [ ] **Step 2: Register in `gameData/index.ts`**

```typescript
import * as CommunityGardenModule from './jobs/communityGarden';
```

Add to modules.

- [ ] **Step 3: Build check** `npm run build` → PASS
- [ ] **Step 4: Commit**

```bash
git add gameData/jobs/communityGarden.ts gameData/index.ts
git commit -m "feat: add Community Garden job path"
```

---

### Task 5: Abandoned Subway Tunnels Branch

**Files:**
- Create: `gameData/sideBranches/subwayTunnels.ts`
- Modify: `gameData/index.ts`
- Test: `npm run build` + QA: tunnels visible after find_cat + insanity 5

**Interfaces:**
- Consumes: Category `tunnels`; resources `insanity`, `cat`, `lore`, `insight`, `money`, `health`
- Produces: Resources `scrap`, `echoes`, `strange_artifact`; Tasks `tunnel_explore`, `tunnel_map`, `tunnel_salvage`, `tunnel_deep_delve`; Actions `tunnel_gear_up`, `tunnel_follow_echo`, `tunnel_cat_guidance`; Items `headlamp`, `cat_whisker`, `tunnel_map_item`; Converter `tunnel_scrap_press`

- [ ] **Step 1: Create `gameData/sideBranches/subwayTunnels.ts`**

```typescript
import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  { id: "scrap", name: "Scrap", type: "basic", category: "tunnels", baseMax: 0, initialAmount: 0, description: "Metal, concrete dust, things that were once something else." },
  { id: "echoes", name: "Echoes", type: "basic", category: "tunnels", baseMax: 0, initialAmount: 0, description: "Not sound. The residue of being heard." },
  { id: "strange_artifact", name: "Strange Artifact", type: "basic", category: "tunnels", baseMax: 0, initialAmount: 0, description: "You don't know what it is. It hums when you're not looking." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "tunnel_explore",
    name: "Explore Tunnels",
    description: "You follow the maintenance door down. The air gets cooler.",
    category: "tunnels",
    progressRequired: 12,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.4 }, { resourceId: "health", amount: 0.08 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "scrap", amount: 1.8 },
      { type: "add_resource", resourceId: "echoes", amount: 0.6 },
      { type: "add_resource", resourceId: "insanity", amount: 0.15 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "scrap", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "echoes", amount: 10 }
    ],
    prerequisites: [{ actionId: "find_cat", minExecutions: 1 }, { resourceId: "insanity", minAmount: 5 }],
    xpPerSecond: 3,
  },
  {
    id: "tunnel_map",
    name: "Map the Tunnels",
    description: "You draw lines where you've been. The lines connect where they shouldn't.",
    category: "tunnels",
    progressRequired: 25,
    autoRestart: true,
    startCosts: [{ resourceId: "echoes", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "lore", amount: 0.8 },
      { type: "add_resource", resourceId: "insight", amount: 0.2 },
      { type: "add_resource", resourceId: "scrap", amount: 2 }
    ],
    prerequisites: [{ taskId: "tunnel_explore", minLevel: 2 }],
    maxExecutions: 8,
  },
  {
    id: "tunnel_salvage",
    name: "Salvage Materials",
    description: "You pry, you carry, you sort. Some things are still useful.",
    category: "tunnels",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "scrap", amount: 8 }, { resourceId: "health", amount: 2 }],
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 8 },
      { type: "add_resource", resourceId: "scrap", amount: 4 },
      { type: "add_resource", resourceId: "echoes", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "tunnel_explore", minLevel: 3 }],
    maxExecutions: 10,
  },
  {
    id: "tunnel_deep_delve",
    name: "Deep Delve",
    description: "Past the flooded section, past the place where your phone lost signal and never found it again.",
    category: "tunnels",
    progressRequired: 50,
    autoRestart: true,
    startCosts: [{ resourceId: "echoes", amount: 15 }, { resourceId: "insanity", amount: 6 }],
    costPerSecond: [{ resourceId: "time", amount: 0.4 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 2 },
      { type: "add_resource", resourceId: "strange_artifact", amount: 1 },
      { type: "add_resource", resourceId: "lore", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "strange_artifact", amount: 5 }],
    prerequisites: [{ actionId: "tunnel_follow_echo", minExecutions: 1 }],
    maxExecutions: 3,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "tunnel_gear_up",
    name: "Gear Up for Tunnels",
    description: "Boots, gloves, a light that won't fail when you need it most.",
    category: "tunnels",
    costs: [{ resourceId: "money", amount: 80 }, { resourceId: "scrap", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 5 },
      { type: "modify_max_resource_flat", resourceId: "scrap", amount: 20 },
      { type: "add_item", itemId: "headlamp", amount: 1 }
    ],
    prerequisites: [{ taskId: "tunnel_explore", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "tunnel_follow_echo",
    name: "Follow the Echo",
    description: "You hear something that is not a sound. You follow it anyway.",
    category: "tunnels",
    costs: [{ resourceId: "echoes", amount: 20 }, { resourceId: "insight", amount: 6 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "insight", amount: 0.02 },
      { type: "modify_max_resource_flat", resourceId: "echoes", amount: 10 }
    ],
    prerequisites: [{ taskId: "tunnel_map", minLevel: 3 }],
    maxExecutions: 1,
  },
  {
    id: "tunnel_cat_guidance",
    name: "Follow the Cat",
    description: "The cat goes down. You didn't know there was a down there. It waits for you.",
    category: "tunnels",
    costs: [{ resourceId: "insanity", amount: 6 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "echoes", amount: 0.03 },
      { type: "add_item", itemId: "cat_whisker", amount: 1 }
    ],
    prerequisites: [{ resourceId: "cat", minMax: 1 }, { taskId: "tunnel_explore", minLevel: 2 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "headlamp", name: "Headlamp", description: "It makes your forehead heavier and your way clearer.", slot: "head", effects: [{ type: "modify_yield_pct", taskId: "tunnel_explore", amount: 0.15 }] },
  { id: "cat_whisker", name: "Cat Whisker", description: "Found on your coat. Vibrates slightly.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "echoes", amount: 0.02 }] },
  { id: "tunnel_map_item", name: "Tunnel Map", description: "Your lines, now legible to someone else.", slot: "accessory_2", effects: [{ type: "modify_yield_pct", taskId: "tunnel_map", amount: 0.2 }] },
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "tunnel_scrap_press",
    name: "Scrap Press",
    description: "You set up a press in the old service alcove. It folds scrap into something tradeable.",
    cost: [{ resourceId: "money", amount: 100 }, { resourceId: "scrap", amount: 20 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "money", amount: 0.15 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "scrap", amount: 0.12 }],
    prerequisites: [{ actionId: "tunnel_gear_up", minExecutions: 1 }]
  },
];
```

- [ ] **Step 2: Register in `gameData/index.ts`**

```typescript
import * as SubwayTunnelsModule from './sideBranches/subwayTunnels';
```

Add to modules.

- [ ] **Step 3: Build check** `npm run build` → PASS
- [ ] **Step 4: Commit**

```bash
git add gameData/sideBranches/subwayTunnels.ts gameData/index.ts
git commit -m "feat: add Abandoned Subway Tunnels branch"
```

---

### Task 6: Rooftop Garden Branch

**Files:**
- Create: `gameData/sideBranches/rooftopGarden.ts`
- Modify: `gameData/index.ts`
- Test: `npm run build` + QA: appears after wellness_visit_center OR garden greenhouse key

**Interfaces:**
- Consumes: Category `rooftop`; resources `sunlight`, `herbs`, `dried_herbs`, `calm`, `seeds`, `produce`, `mana`, `insight`; prerequisite actions `wellness_visit_center`, `garden_greenhouse_key`
- Produces: Resources `sunlight`, `herbs`, `dried_herbs`, `calm`; Tasks `rooftop_bask`, `rooftop_grow_herbs`, `rooftop_dry_herbs`, `rooftop_brew_tea`; Actions `rooftop_install_trellis`, `rooftop_moon_garden`; Items `trellis_clippers`, `moonwater_vial`, `pressed_flower`; Converter `rooftop_solar_still`

- [ ] **Step 1: Create `gameData/sideBranches/rooftopGarden.ts`**

```typescript
import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  { id: "sunlight", name: "Sunlight", type: "basic", category: "rooftop", baseMax: 0, initialAmount: 0, description: "You collect it without touching it. It collects you anyway." },
  { id: "herbs", name: "Herbs", type: "basic", category: "rooftop", baseMax: 0, initialAmount: 0, description: "Scent first, then shape, then use." },
  { id: "dried_herbs", name: "Dried Herbs", type: "basic", category: "rooftop", baseMax: 0, initialAmount: 0, description: "Lighter, stronger, quieter." },
  { id: "calm", name: "Calm", type: "stat", category: "rooftop", baseMax: 0, initialAmount: 0, description: "Not the absence of noise. The presence of not needing it." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "rooftop_bask",
    name: "Bask on the Roof",
    description: "You sit with sun on your face. Time feels less scarce up here.",
    category: "rooftop",
    type: "rest",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 0.4 },
      { type: "add_resource", resourceId: "health", amount: 0.15 },
      { type: "add_resource", resourceId: "mana", amount: 0.12 },
      { type: "add_resource", resourceId: "sunlight", amount: 0.12 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "sunlight", amount: 12 },
      { type: "modify_max_resource_flat", resourceId: "herbs", amount: 10 }
    ],
    prerequisites: [{ actionId: "wellness_visit_center", minExecutions: 1 }],
    // OR alternative via garden — handled by prerequisitesAny: need either
    prerequisitesAny: [{ actionId: "wellness_visit_center", minExecutions: 1 }, { actionId: "garden_greenhouse_key", minExecutions: 1 }],
    xpPerSecond: 3,
  },
  {
    id: "rooftop_grow_herbs",
    name: "Grow Herbs",
    description: "You plant small things in shallow soil. They want exactly what you have.",
    category: "rooftop",
    progressRequired: 25,
    autoRestart: true,
    startCosts: [{ resourceId: "sunlight", amount: 10 }, { resourceId: "seeds", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "herbs", amount: 2 },
      { type: "add_resource", resourceId: "mana", amount: 0.5 },
      { type: "add_resource", resourceId: "insight", amount: 0.15 }
    ],
    prerequisites: [{ taskId: "rooftop_bask", minLevel: 2 }],
    maxExecutions: 6,
  },
  {
    id: "rooftop_dry_herbs",
    name: "Dry Herbs",
    description: "You hang them upside down. They whisper as they dry.",
    category: "rooftop",
    progressRequired: 15,
    autoRestart: true,
    startCosts: [{ resourceId: "herbs", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "dried_herbs", amount: 3 },
      { type: "add_resource", resourceId: "mana", amount: 0.3 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "dried_herbs", amount: 15 }],
    prerequisites: [{ taskId: "rooftop_grow_herbs", minLevel: 2 }],
    maxExecutions: 8,
  },
  {
    id: "rooftop_brew_tea",
    name: "Brew Tea",
    description: "Water, leaf, waiting. The steam makes a shape you almost recognize.",
    category: "rooftop",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "dried_herbs", amount: 4 }, { resourceId: "mana", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 1 },
      { type: "add_resource", resourceId: "mana", amount: 2 },
      { type: "add_resource", resourceId: "calm", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "calm", amount: 6 }],
    prerequisites: [{ actionId: "rooftop_moon_garden", minExecutions: 1 }],
    maxExecutions: 5,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "rooftop_install_trellis",
    name: "Install Trellis",
    description: "Vertical space is still space. Things climb if you let them.",
    category: "rooftop",
    costs: [{ resourceId: "money", amount: 50 }, { resourceId: "produce", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "sunlight", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "herbs", amount: 12 },
      { type: "add_item", itemId: "trellis_clippers", amount: 1 }
    ],
    prerequisites: [{ taskId: "rooftop_bask", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "rooftop_moon_garden",
    name: "Plant Moon Garden",
    description: "You plant at night. The seeds don't mind. They were waiting for this.",
    category: "rooftop",
    costs: [{ resourceId: "insight", amount: 10 }, { resourceId: "mana", amount: 20 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.04 },
      { type: "add_item", itemId: "moonwater_vial", amount: 1 }
    ],
    prerequisites: [{ taskId: "rooftop_grow_herbs", minLevel: 3 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "trellis_clippers", name: "Trellis Clippers", description: "Small, sharp, green at the edge.", slot: "hand_r", effects: [{ type: "modify_yield_pct", taskId: "rooftop_grow_herbs", amount: 0.15 }] },
  { id: "moonwater_vial", name: "Moonwater Vial", description: "Left out overnight. It remembers.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.02 }] },
  { id: "pressed_flower", name: "Pressed Flower", description: "Flat, color-held, still faintly scented.", slot: "accessory_2", effects: [{ type: "modify_passive_gen", resourceId: "insight", amount: 0.01 }] },
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "rooftop_solar_still",
    name: "Solar Still",
    description: "A glass box that turns sunlight into something you can drink slowly.",
    cost: [{ resourceId: "money", amount: 120 }, { resourceId: "sunlight", amount: 30 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "sunlight", amount: 0.08 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "mana", amount: 0.06 }],
    prerequisites: [{ actionId: "rooftop_install_trellis", minExecutions: 1 }]
  },
];
```

Note: `rooftop_bask` has both `prerequisites` and `prerequisitesAny`. Engine supports both: main prerequisites is AND, prerequisitesAny is OR. For "either A or B", use prerequisitesAny only. Fix: remove main prerequisites line, keep only:

```typescript
    prerequisitesAny: [{ actionId: "wellness_visit_center", minExecutions: 1 }, { actionId: "garden_greenhouse_key", minExecutions: 1 }],
```

- [ ] **Step 2: Register in `gameData/index.ts`**

```typescript
import * as RooftopGardenModule from './sideBranches/rooftopGarden';
```

Add to modules.

- [ ] **Step 3: Build check** `npm run build` → PASS
- [ ] **Step 4: Commit**

```bash
git add gameData/sideBranches/rooftopGarden.ts gameData/index.ts
git commit -m "feat: add Rooftop Garden branch"
```

---

### Task 7: Underground Fighting Ring Branch

**Files:**
- Create: `gameData/sideBranches/fightingRing.ts`
- Modify: `gameData/index.ts`
- Test: `npm run build`

**Interfaces:**
- Consumes: Category `fighting`; resources `reputation` (from Task 4), plus new `blood_money`, `champion_token`, `health`, `favor`
- Produces: Resources `blood_money`, `champion_token` (reputation already in Task 4 — do NOT redefine); Tasks `fight_spar`, `fight_undercard`, `fight_main_event`, `fight_recover`; Actions `fight_better_gear`, `fight_corner_man`, `fight_champion_belt`; Items `wraps`, `mouthguard`, `champion_belt`; Converter `fight_betting_pool`

- [ ] **Step 1: Create `gameData/sideBranches/fightingRing.ts`**

```typescript
import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  { id: "blood_money", name: "Blood Money", type: "basic", category: "fighting", baseMax: 0, initialAmount: 0, description: "Folded, warm, counted twice." },
  { id: "champion_token", name: "Champion Token", type: "basic", category: "fighting", baseMax: 0, initialAmount: 0, description: "Not money. Proof you stood in the circle and stayed." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "fight_spar",
    name: "Spar",
    description: "You hit and get hit. Both teach.",
    category: "fighting",
    progressRequired: 8,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.3 }, { resourceId: "health", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "blood_money", amount: 3 },
      { type: "add_resource", resourceId: "reputation", amount: 0.2 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "blood_money", amount: 20 },
      { type: "modify_max_resource_flat", resourceId: "reputation", amount: 6 }
    ],
    prerequisites: [{ resourceId: "health", minMax: 20 }],
    xpPerSecond: 8,
  },
  {
    id: "fight_undercard",
    name: "Undercard Fight",
    description: "A circle of people, a bare bulb, a bell that is a cough.",
    category: "fighting",
    progressRequired: 30,
    autoRestart: true,
    startCosts: [{ resourceId: "health", amount: 10 }, { resourceId: "blood_money", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.4 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "reputation", amount: 2 },
      { type: "add_resource", resourceId: "blood_money", amount: 8 },
      { type: "add_resource", resourceId: "insight", amount: 0.3 }
    ],
    prerequisites: [{ taskId: "fight_spar", minLevel: 3 }],
    maxExecutions: 5,
  },
  {
    id: "fight_main_event",
    name: "Main Event",
    description: "They say your name. You don't recognize it until you step in.",
    category: "fighting",
    progressRequired: 60,
    autoRestart: true,
    startCosts: [{ resourceId: "reputation", amount: 15 }, { resourceId: "health", amount: 20 }, { resourceId: "blood_money", amount: 20 }],
    costPerSecond: [{ resourceId: "time", amount: 0.5 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "reputation", amount: 6 },
      { type: "add_resource", resourceId: "blood_money", amount: 30 },
      { type: "add_resource", resourceId: "money", amount: 50 },
      { type: "add_resource", resourceId: "champion_token", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "champion_token", amount: 4 }],
    prerequisites: [{ actionId: "fight_corner_man", minExecutions: 1 }],
    maxExecutions: 2,
  },
  {
    id: "fight_recover",
    name: "Recover",
    description: "Ice, quiet, and the way a bruise tells time.",
    category: "fighting",
    type: "rest",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "health", amount: 0.6 },
      { type: "add_resource", resourceId: "mana", amount: 0.1 },
      { type: "add_resource", resourceId: "time", amount: 0.3 }
    ],
    prerequisites: [{ taskId: "fight_spar", minLevel: 2 }],
    xpPerSecond: 2,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "fight_better_gear",
    name: "Get Better Gear",
    description: "Wraps, a better mouthguard, shoes that don't slip.",
    category: "fighting",
    costs: [{ resourceId: "blood_money", amount: 30 }, { resourceId: "reputation", amount: 5 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 10 },
      { type: "modify_max_resource_flat", resourceId: "blood_money", amount: 25 },
      { type: "add_item", itemId: "wraps", amount: 1 }
    ],
    prerequisites: [{ taskId: "fight_spar", minLevel: 3 }],
    maxExecutions: 1,
  },
  {
    id: "fight_corner_man",
    name: "Find a Corner Man",
    description: "He doesn't say much. He knows when to put the stool down.",
    category: "fighting",
    costs: [{ resourceId: "reputation", amount: 10 }, { resourceId: "insight", amount: 5 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "blood_money", amount: 0.05 },
      { type: "add_item", itemId: "mouthguard", amount: 1 }
    ],
    prerequisites: [{ taskId: "fight_undercard", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "fight_champion_belt",
    name: "Claim Champion Belt",
    description: "It fits, though it shouldn't. It was measured for someone else.",
    category: "fighting",
    costs: [{ resourceId: "reputation", amount: 30 }, { resourceId: "blood_money", amount: 100 }, { resourceId: "insight", amount: 15 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "reputation", amount: 0.02 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 20 },
      { type: "add_item", itemId: "champion_belt", amount: 1 }
    ],
    prerequisites: [{ taskId: "fight_main_event", minLevel: 1 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "wraps", name: "Hand Wraps", description: "You wind them the same way every time. A ritual, not a habit.", slot: "hand_r", effects: [{ type: "modify_yield_pct", taskId: "fight_spar", amount: 0.15 }] },
  { id: "mouthguard", name: "Mouthguard", description: "You bite down and it fits the shape of you.", slot: "head", effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 6 }] },
  { id: "champion_belt", name: "Champion Belt", description: "Leather, brass, and the idea that you were here.", slot: "body", effects: [{ type: "modify_passive_gen", resourceId: "reputation", amount: 0.02 }, { type: "modify_max_resource_flat", resourceId: "health", amount: 8 }] },
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "fight_betting_pool",
    name: "Betting Pool",
    description: "You run a small book. It pays in two currencies: money and being known.",
    cost: [{ resourceId: "blood_money", amount: 50 }, { resourceId: "reputation", amount: 10 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "blood_money", amount: 0.2 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "money", amount: 0.15 }],
    prerequisites: [{ actionId: "fight_corner_man", minExecutions: 1 }]
  },
];
```

Note: `fight_spar` prerequisites originally in spec: `subways_job_2` OR `oddjobs` + health max 20. Simplify to `health minMax 20` for now (health max 20 reachable via `wellness_visit_center` or `fight_better_gear`). Alternative: use `prerequisitesAny: [{ taskId: "subways_job_2", minLevel: 1 }, { taskId: "oddjobs", minLevel: 1 }]` plus `health minMax`. Include both via `prerequisites` + `prerequisitesAny` if needed — engine handles both.

- [ ] **Step 2: Register in `gameData/index.ts`**

```typescript
import * as FightingRingModule from './sideBranches/fightingRing';
```

Add to modules.

- [ ] **Step 3: Build check** `npm run build` → PASS
- [ ] **Step 4: Commit**

```bash
git add gameData/sideBranches/fightingRing.ts gameData/index.ts
git commit -m "feat: add Underground Fighting Ring branch"
```

---

### Task 8: Loot System + Scavenging

**Files:**
- Modify: `gameData/tasks.ts` — add `drops` to 5 existing tasks
- Create: `gameData/scavenging.ts` — 3 scavenging tasks + 13 trinket/curio items
- Modify: `gameData/index.ts`
- Test: `npm run build` + QA: task drops appear in TICK log, items equippable

**Interfaces:**
- Consumes: Tasks `rest_bench`, `subways_job`, `subways_job_2`, `wall_destroy`, `explore_neighborhood`; categories `scavenging`
- Produces: Items `crumpled_receipt`, `manager_memo`, `park_feather`, `wall_dust`, `neighborhood_map`, `scrap_metal`, `discarded_book`, `moldy_sandwich`, `lost_token`, `strange_charm`, `whisper_paper`, `misplaced_ring`, `old_photo`, `library_card_duplicate`, `vintage_pocket_watch`, `brass_compass`, `dried_flower_crown`, `iron_key_on_chain`

- [ ] **Step 1: Add drops to `gameData/tasks.ts`**

Edit imports and add `drops` fields:

```typescript
// Before (line 90):
            prerequisites: [{ actionId: 'subways_promotion', minExecutions: 1 }],
            locks: ['subways_job']
```

No — edit each task individually:

For `rest_bench` (line 3-20):
```typescript
        xpPerSecond: 5,
        drops: [{ itemId: "park_feather", chancePerSecond: 0.001 }],
```

For `subways_job`:
```typescript
        prerequisites: [{ actionId: 'get_job', minExecutions: 1 }],
        locks: ['search_trash'],
        drops: [{ itemId: "crumpled_receipt", chancePerSecond: 0.005 }],
```

For `subways_job_2`:
```typescript
        prerequisites: [{ actionId: 'subways_promotion', minExecutions: 1 }],
        locks: ['subways_job'],
        xpPerSecond: 10,
        drops: [{ itemId: "manager_memo", chancePerSecond: 0.003 }],
```

For `wall_destroy`:
```typescript
        maxExecutions: 10,
        hideWhenComplete: true,
        drops: [{ itemId: "wall_dust", chancePerSecond: 0.004 }],
```

For `explore_neighborhood`:
```typescript
        prerequisites: [{ resourceId: 'cat', minMax: 1 }],
        maxExecutions: 5,
        drops: [{ itemId: "neighborhood_map", chancePerSecond: 0.002 }],
```

- [ ] **Step 2: Create `gameData/scavenging.ts`**

```typescript
import { TaskConfig, ItemConfig } from "../types";

export const TASKS: TaskConfig[] = [
  {
    id: "scav_dumpster",
    name: "Search Dumpsters",
    description: "You lift the lid. The smell is honest. You find things people decided not to want.",
    category: "scavenging",
    progressRequired: 10,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.4 }, { resourceId: "health", amount: 0.05 }],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "money", amount: 2 }],
    prerequisites: [{ actionId: "trash_search", minExecutions: 3 }],
    drops: [
      { itemId: "scrap_metal", chancePerSecond: 0.008 },
      { itemId: "discarded_book", chancePerSecond: 0.003 },
      { itemId: "moldy_sandwich", chancePerSecond: 0.01 }
    ],
    xpPerSecond: 4,
  },
  {
    id: "scav_alleys",
    name: "Patrol Alleys",
    description: "You walk where maps go vague. Things are where they shouldn't be.",
    category: "scavenging",
    progressRequired: 12,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.3 }, { resourceId: "mana", amount: 0.08 }],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "lore", amount: 0.2 }],
    prerequisites: [{ taskId: "scav_dumpster", minLevel: 2 }],
    drops: [
      { itemId: "lost_token", chancePerSecond: 0.006 },
      { itemId: "strange_charm", chancePerSecond: 0.002 },
      { itemId: "whisper_paper", chancePerSecond: 0.004 }
    ],
    xpPerSecond: 4,
  },
  {
    id: "scav_lost_found",
    name: "Check Lost & Found",
    description: "A bin of things people lost and never came back for. You ask if you can look.",
    category: "scavenging",
    progressRequired: 8,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.2 }],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "favor", amount: 0.1 }],
    startCosts: [{ resourceId: "favor", amount: 1 }],
    prerequisites: [{ taskId: "scav_alleys", minLevel: 2 }],
    drops: [
      { itemId: "misplaced_ring", chancePerSecond: 0.005 },
      { itemId: "old_photo", chancePerSecond: 0.003 },
      { itemId: "library_card_duplicate", chancePerSecond: 0.001 }
    ],
    xpPerSecond: 3,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "crumpled_receipt", name: "Crumpled Receipt", description: "Numbers that almost add up. You keep it for luck.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "rest_bench", amount: 0.05 }] },
  { id: "manager_memo", name: "Manager Memo", description: "Folded, coffee-stained. It tells you what not to do. Useful.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "subways_job_2", amount: 0.08 }] },
  { id: "park_feather", name: "Park Feather", description: "Small, clean. Found on the bench where you rested.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.01 }] },
  { id: "wall_dust", name: "Wall Dust", description: "Fine, itchy. You keep a pinch in an envelope.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "wall_destroy", amount: 0.08 }] },
  { id: "neighborhood_map", name: "Neighborhood Map", description: "Hand-drawn, wrong in useful ways.", slot: "accessory_2", effects: [{ type: "modify_passive_gen", resourceId: "lore", amount: 0.02 }] },
  { id: "scrap_metal", name: "Scrap Metal", description: "A bent piece of something. Heavy enough to be useful.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "tunnel_explore", amount: 0.08 }] },
  { id: "discarded_book", name: "Discarded Book", description: "Water-damaged, but readable. Someone underlined the good parts.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "scav_dumpster", amount: 0.05 }] },
  { id: "moldy_sandwich", name: "Moldy Sandwich", description: "You don't eat it. You keep it to remind you to eat something else.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 2 }] },
  { id: "lost_token", name: "Lost Token", description: "A token from somewhere you haven't been. It fits your hand.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "favor", amount: 0.01 }] },
  { id: "strange_charm", name: "Strange Charm", description: "It doesn't match anything you own. It wants to be kept.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "insight", amount: 0.008 }] },
  { id: "whisper_paper", name: "Whisper Paper", description: "Thin paper, folded many times. The creases spell something.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "scav_alleys", amount: 0.08 }] },
  { id: "misplaced_ring", name: "Misplaced Ring", description: "Too small or too large. You wear it on a chain.", slot: "accessory_2", effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 2 }] },
  { id: "old_photo", name: "Old Photo", description: "A place you've never been, a person you almost know.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "lore", amount: 3 }] },
  { id: "library_card_duplicate", name: "Duplicate Library Card", description: "Not yours, but it works. The photo is blurred.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "quiet", amount: 4 }] },
  { id: "vintage_pocket_watch", name: "Vintage Pocket Watch", description: "Stopped at a time that feels important.", slot: "accessory_2", effects: [{ type: "modify_max_resource_flat", resourceId: "time", amount: 3 }, { type: "modify_passive_gen", resourceId: "time", amount: 0.02 }] },
  { id: "brass_compass", name: "Brass Compass", description: "It doesn't point north. It points where you're needed.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "explore_neighborhood", amount: 0.1 }, { type: "modify_yield_pct", taskId: "tunnel_explore", amount: 0.1 }] },
  { id: "dried_flower_crown", name: "Dried Flower Crown", description: "Brittle, fragrant, still holds its shape.", slot: "head", effects: [{ type: "modify_max_resource_flat", resourceId: "mana", amount: 5 }, { type: "modify_passive_gen", resourceId: "health", amount: 0.02 }] },
  { id: "iron_key_on_chain", name: "Iron Key on Chain", description: "Heavy. No lock you've tried fits it. You keep it anyway.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "time", amount: 2 }] },
];
```

Note: `moldy_sandwich` item triggers food joke but effect is valid. `brass_compass` effect has two entries for two taskIds — one item with two modifiers is valid (effects array).

- [ ] **Step 3: Register in `gameData/index.ts`**

```typescript
import * as ScavengingModule from './scavenging';
```

Add to modules array (near top, after basic resources).

- [ ] **Step 4: Build check** `npm run build` → PASS

Validate IDs unique:

```bash
python -c "import re,glob; ids=[]; [ids.extend(re.findall(r'id:\s*\"([^\"]+)\"',open(f).read())) for f in glob.glob('gameData/**/*.ts',recursive=True)]; dup=[x for x in set(ids) if ids.count(x)>1]; print('DUPLICATES:' if dup else 'no duplicates', dup)"
```

Expected: no duplicates

- [ ] **Step 5: Commit**

```bash
git add gameData/tasks.ts gameData/scavenging.ts gameData/index.ts
git commit -m "feat: add scavenging tasks and loot drop system"
```

---

### Task 9: Final Verification + Balance Pass

**Files:**
- None (verification only)
- Possibly touch `gameData/index.ts` if missing imports

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 1: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 2: ID uniqueness check**

Run: `Select-String -Pattern '"[a-z_]+\"' -Path gameData\*.ts,gameData\**\*.ts | Group-Object ...` or python dup check above
Expected: no duplicates

- [ ] **Step 3: Reference validation (manual)**

Run: `python -c "import re; import glob; sents=set(re.findall(r'resourceId:\s*\"([^\"]+)\"', open('types.ts').read())); ..."` — quick script to compare referenced resourceIds vs defined RESOURCES ids. Already done via build type-check for missing ResourceConfig, but runtime placeholder check: greps for `placeholder` in tooltips.

- [ ] **Step 4: Manual QA in dev**

```bash
npm run dev
# Open http://localhost:3000
# Verify:
# - Scavenging appears after trash_search 3x
# - Library Assistant appears after library_find + lore 5
# - Barista appears after apartment
# - Garden appears after apartment
# - Tunnels appears after find_cat + insanity 5
# - Rooftop appears after wellness_visit_center
# - Fighting appears after health max 20
# - Drops trigger log messages, items appear in inventory, equippable
# - Save export/import/reset still works
```

- [ ] **Step 5: Commit docs**

```bash
git add docs/superpowers/plans/2026-08-24-early-game-expansion.md docs/superpowers/specs/2026-08-24-early-game-expansion-design.md
git commit -m "docs: spec and plan for early game expansion"
```

---

## Self-Review

**1. Spec coverage:**
- §2 Job Paths → Tasks 2, 3, 4 ✓
- §3 Side-Branches → Tasks 5, 6, 7 ✓
- §4 Loot System (retrofit + scavenging) → Task 8 ✓
- §5 Resources → Distributed across Tasks 4, 5, 6, 7 ✓ (reputation in Task 4, scrap/echoes/strange_artifact in Task 5, sunlight/herbs/dried_herbs/calm in Task 6, blood_money/champion_token in Task 7)
- §6 Categories → Task 1 ✓
- §7 File Structure → Tasks 2-8 ✓
- §8 Constraints (no types.ts, additive) → all tasks ✓
- §9 Verification → Task 9 ✓

**2. Placeholder scan:** No TBD/TODO; all effect types map to `types.ts:47`; `dried_herbs` defined; `strange_artifact`/`champion_token` defined in respective branch; `reputation` single definition in Task 4.

**3. Type consistency:** `Modify_yield_pct` taskIds verified to exist (lib_job_catalog, tunnel_explore, etc.); `passiveGen` targetResourceId fields correct; `TaskDrop.chancePerSecond` 0.001-0.01 range sane; no `clearLayers` mismatches.

**Gaps fixed inline:** reputation single-source fix, rooftop_bask OR prerequisite, barista favor unlock path, brass_compass dual modifier.
