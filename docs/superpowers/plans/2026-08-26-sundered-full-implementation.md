# SUNDERED Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete SUNDERED idle-RPG (4 Aspects, 4 Braids, Casting Forms, 5 chapters, 3 endgame paths, side content) on the OpenIdle Engine.

**Architecture:** Data-driven content in `gameData/` modules (hybrid core/chapter folders), engine extensions in `types.ts` + `context/GameContext.tsx` (new CAST_SPELL reducer branch, aspect fluency/flags/casting-form state), UI additions minimal via existing card components.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS 4. No new dependencies.

## Global Constraints

- All IDs `snake_case`, globally unique across all gameData modules
- Never edit reducer to add content; content lives only in `gameData/`
- Every referenced resourceId/category/taskId/actionId/itemId/slot must exist and be registered in `gameData/index.ts`
- Save version bumps to `7` with migration from v6 (additive merge; new fields defaulted)
- `npm run build` must pass after every task; `npm run validate` after every content task
- Tailwind utility classes only; preserve card color conventions (TaskCard blue/orange by autoRestart, ActionCard yellow if maxExecutions<100)
- Aspect cost/yield curves per DESIGN.md §6.1: Ash steep, Root shallow, Hush moderate/spiky, Iron shallow

---

## Phase 1: Core Engine Systems

### Task 1: Extend types.ts with SUNDERED interfaces

**Files:**
- Modify: `types.ts`

**Interfaces:**
- Produces: `AspectID`, `BraidID`, `SpellConfig`, `AspectConfig`, `BraidConfig`, `BraidWorking`, `CastingFormModifier`, `UnlockPath`; extended `Effect.type` union; extended `GameState`; extended `GameContextType`

- [ ] **Step 1: Add type aliases and config interfaces**

Append after existing type aliases near top of file:

```typescript
export type AspectID = 'ash' | 'root' | 'hush' | 'iron';
export type BraidID = 'smolder' | 'dormancy' | 'heartwood' | 'temper';
export type EndgamePath = 'warden' | 'mender' | 'wellspring';

export interface SpellConfig {
  id: string;
  name: string;
  description: string;
  aspectId?: AspectID;
  braidId?: BraidID;
  workingId?: string;
  tier: number;
  baseManaCost: number;
  baseMotesYield: number;
  baseCooldownMs: number;
  failureFlavor: string;
  failureEffect?: Effect[];
}

export interface AspectConfig {
  id: AspectID;
  name: string;
  description: string;
  color: string;
  costGrowthFactor: number;   // applied per tier for costs
  yieldGrowthFactor: number;  // applied per tier for yields
  failureFlavor: string;
}

export interface BraidWorking {
  id: string;
  name: string;
  description: string;
}

export interface BraidConfig {
  id: BraidID;
  name: string;
  parentAspects: [AspectID, AspectID];
  description: string;
  workings: BraidWorking[];
  signatureQuirk: string;
  unlockChapter: number;
}

export interface CastingFormModifier {
  id: string;
  axis: 'method' | 'duration' | 'target';
  value: string;
  displayName: string;
  description: string;
  costMultiplier: number;
  effectMultiplier: number;
  variance?: number;
  reliabilityBonus?: number; // reduces failure chance (0-0.2 typical)
  continuousDrainPerSecond?: number; // Sustained
  triggerDelaySeconds?: number;      // Delayed
  minTier?: number;                  // chapter gate
}
```

- [ ] **Step 2: Extend Effect interface**

In the existing `Effect` interface, add to the `type` union: `'set_flag' | 'modify_failure_chance' | 'unlock_casting_form' | 'modify_aspect_fluency' | 'modify_cooldown_flat'`. Add fields:

```typescript
  flagId?: string;          // set_flag
  aspectId?: AspectID;      // modify_aspect_fluency / aspect-scoped effects
  formId?: string;          // unlock_casting_form
```

Also extend `ActionConfig` with optional `spell?: { spellId: string }` marker is NOT needed - casting actions reference spells via effect `type:'cast_spell'`... Actually simpler: add `'cast_spell'` handling through a new dedicated field on ActionConfig:

```typescript
// Add to ActionConfig
  spellId?: string;         // If set, TRIGGER_ACTION resolves this SpellConfig
```

- [ ] **Step 3: Extend GameState and GameContextType**

```typescript
// GameState additions
  flags: Record<string, boolean>;
  aspectFluency: Record<AspectID, number>;       // clean castings
  failedCastings: Record<AspectID, number>;
  castingFormsUnlocked: Record<string, boolean>;
  activeFormSelection: { method?: string; duration?: string; target?: string };
  chapter: number;
  endgamePath?: EndgamePath;
  sustainedSpells: { spellId: string; aspectId?: AspectID; remainingSeconds: number }[];
  footprintCounter: number; // Unwitnessed challenge tracking
```

```typescript
// GameContextType additions
  castSpell: (actionId: ActionID) => void;
  selectForm: (axis: 'method' | 'duration' | 'target', formId: string | null) => void;
  getFailureChance: (spellId: string) => number;
```

- [ ] **Step 4: Run build to verify types compile**

Run: `npm run build`
Expected: PASS (types unused yet but valid)

- [ ] **Step 5: Commit**

```bash
git add types.ts && git commit -m "feat(types): add SUNDERED aspect/braid/form/spell interfaces"
```

### Task 2: Core categories + resources

**Files:**
- Create: `gameData/core/categories.ts`
- Create: `gameData/core/resources.ts`

**Interfaces:**
- Consumes: `CategoryConfig`, `ResourceConfig` from `../types`
- Produces: category IDs `chapter1..chapter5`, `ash`, `root`, `hush`, `iron`, `smolder`, `dormancy`, `heartwood`, `temper`, `forms`, `notebook`, `endgame`; resource IDs `mana`, `focus`, `motes`, `skyglass`, `deep_current`

- [ ] **Step 1: Write `gameData/core/categories.ts`**

