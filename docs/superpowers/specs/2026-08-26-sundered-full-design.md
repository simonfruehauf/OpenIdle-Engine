# SUNDERED Full Implementation Spec

**Date:** 2026-08-26  
**Status:** Approved for Implementation  
**Scope:** Complete 5-chapter SUNDERED game per DESIGN.md

---

## 1. Overview

Implement the full SUNDERED game: a fantasy idle-RPG where players master four Aspects of magic (Ash, Root, Hush, Iron), combine them into Braids (Smolder, Dormancy, Heartwood, Temper), shape spells through Casting Forms (Method/Duration/Target), and choose one of three endgame paths (Warden, Mender, Wellspring).

Phased approach: **Core Engine → Chapter I → Chapter II → Chapter III → Chapter IV → Chapter V → Side Content → Live Content**

---

## 2. Phase 1: Core Engine Systems

### 2.1 New Types (types.ts)

#### SpellConfig
```typescript
export interface SpellConfig {
  id: string;
  name: string;
  description: string;
  aspectId: 'ash' | 'root' | 'hush' | 'iron';
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  baseManaCost: number;
  baseMotesYield: number;
  baseCooldownMs: number;
  costGrowth: 'steep' | 'shallow' | 'moderate';
  yieldGrowth: 'steep_early' | 'shallow_early' | 'moderate' | 'shallow';
  failureFlavor: string;
  failureEffect?: Effect;  // Aspect-specific failure
}
```

#### AspectConfig
```typescript
export interface AspectConfig {
  id: 'ash' | 'root' | 'hush' | 'iron';
  name: string;
  description: string;
  color: string;
  costGrowth: 'steep' | 'shallow' | 'moderate';
  yieldGrowth: 'steep_early' | 'shallow_early' | 'moderate' | 'shallow';
  failureFlavor: string;
  spells: SpellConfig[];  // 6 tiers
}
```

#### BraidConfig
```typescript
export interface BraidConfig {
  id: 'smolder' | 'dormancy' | 'heartwood' | 'temper';
  name: string;
  parentAspects: ['ash' | 'root' | 'hush' | 'iron', 'ash' | 'root' | 'hush' | 'iron'];
  description: string;
  workings: BraidWorking[];
  signatureQuirk: string;
  unlockCondition: {
    type: 'chapter' | 'aspectFluency' | 'braidPractice';
    value: number;
  };
}

export interface BraidWorking {
  id: string;
  name: string;
  description: string;
  baseManaCost: number;
  baseMotesYield: number;
  baseCooldownMs: number;
}
```

#### CastingFormModifier
```typescript
export interface CastingFormModifier {
  id: string;
  axis: 'method' | 'duration' | 'target';
  value: 'instant' | 'ritual' | 'wild' | 'delayed' | 'sustained' | 'outward' | 'inward';
  displayName: string;
  description: string;
  costMultiplier: number;
  effectMultiplier: number;
  variance?: number;           // 0-1, for Wild
  triggerCondition?: string;   // For Delayed
  reliabilityModifier?: number; // For Ritual
  unlockCondition?: {
    type: 'chapter' | 'practiceCount';
    value: number;
  };
}
```

#### UnlockPath
```typescript
export interface UnlockPath {
  id: string;
  effect: 'modify_max_resource_flat' | 'increase_stat_flat' | 'set_flag' | 'unlock_braid' | 'unlock_form';
  resourceId?: string;
  target?: string;
  amount: number;
  condition?: {
    type: 'tasksCompleted' | 'aspectFluencyLevel' | 'levelReached' | 'cleanCastings' | 'studySessions' | 'braidPractice' | 'sustainedCastings' | 'listeningTasks';
    value: number;
  };
}
```

#### Effect Type Extensions
Add to `Effect.type` union:
- `modify_casting_form`
- `apply_failure_effect`
- `modify_failure_chance`
- `set_flag`
- `unlock_braid`
- `unlock_casting_form`
- `modify_aspect_fluency`

