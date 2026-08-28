# SUNDERED Core Engine + Chapter I Implementation Spec

**Date:** 2026-08-26  
**Status:** Approved for Implementation  
**Scope:** Core engine extensions for SUNDERED + Chapter I "First Spark" content

---

## 1. Overview

Implement the SUNDERED game's core engine infrastructure (supporting 4 Aspects, 4 Braids, Casting Forms) and Chapter I "First Spark" content per DESIGN.md §2.1. This establishes the foundation for all 5 chapters.

---

## 2. New Types (types.ts Extensions)

### 2.1 CastingFormModifier
```typescript
export interface CastingFormModifier {
  id: string;
  axis: 'method' | 'duration' | 'target';
  value: 'instant' | 'ritual' | 'wild' | 'delayed' | 'sustained' | 'outward' | 'inward';
  costMultiplier: number;
  effectMultiplier: number;
  variance?: number;          // For Wild-method unpredictability (0-1)
  triggerCondition?: string;  // For Delayed-duration spells
}
```

### 2.2 AspectConfig
```typescript
export interface AspectConfig {
  id: 'ash' | 'root' | 'hush' | 'iron';
  name: string;
  description: string;
  color: string;              // Tailwind class for UI
  costGrowth: 'steep' | 'shallow' | 'moderate';
  yieldGrowth: 'steep_early' | 'shallow_early' | 'moderate' | 'shallow';
  failureFlavor: string;      // Narrative description of characteristic failure
}
```

### 2.3 BraidConfig
```typescript
export interface BraidConfig {
  id: 'smolder' | 'dormancy' | 'heartwood' | 'temper';
  name: string;
  parentAspects: ['ash' | 'root' | 'hush' | 'iron', 'ash' | 'root' | 'hush' | 'iron'];
  description: string;
  workings: BraidWorking[];
  signatureQuirk: string;
}

export interface BraidWorking {
  id: string;
  name: string;
  description: string;
}
```

### 2.4 UnlockPath
```typescript
export interface UnlockPath {
  id: string;
  effect: 'modify_max_resource_flat' | 'increase_stat_flat' | 'set_flag';
  resourceId?: string;
  target?: string;
  amount: number;
  condition?: {
    type: 'tasksCompleted' | 'aspectFluencyLevel' | 'levelReached' | 'cleanCastings' | 'studySessions';
    value: number;
  };
}
```

### 2.5 New Effect Types (add to Effect.type union)
- `modify_casting_form` - Apply a casting form modifier
- `apply_failure_effect` - Execute failure-specific effect
- `modify_failure_chance` - Adjust failure probability
- `set_flag` - Set a persistent boolean flag for secret sequences
- `modify_max_resource_pct` - Already exists, used for Skyglass/Deep Current

### 2.6 New Cost/Effect Fields
```typescript
// Add to Cost interface
aspectId?: 'ash' | 'root' | 'hush' | 'iron';  // For aspect-specific scaling

// Add to Effect interface  
aspectId?: 'ash' | 'root' | 'hush' | 'iron';
braidId?: 'smolder' | 'dormancy' | 'heartwood' | 'temper';
formModifiers?: CastingFormModifier[];  // Applied when this effect triggers
```

---

## 3. New Reducer Actions (GameContext.tsx)

### 3.1 CAST_SPELL
```typescript
{ type: "CAST_SPELL"; spellId: string; formModifiers?: CastingFormModifier[] }
```
- Finds spell config by ID (from new SPELLS array in types.ts)
- Applies Method/Duration/Target modifiers to cost and effect
- Calculates failure chance based on Focus vs spell complexity
- On success: applies effects with yield calculation
- On failure: applies failure effect (Aspect-specific), grants partial Motes
- Respects cooldownMs

### 3.2 TOGGLE_CASTING_FORM
```typescript
{ type: "TOGGLE_CASTING_FORM"; formId: string; enabled: boolean }
```
- Enables/disables a casting form modifier for the player
- Updates state.castingForms[formId].enabled

### 3.3 State Extensions
```typescript
// Add to GameState
castingForms: Record<string, { enabled: boolean }>;
flags: Record<string, boolean>;           // For secret sequences
aspectFluency: Record<'ash'|'root'|'hush'|'iron', number>; // Clean castings per Aspect
```

---

## 4. GameData Structure (Hybrid Organization)

```
gameData/
├── index.ts                    # Module registry
├── core/
│   ├── categories.ts           # 4 Aspects, 4 Braids, 5 Chapters as categories
│   ├── resources.ts            # Mana, Focus, Motes, Skyglass, Deep Current
│   ├── castingForms.ts         # 9 modifiers (3 Method × 3 Duration × 2 Target combos)
│   ├── equipment.ts            # 4 slots + Chapter I items
│   └── converters.ts           # Motes→Mana converters (unlocked later)
├── chapter1/
│   ├── resources.ts            # Chapter I baseMax/initialAmount overrides
│   ├── tasks.ts                # 5 tasks per DESIGN.md §2.1
│   ├── actions.ts              # 5 actions (3 casts + 2 training)
│   └── equipment.ts            # Miller's Charm
└── shared/
    └── _template.ts            # Unchanged
```