```typescript
import { CategoryConfig } from "../../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "chapter1", name: "Chapter I: First Spark" },
  { id: "chapter2", name: "Chapter II: The Four Aspects" },
  { id: "chapter3", name: "Chapter III: Braided Casting" },
  { id: "chapter4", name: "Chapter IV: Casting Forms" },
  { id: "chapter5", name: "Chapter V: The Wound Answers" },
  { id: "ash", name: "Ash - Consumption" },
  { id: "root", name: "Root - Growth" },
  { id: "hush", name: "Hush - Negation" },
  { id: "iron", name: "Iron - Permanence" },
  { id: "smolder", name: "Smolder (Ash + Hush)" },
  { id: "dormancy", name: "Dormancy (Hush + Root)" },
  { id: "heartwood", name: "Heartwood (Root + Iron)" },
  { id: "temper", name: "Temper (Iron + Ash)" },
  { id: "forms", name: "Casting Forms" },
  { id: "notebook", name: "The Kindled's Notebook" },
  { id: "endgame", name: "The Wound Answers" },
];
```

- [ ] **Step 2: Write `gameData/core/resources.ts`**

```typescript
import { ResourceConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  {
    id: "mana",
    name: "Mana",
    type: "stat",
    baseMax: 100,
    initialAmount: 50,
    color: "bg-blue-500",
    description: "Raw magical reserve. Spent per casting; regenerates slowly.",
  },
  {
    id: "focus",
    name: "Focus",
    type: "stat",
    baseMax: 30,
    initialAmount: 15,
    color: "bg-purple-500",
    description: "Concentration and control. Raises reliability, shortens cooldowns.",
  },
  {
    id: "motes",
    name: "Motes",
    type: "basic",
    baseMax: 999999999,
    initialAmount: 0,
    description: "Residue shaken loose by casting. Core crafting currency; converts to Mana.",
  },
  {
    id: "skyglass",
    name: "Skyglass",
    type: "basic",
    baseMax: 0,
    initialAmount: 0,
    description: "Physical shards of the Sundering itself. Found, not farmed.",
  },
  {
    id: "deep_current",
    name: "Deep Current",
    type: "basic",
    baseMax: 0,
    initialAmount: 0,
    description: "The world's own slow undertow of raw magic.",
  },
];
```

Note: mana/focus as `stat` puts them in right bar; motes/skyglass basic left column. Skyglass/deep_current hidden until unlocked (baseMax 0).

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add gameData/core && git commit -m "feat(gameData): core categories + resources"
```

### Task 3: Aspects module (24 spells)

**Files:**
- Create: `gameData/core/aspects.ts`

**Interfaces:**
- Produces: `ASPECTS: AspectConfig[]` (4 entries), spells exported as ACTIONS-compatible configs are built later; here we export `ASPECTS` and `SPELLS: SpellConfig[]` (24 entries)

- [ ] **Step 1: Write the aspects module with all four Aspects and their six tiers each**

Base costs/yields/cooldowns follow DESIGN.md §6.2 where given; interpolate remaining tiers along each Aspect's curve (Ash steep ~×2/tier cost, ×1.6 yield early flattening; Root shallow ~×1.4; Hush moderate spiky ~×1.7 with cooldown spikes; Iron shallow ~×1.35).

```typescript
import { AspectConfig, SpellConfig } from "../../types";

export const ASPECTS: AspectConfig[] = [
  { id: "ash", name: "Ash", description: "Magic of consumption and transformation.", color: "#ef4444", costGrowthFactor: 1.9, yieldGrowthFactor: 1.55, failureFlavor: "Overshoots - a candle asked to grow becomes a small bonfire." },
  { id: "root", name: "Root", description: "Magic of growth and connection.", color: "#22c55e", costGrowthFactor: 1.4, yieldGrowthFactor: 1.45, failureFlavor: "Won't stop growing where you meant it to." },
  { id: "hush", name: "Hush", description: "Magic of negation and absence.", color: "#8b5cf6", costGrowthFactor: 1.7, yieldGrowthFactor: 1.35, failureFlavor: "Silences the wrong thing." },
  { id: "iron", name: "Iron", description: "Magic of weight and permanence.", color: "#64748b", costGrowthFactor: 1.35, yieldGrowthFactor: 1.25, failureFlavor: "Fixes things in the wrong place, for good." },
];