#### Cost/Effect Field Extensions
```typescript
// Cost
aspectId?: 'ash' | 'root' | 'hush' | 'iron';
braidId?: 'smolder' | 'dormancy' | 'heartwood' | 'temper';

// Effect
aspectId?: 'ash' | 'root' | 'hush' | 'iron';
braidId?: 'smolder' | 'dormancy' | 'heartwood' | 'temper';
formModifiers?: CastingFormModifier[];
```

### 2.2 Reducer Actions (GameContext.tsx)

```typescript
// Core casting
{ type: "CAST_SPELL"; spellId: string; formModifiers?: CastingFormModifier[] }

// Casting form toggles
{ type: "TOGGLE_CASTING_FORM"; formId: string; enabled: boolean }

// Braid unlocks
{ type: "TOGGLE_BRAID"; braidId: string; enabled: boolean }

// Flag system for secrets
{ type: "SET_FLAG"; flagId: string; value: boolean }

// Aspect fluency tracking
{ type: "INCREMENT_ASPECT_FLUENCY"; aspectId: 'ash' | 'root' | 'hush' | 'iron' }
```

### 2.3 GameState Extensions
```typescript
castingForms: Record<string, { enabled: boolean; unlocked: boolean }>;
flags: Record<string, boolean>;
aspectFluency: Record<'ash'|'root'|'hush'|'iron', number>;
braidUnlocks: Record<'smolder'|'dormancy'|'heartwood'|'temper', boolean>;
braidPracticeCounts: Record<'smolder'|'dormancy'|'heartwood'|'temper', number>;
chapter: 1 | 2 | 3 | 4 | 5;
endgamePath?: 'warden' | 'mender' | 'wellspring';
```

### 2.4 Core Resources (gameData/core/resources.ts)
| ID | Name | Type | baseMax | Initial | Category |
|----|------|------|---------|---------|----------|
| mana | Mana | basic | 100 | 50 | resources |
| focus | Focus | stat | 30 | 15 | resources |
| motes | Motes | basic | 999999 | 0 | resources |
| skyglass | Skyglass | basic | 0 | 0 | resources |
| deepCurrent | Deep Current | stat | 100 | 20 | resources |

### 2.5 Aspects (gameData/core/aspects.ts) - 24 spells total
**Ash (6 tiers):** Coax the Ember, Kindle's Touch, Spendthrift's Flare, The Long Burn, Second Wind, The Last Match
**Root (6 tiers):** Nudge the Root, Knit, Bramble Snare, The Long Season, Grafting, The Deep Root
**Hush (6 tiers):** Quiet the Bell, Unseen Step, Erase, The Held Breath, The Unspoken Name, The Absence
**Iron (6 tiers):** Stonewatch, Anchor, Leaden Word, The Settling, Bedrock, The Unmoved

### 2.6 Braids (gameData/core/braids.ts) - 12 workings total
**Smolder (Ash+Hush):** The Slow Ember, Ashfall, The Cold Burn
**Dormancy (Hush+Root):** The Held Season, The Quiet Bed, The Sealed Jar
**Heartwood (Root+Iron):** The First Graft, Livingwall, The Quiet Companion
**Temper (Iron+Ash):** The First Forging, The Second Firing, The Unbreaking

### 2.7 Casting Forms (gameData/core/castingForms.ts) - 18 combos
**Method:** Instant (1.0×), Ritual (1.5× cost, 0.95 failure), Wild (0.7× cost, 1.5× variance)
**Duration:** Instant, Delayed (triggerCondition), Sustained (continuous drain)
**Target:** Outward (1.0×), Inward (0.5× cost, 0.7× effect)

### 2.8 Equipment Slots (gameData/core/equipment.ts)
| Slot ID | Name | Prerequisites |
|---------|------|---------------|
| focusGear | Focus Gear | none |
| wardslot | Ward Slot | focus_meditation ×1 |
| farseerLens | Farseer's Lens | Chapter III |
| currentTuner | Current Tuner | Chapter IV |

---