---

## 5. Chapter I Content (per DESIGN.md §2.1)

### 5.1 Resources
| ID | Name | Type | baseMax | Initial | Category |
|----|------|------|---------|---------|----------|
| mana | Mana | basic | 100 | 50 | chapter1 |
| focus | Focus | stat | 30 | 15 | chapter1 |
| motes | Motes | basic | 999999 | 0 | chapter1 |

### 5.2 Categories
- `chapter1` - "Chapter I: First Spark"
- `ash` - "Ash" (Aspect category)
- `root` - "Root"
- `hush` - "Hush"
- `iron` - "Iron"

### 5.3 Tasks
| ID | Name | Type | Cost/s | Effects/s | Progress | Prereqs |
|----|------|------|--------|-----------|----------|---------|
| catch_your_breath | Catch Your Breath | Timed (1×) | focus: 1 | - | 10s | - |
| ember_practice | Ember Practice | Loop (∞) | focus: 0.5 | mana: -2, motes: 0.5 | - | - |
| hedge_practice | Hedge Practice | Loop (∞) | focus: 0.5 | mana: -2, motes: 0.5 | - | - |
| stillness_practice | Stillness Practice | Loop (∞) | focus: 0.5 | mana: -2, motes: 0.5 | - | - |
| errand_running | Errand Running | Loop (∞) | - | focus: 0.2 | - | - |

### 5.4 Actions
| ID | Name | Type | Costs | Effects | Max |
|----|------|------|-------|---------|-----|
| cast_ash | Coax the Ember | Repeatable | mana: 8 | motes: 2 | - |
| cast_root | Nudge the Root | Repeatable | mana: 6 | motes: 1 | - |
| cast_hush | Quiet the Bell | Repeatable | mana: 5 | motes: 1 | - |
| focus_meditation | Focus Meditation | Repeatable | focus: 5 | focus: +2 (flat max) | - |
| mote_study | Mote Study | Repeatable | motes: 10 | mana: +5 (flat max) | - |

### 5.5 Equipment
| Slot | Item | Effects |
|------|------|---------|
| focusGear | Miller's Charm | +5 Focus (modify_max_resource_flat) |

### 5.6 Slots (Core)
- `focusGear` - "Focus Gear" (prereq: none)
- `wardslot` - "Ward Slot" (prereq: focus_meditation ×1)
- `farseerLens` - "Farseer's Lens" (prereq: Chapter III)
- `currentTuner` - "Current Tuner" (prereq: Chapter IV)

---

## 6. Implementation Order

1. **types.ts** - Add all new interfaces and extend Effect/Cost unions
2. **gameData/core/categories.ts** - Define Aspects, Braids, Chapters
3. **gameData/core/resources.ts** - Define all 5 resources
4. **gameData/core/castingForms.ts** - Define 9 form modifiers
5. **gameData/core/equipment.ts** - Define 4 slots + Chapter I items
6. **gameData/core/converters.ts** - Define Motes→Mana converter
7. **gameData/chapter1/resources.ts** - Chapter I overrides
8. **gameData/chapter1/tasks.ts** - 5 tasks
9. **gameData/chapter1/actions.ts** - 5 actions
10. **gameData/chapter1/equipment.ts** - Miller's Charm
11. **gameData/index.ts** - Register all modules
12. **GameContext.tsx** - Add CAST_SPELL, TOGGLE_CASTING_FORM, state extensions
13. **components/** - Update ActionCard/TaskCard for casting forms UI (minimal)
14. **Validation** - npm run build, npm run validate, manual QA

---

## 7. Validation Criteria

- [ ] `npm run build` passes (TypeScript compiles)
- [ ] `npm run validate` passes (no duplicate IDs, no dangling refs)
- [ ] Game loads in `npm run dev` without console errors
- [ ] Chapter I tasks visible and functional
- [ ] Mana/Focus/Motes display correctly in left/right panels
- [ ] Casting actions work, produce Motes, respect costs
- [ ] Miller's Charm equips and grants +5 Focus
- [ ] Save/Export/Import/Reset work
- [ ] No TypeScript errors in new code

---

## 8. Out of Scope (Future Phases)

- Braided casting (Chapter III)
- Casting Forms UI integration (Chapter IV)
- Secret sequences (Chapter V)
- Endgame content
- Seasonal events
- Bestiary
- Challenge modes