export const SPELLS: SpellConfig[] = [
  // ASH
  { id: "coax_the_ember", name: "Coax the Ember", description: "Grow or shrink an existing flame.", aspectId: "ash", tier: 1, baseManaCost: 8, baseMotesYield: 2, baseCooldownMs: 2000, failureFlavor: "Your flame leaps taller than intended - singed eyebrows." },
  { id: "kindles_touch", name: "Kindle's Touch", description: "Light something that wasn't burning.", aspectId: "ash", tier: 2, baseManaCost: 15, baseMotesYield: 4, baseCooldownMs: 3000, failureFlavor: "Everything nearby but the target begins smoldering." },
  { id: "spendthrifths_flare", name: "Spendthrift's Flare", description: "Convert Mana into a short, powerful burst - the classic overcast.", aspectId: "ash", tier: 3, baseManaCost: 35, baseMotesYield: 6, baseCooldownMs: 8000, failureFlavor: "The burst consumes your reserves entirely." },
  { id: "the_long_burn", name: "The Long Burn", description: "A slow, sustained consumption effect.", aspectId: "ash", tier: 4, baseManaCost: 60, baseMotesYield: 9, baseCooldownMs: 12000, failureFlavor: "It keeps burning long after you look away." },
  { id: "second_wind", name: "Second Wind", description: "Convert unspent Mana into Motes at a punishing rate.", aspectId: "ash", tier: 5, baseManaCost: 90, baseMotesYield: 20, baseCooldownMs: 15000, failureFlavor: "A brief casting drought follows - nothing answers." },
  { id: "the_last_match", name: "The Last Match", description: "One maximal expenditure of nearly all current Mana.", aspectId: "ash", tier: 6, baseManaCost: 140, baseMotesYield: 40, baseCooldownMs: 30000, failureFlavor: "It overshoots badly at low Focus - everything at once, then ash." },
  // ROOT
  { id: "nudge_the_root", name: "Nudge the Root", description: "Grow a small plant, once.", aspectId: "root", tier: 1, baseManaCost: 6, baseMotesYield: 1, baseCooldownMs: 3000, failureFlavor: "Seedlings erupt past the windowsill." },
  { id: "knit", name: "Knit", description: "Accelerated minor healing.", aspectId: "root", tier: 2, baseManaCost: 12, baseMotesYield: 2, baseCooldownMs: 5000, failureFlavor: "The wound closes around what was inside it." },
  { id: "bramble_snare", name: "Bramble Snare", description: "Rapidly grows entangling vines.", aspectId: "root", tier: 3, baseManaCost: 28, baseMotesYield: 4, baseCooldownMs: 10000, failureFlavor: "The snare doesn't stop where you meant it to." },
  { id: "the_long_season", name: "The Long Season", description: "Advance a living thing through a full growth cycle.", aspectId: "root", tier: 4, baseManaCost: 42, baseMotesYield: 7, baseCooldownMs: 14000, failureFlavor: "It grows old in moments, and dies on schedule." },
  { id: "grafting", name: "Grafting", description: "Bind two living things at the growth level.", aspectId: "root", tier: 5, baseManaCost: 65, baseMotesYield: 11, baseCooldownMs: 18000, failureFlavor: "They bind - not to each other, but to you." },
  { id: "the_deep_root", name: "The Deep Root", description: "A slow, wide effect improving area health.", aspectId: "root", tier: 6, baseManaCost: 95, baseMotesYield: 18, baseCooldownMs: 25000, failureFlavor: "Everything grows - including things that shouldn't." },
  // HUSH
  { id: "quiet_the_bell", name: "Quiet the Bell", description: "Mute a small sound source briefly.", aspectId: "hush", tier: 1, baseManaCost: 5, baseMotesYield: 1, baseCooldownMs: 1500, failureFlavor: "You hear your own heartbeat stop instead." },
  { id: "unseen_step", name: "Unseen Step", description: "Brief, minor concealment.", aspectId: "hush", tier: 2, baseManaCost: 14, baseMotesYield: 3, baseCooldownMs: 4000, failureFlavor: "You become unforgettable rather than unseen." },
  { id: "erase", name: "Erase", description: "Remove a small, specific detail.", aspectId: "hush", tier: 3, baseManaCost: 30, baseMotesYield: 3, baseCooldownMs: 12000, failureFlavor: "Once, it erased the caster's memory of casting it." },
  { id: "the_held_breath", name: "The Held Breath", description: "A wide, brief silence over an area.", aspectId: "hush", tier: 4, baseManaCost: 48, baseMotesYield: 5, baseCooldownMs: 16000, failureFlavor: "The silence lands somewhere else entirely." },
  { id: "the_unspoken_name", name: "The Unspoken Name", description: "Remove a target's ability to be identified by name.", aspectId: "hush", tier: 5, baseManaCost: 75, baseMotesYield: 8, baseCooldownMs: 22000, failureFlavor: "For a moment, no one can name YOU either." },
  { id: "the_absence", name: "The Absence", description: "A pocket where almost nothing functions, briefly.", aspectId: "hush", tier: 6, baseManaCost: 120, baseMotesYield: 14, baseCooldownMs: 45000, failureFlavor: "The pocket forms - around you." },
  // IRON
  { id: "stonewatch", name: "Stonewatch", description: "Slightly harden a small object's surface.", aspectId: "iron", tier: 1, baseManaCost: 10, baseMotesYield: 1, baseCooldownMs: 3000, failureFlavor: "Something else hardens instead - something you're holding." },
  { id: "anchor", name: "Anchor", description: "Fix an object against being moved.", aspectId: "iron", tier: 2, baseManaCost: 18, baseMotesYield: 2, baseCooldownMs: 5000, failureFlavor: "It anchors - to the wrong spot, permanently." },
  { id: "leaden_word", name: "Leaden Word", description: "Sharply increase weight, briefly.", aspectId: "iron", tier: 3, baseManaCost: 32, baseMotesYield: 3, baseCooldownMs: 9000, failureFlavor: "The floor groans under weight you didn't intend to add." },
  { id: "the_settling", name: "The Settling", description: "Make a change permanent.", aspectId: "iron", tier: 4, baseManaCost: 50, baseMotesYield: 5, baseCooldownMs: 15000, failureFlavor: "What settles isn't quite what changed." },
  { id: "bedrock", name: "Bedrock", description: "Extend Anchor across a wide area.", aspectId: "iron", tier: 5, baseManaCost: 78, baseMotesYield: 8, baseCooldownMs: 24000, failureFlavor: "The ground refuses to move ever again - including downhill water." },
  { id: "the_unmoved", name: "The Unmoved", description: "Render yourself nearly impossible to displace.", aspectId: "iron", tier: 6, baseManaCost: 115, baseMotesYield: 13, baseCooldownMs: 60000, failureFlavor: "You cannot be moved. Not by force. Not by choice either." },
];
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add gameData/core/aspects.ts && git commit -m "feat(gameData): 4 Aspects x 6-tier spell lists"
```

### Task 4: Braids + Casting Forms modules

**Files:**
- Create: `gameData/core/braids.ts`
- Create: `gameData/core/castingForms.ts`

- [ ] **Step 1: Write braids module**

```typescript
import { BraidConfig } from "../../types";