## 3. Phase 2: Chapter I - First Spark

### 3.1 Setting & Narrative
Millhollow village, edge of Sundering's light. Widow Cathal sends player to Hollow Reach.

### 3.2 Resources (Chapter I overrides)
- Mana: baseMax 100, initial 50
- Focus: baseMax 30, initial 15
- Motes: baseMax ∞, initial 0
- Skyglass: hidden (baseMax 0)
- Deep Current: hidden (baseMax 0)

### 3.3 Tasks
| ID | Name | Type | Cost/s | Effects/s | Progress | Prereqs |
|----|------|------|--------|-----------|----------|---------|
| catch_your_breath | Catch Your Breath | Timed (1×) | focus: 1 | - | 10s | - |
| ember_practice | Ember Practice | Loop (∞) | focus: 0.5 | mana: -2, motes: 0.5 | - | - |
| hedge_practice | Hedge Practice | Loop (∞) | focus: 0.5 | mana: -2, motes: 0.5 | - | - |
| stillness_practice | Stillness Practice | Loop (∞) | focus: 0.5 | mana: -2, motes: 0.5 | - | - |
| errand_running | Errand Running | Loop (∞) | - | focus: 0.2 | - | - |

### 3.4 Actions
| ID | Name | Costs | Effects | Max |
|----|------|-------|---------|-----|
| cast_ash | Coax the Ember | mana: 8 | motes: 2 | - |
| cast_root | Nudge the Root | mana: 6 | motes: 1 | - |
| cast_hush | Quiet the Bell | mana: 5 | motes: 1 | - |
| focus_meditation | Focus Meditation | focus: 5 | focus: +2 (flat max) | - |
| mote_study | Mote Study | motes: 10 | mana: +5 (flat max) | - |

### 3.5 Equipment
- Miller's Charm (focusGear): +5 Focus

---

## 4. Phase 3: Chapter II - Four Aspects

### 4.1 Setting
Hollow Reach, Conclave under the scar. Iron-work infrastructure.

### 4.2 Resources (additions)
- Skyglass: baseMax 0, unlock path `skyglass_unlock` (5 clean castings + 3 study)
- Focus: baseMax 30 → 40
- Motes: initial 5

### 4.3 Tasks (additions)
| ID | Name | Type | Unlock |
|----|------|------|--------|
| stonewatch_practice | Stonewatch Practice | Loop (∞) | Chapter II |
| focus_meditation | Focus Meditation | Loop (∞) | Catch Your Breath |
| mote_study | Mote Study | Loop (∞) | 10 castings any |
| library_duty | Library Duty | Loop (∞) | Osrun Fell |

### 4.4 Actions
**Cast Actions (repeatable 3× → upgrade):**
- cast_ash, cast_root, cast_hush (carried over)
- cast_iron (new, Chapter II unlock)

**Upgrade Actions (one-time 5×):**
- upgrade_ash, upgrade_root, upgrade_hush, upgrade_iron (10 castings req)

### 4.5 Equipment
| Item | Slot | Effect | Unlock |
|------|------|--------|--------|
| Conclave Signet | focusGear | -1000ms Ash cooldown | 20 Ash castings |
| Practice Wand | wardslot | +2 failed-casting recovery | Chapter I |
| Wardstone Amulet | wardslot | +3 Focus | 50 practice loops |

### 4.6 Narrative Choice
Osrun Fell: teach children (slows progress, improves all future Focus training) vs. keep lead.

---

## 5. Phase 4: Chapter III - Braided Casting

### 5.1 Setting
Flooded Undercroft, sealed Year 74 behind braid-only lock.

### 5.2 Resources
- Focus: baseMax 40, initial 20
- Motes: initial 8
- Skyglass: baseMax 30

### 5.3 Tasks
- Advanced ember/hedge/stillness/stonewatch practice (higher Motes)
- Advanced mote_study
- braid_practice (Chapter III unlock)

### 5.4 Actions
**Braid Castings (repeatable 5×):**
- cast_smolder, cast_dormancy, cast_heartwood, cast_temper