export const BRAIDS: BraidConfig[] = [
  {
    id: "smolder", name: "Smolder", parentAspects: ["ash", "hush"],
    description: "A burn with no light and no sound.",
    signatureQuirk: "Left unattended long enough, it makes noise all at once.",
    unlockChapter: 3,
    workings: [
      { id: "the_slow_ember", name: "The Slow Ember", description: "Hidden, gradual damage over time." },
      { id: "ashfall", name: "Ashfall", description: "Wider, weaker - affects an area." },
      { id: "the_cold_burn", name: "The Cold Burn", description: "Consumes without any heat." },
    ],
  },
  {
    id: "dormancy", name: "Dormancy", parentAspects: ["hush", "root"],
    description: "Silence laid over growth becomes suspended animation.",
    signatureQuirk: "Things held don't age - but they also don't heal.",
    unlockChapter: 3,
    workings: [
      { id: "the_held_season", name: "The Held Season", description: "Suspends growth and decay for a duration." },
      { id: "the_quiet_bed", name: "The Quiet Bed", description: "Extended variant for transporting the wounded." },
      { id: "the_sealed_jar", name: "The Sealed Jar", description: "Precise preservation of dangerous specimens." },
    ],
  },
  {
    id: "heartwood", name: "Heartwood", parentAspects: ["root", "iron"],
    description: "Living growth made permanent.",
    signatureQuirk: "A Heartwood object reacts, almost imperceptibly over months, to how it's treated.",
    unlockChapter: 3,
    workings: [
      { id: "the_first_graft", name: "The First Graft", description: "Permanently hardens a small living structure." },
      { id: "livingwall", name: "Livingwall", description: "Structural-scale fortification." },
      { id: "the_quiet_companion", name: "The Quiet Companion", description: "A small living keepsake bonded to its caster." },
    ],
  },
  {
    id: "temper", name: "Temper", parentAspects: ["iron", "ash"],
    description: "Weight plus consumption - put plainly, blacksmithing.",
    signatureQuirk: "The one braid taught openly as a trade.",
    unlockChapter: 3,
    workings: [
      { id: "the_first_forging", name: "The First Forging", description: "Hardens and permanently shapes worked material." },
      { id: "the_second_firing", name: "The Second Firing", description: "Refinement pass - basis of equipment upgrades." },
      { id: "the_unbreaking", name: "The Unbreaking", description: "Immune to further change, good or bad. One-way door." },
    ],
  },
];

export const BRAID_SPELLS: import("../../types").SpellConfig[] = [
  { id: "cast_smolder", name: "Weave Smolder", description: "A burn with no light and no sound.", braidId: "smolder", workingId: "the_slow_ember", tier: 1, baseManaCost: 22, baseMotesYield: 5, baseCooldownMs: 6000, failureFlavor: "The Smolder goes quiet - too quiet. It will make noise later, all at once." },
  { id: "cast_dormancy", name: "Weave Dormancy", description: "Silence laid over growth.", braidId: "dormancy", workingId: "the_held_season", tier: 1, baseManaCost: 20, baseMotesYield: 4, baseCooldownMs: 7000, failureFlavor: "Time suspends in the wrong place - including your own hands." },
  { id: "cast_heartwood", name: "Weave Heartwood", description: "Living growth made permanent.", braidId: "heartwood", workingId: "the_first_graft", tier: 1, baseManaCost: 26, baseMotesYield: 6, baseCooldownMs: 8000, failureFlavor: "The bark sets wrong, alive in a way you'll regret." },
  { id: "cast_temper", name: "Work Temper", description: "Weight plus consumption - blacksmithing.", braidId: "temper", workingId: "the_first_forging", tier: 1, baseManaCost: 30, baseMotesYield: 7, baseCooldownMs: 9000, failureFlavor: "The metal takes the temper - and remembers being wrong forever." },
];
```

- [ ] **Step 2: Write castingForms module**

```typescript
import { CastingFormModifier } from "../../types";

export const CASTING_FORMS: CastingFormModifier[] = [
  // METHOD (Ch IV)
  { id: "method_instant", axis: "method", value: "instant", displayName: "Instant", description: "Standard cost, standard reliability.", costMultiplier: 1.0, effectMultiplier: 1.0, minTier: 0 },
  { id: "method_ritual", axis: "method", value: "ritual", displayName: "Ritual", description: "Slower, more expensive - near-guaranteed and stronger.", costMultiplier: 1.5, effectMultiplier: 1.4, reliabilityBonus: 0.15, minTier: 4 },
  { id: "method_wild", axis: "method", value: "wild", displayName: "Wild", description: "Cheaper, faster, unstable - output varies meaningfully.", costMultiplier: 0.7, effectMultiplier: 1.1, variance: 0.6, minTier: 4 },
  // DURATION (Ch IV)
  { id: "duration_instant", axis: "duration", value: "instant", displayName: "Instant", description: "Resolves immediately.", costMultiplier: 1.0, effectMultiplier: 1.0, minTier: 0 },
  { id: "duration_delayed", axis: "duration", value: "delayed", displayName: "Delayed", description: "Set now, triggers later on a stated condition.", costMultiplier: 0.9, effectMultiplier: 1.2, triggerDelaySeconds: 30, minTier: 4 },
  { id: "duration_sustained", axis: "duration", value: "sustained", displayName: "Sustained", description: "Channeled - drains Mana continuously while active.", costMultiplier: 0.4, effectMultiplier: 0.8, continuousDrainPerSecond: 0.06, minTier: 4 },
  // TARGET (Ch IV)
  { id: "target_outward", axis: "target", value: "outward", displayName: "Outward", description: "Affects the world. Standard cost.", costMultiplier: 1.0, effectMultiplier: 1.0, minTier: 0 },
  { id: "target_inward", axis: "target", value: "inward", displayName: "Inward", description: "Affects the caster - cheaper, smaller.", costMultiplier: 0.5, effectMultiplier: 0.7, minTier: 4 },
];
```

Note: `minTier` gates by chapter (0 = always available). Instant forms available from start; others unlock in Chapter IV via `unlock_casting_form` effects.

- [ ] **Step 3: Build check**

Run: `npm run build` → PASS

- [ ] **Step 4: Commit**

```bash
git add gameData/core/braids.ts gameData/core/castingForms.ts && git commit -m "feat(gameData): braids + casting forms data"
```

### Task 5: Equipment slots + converters

**Files:**
- Create: `gameData/core/equipment.ts`
- Create: `gameData/core/converters.ts`

- [ ] **Step 1: Write slots (items added per-chapter)**

```typescript
import { SlotConfig } from "../../types";

export const SLOTS: SlotConfig[] = [
  { id: "focus_gear", name: "Focus Gear" },
  { id: "wardslot", name: "Wardslot" },
  { id: "farseer_lens", name: "Farseer's Lens", prerequisitesAny: [{ taskId: "braid_practice", minExecutions: 1 }] },
  { id: "current_tuner", name: "Current-Tuner", prerequisitesAny: [{ taskId: "sustain_training", minExecutions: 1 }] },
];
```

- [ ] **Step 2: Write converters**

```typescript
import { ConverterConfig } from "../../types";

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "mote_condenser",
    name: "Mote Condenser",
    description: "Compresses loose Motes back into usable Mana.",
    cost: [{ resourceId: "motes", amount: 50 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "motes", amount: 0.5 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "mana", amount: 0.4 }],
    prerequisites: [{ actionId: "mote_study", minExecutions: 3 }],
  },
  {
    id: "skyglass_tuner",
    name: "Skyglass Tuner",
    description: "A shard of the Sundering, humming. Refines Motes at remarkable rates.",
    cost: [{ resourceId: "skyglass", amount: 10 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "motes", amount: 2 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "mana", amount: 2 }],
    prerequisites: [{ resourceId: "skyglass", minMax: 1 }, { actionId: "mote_study", minExecutions: 3 }],
  },
  {
    id: "deep_current_tap",
    name: "Undertow Tap",
    description: "Draws on the world's own undertow while you work.",
    cost: [{ resourceId: "skyglass", amount: 40 }],
    canBeToggled: false,
    costPerSecond: [],
    effectsPerSecond: [{ type: "add_resource", resourceId: "deep_current", amount: 0.05 }],
    prerequisites: [{ resourceId: "deep_current", minMax: 1 }],
  },
];
```

- [ ] **Step 3: Build + validate check**

Run: `npm run build; npm run validate`
Expected: PASS both (validate may warn about prereqs referencing not-yet-created tasks until Chapter I/IV tasks exist - acceptable mid-build, resolved by Task 8)

- [ ] **Step 4: Commit**

```bash
git add gameData/core/equipment.ts gameData/core/converters.ts && git commit -m "feat(gameData): equipment slots + converters"
```

### Task 6: Engine - CAST_SPELL reducer branch + state extensions

**Files:**
- Modify: `context/GameContext.tsx`

**Interfaces:**
- Consumes: `SpellConfig`, `CASTING_FORMS` (from `gameData/core/castingForms.ts`), `SPELLS`, `ASPECTS`
- Produces: `castSpell(actionId)` context method; failure economy per DESIGN.md §6.3 (15% base when Focus insufficient → 5% mastery, never zero); aspect fluency tracking; sustained-spell drain in TICK

- [ ] **Step 1: Import new data and add helpers**

At top of GameContext.tsx:

```typescript
import { SPELLS, ASPECTS } from "../gameData/core/aspects";
import { CASTING_FORMS } from "../gameData/core/castingForms";
import { AspectID, SpellConfig, CastingFormModifier } from "../types";
```

Add helper functions above `createInitialState`:

```typescript
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
```

- [ ] **Step 2: Extend createInitialState defaults**

In `createInitialState()` return object add:

```typescript
flags: {},
aspectFluency: { ash: 0, root: 0, hush: 0, iron: 0 },
failedCastings: { ash: 0, root: 0, hush: 0, iron: 0 },
castingFormsUnlocked: Object.fromEntries(CASTING_FORMS.map(f => [f.id, f.minTier === 0])),
activeFormSelection: { method: "method_instant", duration: "duration_instant", target: "target_outward" },
chapter: 1,
sustainedSpells: [],
footprintCounter: 0,
```

- [ ] **Step 3: Add CAST_SPELL + SELECT_FORM reducer cases**

Extend `Action` union:

```typescript
| { type: "CAST_SPELL"; actionId: string }
| { type: "SELECT_FORM"; axis: "method" | "duration" | "target"; formId: string }
| { type: "TICK_SUSTAINED"; dt: number }
```

Implement `CAST_SPELL` case (mirrors TRIGGER_ACTION structure):

```typescript
case "CAST_SPELL": {
  const config = ACTIONS.find(a => a.id === action.actionId);
  if (!config || !config.spellId) return state;
  const spell = getSpellById(config.spellId);
  if (!spell) return state;

  const aState = state.actions[action.actionId];
  if (!aState?.unlocked) return state;

  const effectiveCooldown = spell.baseCooldownMs;
  if (aState.lastUsed) {
    const elapsed = Date.now() - aState.lastUsed;
    if (elapsed < effectiveCooldown) return state;
  }

  const forms = getActiveForms(state.activeFormSelection);
  const costMult = forms.reduce((m, f) => m * f.costMultiplier, 1);
  const effMult = forms.reduce((m, f) => m * f.effectMultiplier, 1);
  const variance = forms.reduce((v, f) => Math.max(v, f.variance ?? 0), 0);

  // Cost: mana scaled by spell tier growth + form multipliers
  const aspect = ASPECTS.find(a => a.id === spell.aspectId);
  const tierIndex = spell.tier - 1;
  const manaCost = Math.ceil(spell.baseManaCost * Math.pow(aspect?.costGrowthFactor ?? 1.5, 0) * costMult); // base cost flat per spell; growth handled by upgrade actions

  const manaRes = state.resources["mana"];
  if ((manaRes?.current ?? 0) < manaCost) {
    return { ...state, log: [makeLog(`Not enough Mana for ${spell.name}`, 'other'), ...state.log].slice(0, 20) };
  }

  // Failure roll
  const focusRes = state.resources["focus"];
  const focusMods = getActiveModifiers(state);
  const focusMax = calculateMax("focus", focusMods, RESOURCES.find(r => r.id === "focus")?.baseMax ?? 0);
  const failChance = computeFailureChance(spell, focusRes?.current ?? 0, focusMax, forms);

  const newResources = cloneResources(state.resources);
  newResources["mana"].current -= manaCost;

  const aspectKey: AspectID = (spell.aspectId ?? "ash") as AspectID;

  let newFluency = state.aspectFluency;
  let newFailed = state.failedCastings;
  let logUpdates: LogEntry[] = [...state.log];

  if (Math.random() < failChance) {
    // Failed casting: little Mana already spent stays spent, grants residue Motes
    const residue = Math.max(1, Math.floor(spell.baseMotesYield * 0.3));
    const moteMax = calculateMax("motes", focusMods, RESOURCES.find(r => r.id === "motes")?.baseMax ?? 0);
    newResources["motes"].current = Math.min(newResources["motes"].current + residue, moteMax);
    newFailed = { ...newFailed, [aspectKey]: newFailed[aspectKey] + 1 };
    logUpdates.unshift(makeLog(`${spell.name} fails - ${spell.failureFlavor}`, 'flavour'));
  } else {
    let yieldAmount = spell.baseMotesYield * effMult;
    if (variance > 0) {
      const roll = Math.random();
      // Wild variance: 0.4x .. (0.4 + variance*2)x output
      yieldAmount *= (0.4 + roll * variance * 2);
    }
    const moteMax = calculateMax("motes", focusMods, RESOURCES.find(r => r.id === "motes")?.baseMax ?? 0);
    newResources["motes"].current = Math.min(newResources["motes"].current + Math.round(yieldAmount), moteMax);
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
    log: logUpdates.slice(0, 50),
  };
}