**Tier-2 Upgrades (one-time 10×, 30 castings req):**
- upgrade_ash_2, upgrade_root_2, upgrade_hush_2, upgrade_iron_2

### 5.5 Equipment
- Braidstone Ring (focusGear): enables braided casting outside Undercroft
- Basic Lens (farseerLens): reveals braid hidden secondary effect
- Fine Lens (farseerLens): +2 Focus, reveals all secondary effects

---

## 6. Phase 5: Chapter IV - Casting Forms

### 6.1 Setting
Conclave ritual hall, Greyfen battlefield, Hollow Reach market.

### 6.2 Resources
- Mana: baseMax 150, initial 75
- Focus: baseMax 50, initial 25
- Motes: initial 12
- Skyglass: baseMax 80

### 6.3 Tasks
- ritual_study, wild_practice, sustain_training (Chapter IV unlock)
- Mastery-tier versions of 4 base practice loops

### 6.4 Actions
**Mastery Casting (repeatable 8×):**
- All 4 Aspects + 4 Braids at mastery tier

**Tier-3 Upgrades (one-time 15×, 60 castings req):**
- upgrade_ash_3, upgrade_root_3, upgrade_hush_3, upgrade_iron_3
- upgrade_smolder_3, upgrade_dormancy_3, upgrade_heartwood_3, upgrade_temper_3

### 6.5 Equipment
- Fine Lens (carried over)
- Basic Current-Tuner (currentTuner): better Motes→Mana rate
- Fine Current-Tuner (currentTuner): +3 Focus, better conversion
- The Steady Hand (focusGear): +8 Focus, reduces Wild variance (40 Wild practice)

---

## 7. Phase 6: Chapter V - The Wound Answers

### 7.1 Three Endgame Paths

**Warden (Mastery):**
- 100+ clean castings each Aspect
- Post-game: zero-failure challenges, Temper equipment tier

**Mender (Healing):**
- Braided casting path + Long Sight + stabilize fracture
- Post-game: investigate new fractures, world consequences

**Wellspring (Transcendence):**
- Hold 5 simultaneous spells across 4 Aspects (Wellspring Test)
- Cast from no known Aspect
- Post-game: generative spell assembly system

### 7.2 Resources
- Skyglass: baseMax 80
- Deep Current: baseMax 100, initial 20 (stat)