case "SELECT_FORM": {
  const form = CASTING_FORMS.find(f => f.id === action.formId);
  if (!form || form.axis !== action.axis) return state;
  if (!state.castingFormsUnlocked[form.id]) return state;
  return {
    ...state,
    activeFormSelection: { ...state.activeFormSelection, [action.axis]: action.formId },
  };
}
```

- [ ] **Step 4: Handle Sustained drain in TICK**

Inside `TICK`, before passive-gen section (step 2), add:

```typescript
// Sustained spell drain
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
      logUpdates.unshift(makeLog("Sustained workings gutter out - Mana exhausted.", 'other'));
    }
  }
}
```

And include `sustainedSpells: newSustained` in the TICK return object.

- [ ] **Step 5: LOAD_GAME migration to v7**

Change `version: 6` → `version: 7` in `createInitialState`. In `LOAD_GAME`, add a `defaults`-merge path that backfills new fields (the existing spread `{...defaults, ...incoming}` handles missing keys since defaults contain them). Bump `migratedVersion` logic accordingly (existing pattern auto-bumps).

- [ ] **Step 6: Expose context methods**

In `GameProvider`:

```typescript
const castSpell = (actionId: ActionID) => dispatch({ type: "CAST_SPELL", actionId });
const selectForm = (axis: "method" | "duration" | "target", formId: string) =>
  dispatch({ type: "SELECT_FORM", axis, formId });
const getFailureChance = (spellId: string): number => {
  const spell = getSpellById(spellId);
  if (!spell) return 0;
  const forms = getActiveForms(state.activeFormSelection);
  const focusMax = getMaxResource("focus");
  return computeFailureChance(spell, state.resources["focus"]?.current ?? 0, focusMax, forms);
};
```

Add `castSpell`, `selectForm`, `getFailureChance` to provider value.

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add context/GameContext.tsx && git commit -m "feat(engine): CAST_SPELL with failure economy, forms, sustained drain, save v7"
```

---

## Phase 2: Chapter I - First Spark

### Task 7: Chapter I tasks

**Files:**
- Create: `gameData/chapter1/tasks.ts`

- [ ] **Step 1: Write the five tasks per DESIGN.md §2.1**

```typescript
import { TaskConfig } from "../../types";

export const TASKS: TaskConfig[] = [
  {
    id: "catch_your_breath",
    name: "Catch Your Breath",
    description: "The first uncontrolled casting still crackles under your skin. Calming down - not casting harder - is the way through.",
    category: "chapter1",
    progressRequired: 10,
    maxExecutions: 1,
    hideWhenComplete: false,
    costPerSecond: [],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "focus", amount: 5 },
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 5 },
    ],
    firstCompletionEffects: [
      { type: "add_item", itemId: "millers_charm", amount: 1 },
    ],
  },
  {
    id: "ember_practice",
    name: "Ember Practice",
    description: "Coax a candle flame taller and shorter on command. Introductory Ash.",
    category: "chapter1",
    costPerSecond: [{ resourceId: "focus", amount: 0.3 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 0.4 }],
    xpPerSecond: 5,
  },
  {
    id: "hedge_practice",
    name: "Hedge Practice",
    description: "Encourage a hedge to grow half an inch and stop. Introductory Root.",
    category: "chapter1",
    costPerSecond: [{ resourceId: "focus", amount: 0.3 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 0.35 }],
    xpPerSecond: 5,
  },
  {
    id: "stillness_practice",
    name: "Stillness Practice",
    description: "Silence a ringing bell early. Introductory Hush.",
    category: "chapter1",
    costPerSecond: [{ resourceId: "focus", amount: 0.3 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 0.35 }],
    xpPerSecond: 5,
  },
  {
    id: "errand_running",
    name: "Errand Running",
    description: "Non-magical village chores that quietly build Focus through routine.",
    category: "chapter1",
    type: "rest",
    costPerSecond: [],
    effectsPerSecond: [{ type: "add_resource", resourceId: "focus", amount: 0.25 }],
    xpPerSecond: 1,
  },
];
```

- [ ] **Step 2: Build check** - `npm run build` PASS
- [ ] **Step 3: Commit**

```bash
git add gameData/chapter1/tasks.ts && git commit -m "feat(ch1): five First Spark tasks"
```

### Task 8: Chapter I actions (spelling actions)

**Files:**
- Create: `gameData/chapter1/actions.ts`

**Interfaces:**
- Consumes: `SPELLS` ids `coax_the_ember`, `nudge_the_root`, `quiet_the_bell`
- Produces: action IDs `cast_ash`, `cast_root`, `cast_hush`, `study_ash_primer`, `mote_conversion_i`

- [ ] **Step 1: Write actions**

```typescript
import { ActionConfig } from "../../types";

export const ACTIONS: ActionConfig[] = [
  {
    id: "cast_ash",
    name: "Cast: Coax the Ember",
    description: "Grow or shrink an existing flame. Introductory Ash casting.",
    category: "ash",
    spellId: "coax_the_ember",
    costs: [],
    effects: [],
    maxExecutions: 999999,
    cooldownMs: 2000,
    logMessage: "The ember leans toward your intent, obedient for once.",
  },
  {
    id: "cast_root",
    name: "Cast: Nudge the Root",
    description: "Grow a small plant, once. Introductory Root casting.",
    category: "root",
    spellId: "nudge_the_root",
    costs: [],
    effects: [],
    maxExecutions: 999999,
    cooldownMs: 3000,
    logMessage: "A seed splits. Something green considers the light.",
  },
  {
    id: "cast_hush",
    name: "Cast: Quiet the Bell",
    description: "Mute a small sound source briefly. Introductory Hush casting.",
    category: "hush",
    spellId: "quiet_the_bell",
    costs: [],
    effects: [],
    maxExecutions: 999999,
    cooldownMs: 1500,
    logMessage: "The bell swings - silently. It looks almost offended.",
  },
  {
    id: "mote_conversion_i",
    name: "Condense Motes to Mana",
    description: "Press loose Motes back into your reserve. Crude, but it works.",
    category: "chapter1",
    costs: [{ resourceId: "motes", amount: 10 }],
    effects: [{ type: "add_resource", resourceId: "mana", amount: 5 }],
    maxExecutions: 999999,
    cooldownMs: 1000,
    logMessage: "The motes fold into blue light.",
  },
  {
    id: "widow_cathal_visit",
    name: "Visit Widow Cathal",
    description: "She recognizes what's happening to you before you do. She sends you toward Hollow Reach.",
    category: "chapter1",
    costs: [],
    effects: [],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 25 },
      { type: "add_resource", resourceId: "mana", amount: 25 },
      { type: "set_flag", flagId: "met_cathal", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [{ taskId: "catch_your_breath", minExecutions: 3 }],
    logMessage: "\"You will be told the Sundering is a wound,\" she says. \"It is. That's not all it is.\"",
    hideWhenComplete: true,
  },
];
```

- [ ] **Step 2: Wire cast buttons to castSpell in ActionCard**

Modify `components/ActionCard.tsx`: when `action.spellId` is present, call `castSpell(action.id)` instead of `triggerAction`. Show failure chance tooltip line using `getFailureChance(action.spellId)` when present.

- [ ] **Step 3: Build + validate** - PASS both
- [ ] **Step 4: Commit**

```bash
git add gameData/chapter1/actions.ts components/ActionCard.tsx && git commit -m "feat(ch1): cast actions wired to CAST_SPELL + Cathal hook"
```

### Task 9: Chapter I equipment + index registration

**Files:**
- Create: `gameData/chapter1/equipment.ts`
- Create: `gameData/index.ts`

- [ ] **Step 1: Miller's Charm**

```typescript
import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "millers_charm",
    name: "Miller's Charm",
    description: "A worn brass disc. Focus comes easier with something to hold.",
    slot: "focus_gear",
    effects: [{ type: "modify_max_resource_flat", resourceId: "focus", amount: 5 }],
  },
];
```

- [ ] **Step 2: Register modules in `gameData/index.ts`**

```typescript
import * as CoreCategories from "./core/categories";
import * as CoreResources from "./core/resources";
import * as CoreAspects from "./core/aspects";
import * as CoreBraids from "./core/braids";
import * as CoreCastingForms from "./core/castingForms";
import * as CoreEquipment from "./core/equipment";
import * as CoreConverters from "./core/converters";
import * as Ch1Tasks from "./chapter1/tasks";
import * as Ch1Actions from "./chapter1/actions";
import * as Ch1Equipment from "./chapter1/equipment";

export interface GameModule {
  CATEGORIES?: any[];
  RESOURCES?: any[];
  TASKS?: any[];
  ACTIONS?: any[];
  ITEMS?: any[];
  SLOTS?: any[];
  CONVERTERS?: any[];
  ASPECTS?: any[];
  SPELLS?: any[];
  BRAIDS?: any[];
  CASTING_FORMS?: any[];
}

const modules: GameModule[] = [
  CoreCategories, CoreResources, CoreAspects, CoreBraids, CoreCastingForms,
  CoreEquipment, CoreConverters, Ch1Tasks, Ch1Actions, Ch1Equipment,
];

function collect<T>(key: keyof GameModule): T[] {
  return modules.flatMap(m => (m[key] as T[]) || []);
}

export const CATEGORIES = collect<any>("CATEGORIES");
export const RESOURCES = collect<any>("RESOURCES");
export const TASKS = collect<any>("TASKS");
export const ACTIONS = collect<any>("ACTIONS");
export const ITEMS = collect<any>("ITEMS");
export const SLOTS = collect<any>("SLOTS");
export const CONVERTERS = collect<any>("CONVERTERS");
export const SPELLS = collect<any>("SPELLS");
```

Check whether an old `index.ts` exists first (`glob gameData/index.ts`) - none does per exploration, so create fresh. Verify `GameContext.tsx` imports resolve (`ACTIONS, CATEGORIES, RESOURCES, TASKS, SLOTS, ITEMS, CONVERTERS` names match).