### 7.3 Equipment
- The Undertow Fork (currentTuner): tap Deep Current directly
- The Long Sight (farseerLens): reveals fracture locations (Mender)
- The Archivist's Charm (focusGear): +10 Focus, -500ms all cooldowns (Fourfold Rite)
- The Secret Braidstone (focusGear): combine any two Aspects for bonus effect (Mender's Working)
- Widow Cathal's Ashwork (focusGear): unique undiscovered effect

---

## 8. Phase 7: Side Content

### 8.1 Notebook Entries (gameData/side/notebook.ts)
**World:** Chimney Primer, Patient Well, Unwitnessed Garden, Missing Verse, Widow Cathal's Box
**Study:** Ashen/Root/Hush/Iron History, Year 74 Journals
**Craft:** Charm-Maker's Hunt, Braidstone Hunt, Farseer's Commission, Deryn's Old Kit
**Failure:** Successful Misfire, Lesson of Ash, Lesson of Iron, Lesson of Hush

### 8.2 Secret Sequences (gameData/side/sequences.ts)
- Fourfold Rite: 4 Aspects ×10 clean castings fixed order → +15 Focus, +20 Mana, Warden progress
- Mender's Working: 10 braids across 3+ types + stabilize fracture Delayed → +10 Focus, Long Sight, Mender progress
- Wellspring Test: 5 simultaneous spells across 4 Aspects → +20 Focus, +30 Mana, Wellspring progress

### 8.3 Hidden Resources
- Skyglass: 5 clean castings + 3 study → +20 Skyglass
- Deep Current: Sustain 2 Aspects + 3 listening → +15 Deep Current

### 8.4 Hidden Equipment
- The Archivist's Charm, The Secret Braidstone, Widow Cathal's Ashwork

---

## 9. Phase 8: Live Content & Polish

### 9.1 Monthly Events
| Month | Theme | Bonus | Carry-Over |
|-------|-------|-------|------------|
| Cinderfall | Ash | yields ×2 | +10% Mana regen |
| Long Bloom | Root | braid cost -1 | Lasting braid discount |
| Quiet Week | Hush | timing gear available | +5 Focus |
| Deep Rest | Iron | lowest yield, largest gain | 1.5× Iron yield permanent |

### 9.2 Quarterly Events
- The Steady Season: Balance meter, perfect balance = bonus
- The Widening: Sundering flares, failure rates ↑, rewards ↑

### 9.3 Weekly Rotations
Rotating goals (cast X Aspect, sustain Y duration, collect Z Motes) - 7 day cycles.

### 9.4 Challenge Modes
- Second Kindling (NG+): equipment + Temper workings intact, higher start, immediate endgame access
- Quiet Run: speed challenge, fixed time window
- Bare-Handed: Chapter I equipment only, no Temper
- Single Thread: One Aspect only (6 tiers = full build)
- Unwitnessed: Hush challenge, minimize footprint counter

### 9.5 Bestiary (gameData/side/bestiary.ts)
- Emberling (Ash): scavengers, indicate Smolder left too long
- Bramblehound (Root): feral dogs entangled in vines
- The Unremembered (Hush): thoroughly Hush-affected, hard to recall
- Greyfen Sentinel (Iron): Anchored constructs, permanent fixtures

---

## 10. File Structure

```
gameData/
├── index.ts
├── core/
│   ├── categories.ts      # Aspects, Braids, Chapters, Resources categories
│   ├── resources.ts       # 5 core resources
│   ├── aspects.ts         # 4 Aspects × 6 spells = 24 spells
│   ├── braids.ts          # 4 Braids × 3 workings = 12 workings
│   ├── castingForms.ts    # 18 form modifiers
│   ├── equipment.ts       # 4 slots + all items
│   └── converters.ts      # Motes→Mana converters
├── chapter1/
│   ├── resources.ts
│   ├── tasks.ts
│   ├── actions.ts
│   └── equipment.ts
├── chapter2/
│   ├── resources.ts
│   ├── tasks.ts
│   ├── actions.ts
│   └── equipment.ts
├── chapter3/
│   ├── resources.ts
│   ├── tasks.ts
│   ├── actions.ts
│   └── equipment.ts
├── chapter4/
│   ├── resources.ts
│   ├── tasks.ts
│   ├── actions.ts
│   └── equipment.ts
├── chapter5/
│   ├── resources.ts
│   ├── tasks.ts
│   ├── actions.ts
│   └── equipment.ts
├── side/
│   ├── notebook.ts        # Notebook entries
│   ├── sequences.ts       # Secret sequences
│   └── bestiary.ts        # Creatures
└── shared/
    └── _template.ts
```

---

## 11. Validation Criteria (Per Phase)

Each phase must pass:
- [ ] `npm run build` (TypeScript compiles)
- [ ] `npm run validate` (no duplicate IDs, no dangling refs)
- [ ] `npm run dev` loads without console errors
- [ ] New content visible and functional
- [ ] Save/Export/Import/Reset work
- [ ] No TypeScript errors

---

## 12. Implementation Dependencies

```
Phase 1 (Core) ──► Phase 2 (Ch I) ──► Phase 3 (Ch II) ──► Phase 4 (Ch III)
                                                               │
Phase 8 (Live) ◄── Phase 7 (Side) ◄── Phase 6 (Ch V) ◄── Phase 5 (Ch IV)
```

Each phase produces independently testable software.

---

## 13. Out of Scope

- Multiplayer/social features
- Mobile-specific UI (responsive only)
- Offline progress (wall-clock delta)
- Combat mechanics (bestiary is narrative)
- Prestige/reset system (beyond NG+)