- [ ] **Step 3: Build + validate + dev smoke test**

Run: `npm run build; npm run validate`
Expected: PASS both. Then `npm run dev` - verify Chapter I section renders, Ember Practice runs and drains Focus, Errand Running restores it, cast buttons produce Motes/failures, Miller's Charm drops from Catch Your Breath and equips (+5 Focus visible).

- [ ] **Step 4: Commit**

```bash
git add gameData/index.ts gameData/chapter1/equipment.ts && git commit -m "feat(ch1): Miller's Charm + module registry; playable First Spark"
```

---

## Phases 3-6: Chapters II-V (content packs)

Each chapter follows the identical pattern as Chapter I (tasks/actions/equipment files + one registration block in index.ts). Exact content per spec §4-§7. Tasks below summarize deliverables; implementers use spec tables verbatim.

### Task 10: Chapter II pack
- Create `gameData/chapter2/{tasks,actions,equipment}.ts`
- Tasks: stonewatch_practice (Iron loop), focus_meditation (loop, +Focus), mote_study (loop, prereq 10 total castings via actionId prereq on cast_*), library_duty (loop, small Focus, unlocks notebook history entries)
- Actions: cast_iron (Stonewatch spell), upgrades upgrade_{ash,root,hush,iron} (maxExecutions 5, prereq 10 aspect fluency via `prerequisites: [{actionId:"cast_ash",minExecutions:10}]` style, effect `modify_yield_pct` on respective cast action + `modify_cooldown_flat`), osrun_fells_choice (two exclusiveWith variants: teach_children vs keep_lead)
- Equipment: Conclave Signet (−1000ms Ash cooldown → `modify_cooldown_flat` on cast_ash), Practice Wand, Wardstone Amulet
- Skyglass unlock action `skyglass_unlock`: prereq cast actions ≥5 executions each? No - 5 clean castings total + 3 mote_study completions; effect `set_max_resource skyglass 30` + grant 20
- Register in index.ts; build+validate+dev QA; commit

### Task 11: Chapter III pack
- Advanced practice loops (higher motes yield, prereq ch2 upgrades complete), braid_practice task
- Actions cast_{smolder,dormancy,heartwood,temper} (spellId → BRAID_SPELLS ids), gated behind `undercroft_seal_opened` one-time action requiring Braidstone Ring item OR restricted inside undercroft via prereq on ring ownership (`itemId` prereq doesn't exist - use prerequisite `{actionId:"acquire_braidstone_ring"}`)
- Tier-2 upgrades ×4 (maxExecutions 10, prereq 30 aspect executions)
- Equipment: braidstone_ring, basic_lens, fine_lens items
- Journals: three read-actions setting flags journal_{one,two,three}; reconcile action granting +10 Focus + Mender flag
- Register; QA; commit

### Task 12: Chapter IV pack
- ritual_study, wild_practice, sustain_training tasks
- Mastery casts (maxExecutions 8) for 4 Aspects + 4 Braids; tier-3 upgrades ×8
- Form-unlock action `casting_forms_awakening`: unlocks method_ritual/wild, duration_delayed/sustained, target_inward via `unlock_casting_form` effects
- FormSelector UI component (small dropdown row above Activity grid bound to `selectForm`)
- Equipment: steady_hand, basic/fine current tuners
- Register; QA; commit

### Task 13: Chapter V pack
- deep_current unlock sequence (sustain training + listening tasks)
- Three path-gate actions: warden_path (prereq aspectFluency ≥100 each - approximated via cast action execution counts), mender_path (prereq long_sight item + journals flag), wellspring_path (prereq sustained multi-hold - approximated via sustain_training ≥5 + all four mastery casts ≥1)
- Path-exclusive post-content: warden zero-failure challenges (repeatable high-yield casts with reliabilityBonus), mender fracture stabilizations (delayed-form casts granting world-flag rewards), wellspring generative casts (wild+inward combos scaling off deep_current)
- Endgame equipment: undertow_fork, long_sight, archivists_charm, secret_braidstone, cathals_ashwork
- Register; QA; commit

---

## Phase 7: Side Content

### Task 14: Notebook pack
- Create `gameData/side/notebook.ts`: 17 entries as discoverable one-time actions/tasks per spec §8.1 tables (world finds gated by chapter flags, study entries gated by library_duty, craft hunts granting equipment, failure lessons requiring deliberate failures - tracked via failedCastings counts surfaced as prerequisite on new helper actions)
- Register; QA; commit

### Task 15: Secret sequences + bestiary
- Create `gameData/side/sequences.ts`: fourfold_rite, menders_working, wellspring_test as multi-prereq one-time actions granting big stat boosts + path progress flags
- Create `gameData/side/bestiary.ts`: narrative-only creature entries rendered as a collapsible info section (data-only module; UI: simple list under a new "Codex" tab shown once any bestiary entry unlocked)
- Register; QA; commit

## Phase 8: Live Content

### Task 16: Seasonal calendar + challenge modes
- Create `gameData/live/seasons.ts`: month-indexed modifier table applied via a `SEASONAL_MODIFIERS` export consumed in `getActiveModifiers` (Ash ×2 during Cinderfall etc.)
- Weekly rotation: deterministic week-number-seeded goal generator (pure function `getWeeklyGoal(date)` in same module)
- Challenge modes: NG+ via reset preserving flags+equipment (`SECOND_KINDLING` reducer case), challenge-mode start options recorded in `state.flags.challenge_mode`
- Register; QA; commit

### Task 17: Final validation sweep
- [ ] `npm run build` PASS
- [ ] `npm run validate` PASS (no dup IDs across ALL modules incl. side/live)
- [ ] Full manual progression test Ch1→Ch2→Ch3→Ch4→Ch5 in dev (use console-assisted resource grants for pacing)
- [ ] Save v7 round-trip: save → reload → import/export intact
- [ ] Update AGENTS.md Known Bugs table statuses touched by this work
