# Architecture - OpenIdle Engine

> Agent-facing map of how the engine fits together. Read this before touching `context/`, `types.ts`, or `gameData/`.

## 1. Mental Model

```
gameData/*.ts  ──(import)──>  gameData/index.ts  ──(aggregates)──>  config (RESOURCES, TASKS, ACTIONS, ...)
                                    │
                                    v
                              GameContext.tsx
                         ┌──────────────────────┐
                         │  createInitialState() │
                         │  gameReducer (TICK,   │
                         │   TRIGGER_ACTION,     │
                         │   TOGGLE_TASK, ...)   │
                         │  TICK loop (100ms)    │
                         │  modifiers / yields   │
                         │  persistence          │
                         └──────────┬───────────┘
                                    │  useGame()
                                    v
                           App.tsx + components/*
                         (ResourceRow, TaskCard,
                          ActionCard, EquipmentView,
                          ConverterCard)
```

* **Data-driven:** All game content is declarative config in `gameData/`. Core logic never needs to be forked to add content.
* **Single source of truth:** `GameState` (`types.ts:196`) is the only mutable state. Everything else derives from it.

## 2. Key Files

| Path | Purpose | When to edit |
|------|---------|--------------|
| `types.ts` | All config + runtime interfaces | Adding a new effect/cost/field |
| `context/GameContext.tsx` | Reducer, loop, modifiers, persistence | Core engine change only |
| `gameData/index.ts` | Module registry; merges arrays | Registering a new module |
| `gameData/resources.ts`, `tasks.ts`, `actions.ts`, `equipment.ts`, `converters.ts`, `categories.ts` | Default content | Example content, not engine |
| `gameData/cat/catpaths.ts` | Example branching quest pack | Pattern for your own pack |
| `App.tsx` | 3-column layout + tab routing | UI layout change |
| `components/*` | Pure presentational cards/rows | UI tweak, tooltip, styling |
| `vite.config.ts` / `tsconfig.json` | Tooling | Build config |

## 3. State Shape (`types.ts:210`)

```ts
GameState {
  version:    number              // save migration version (current 6)
  resources:  Record<ResourceID, { current, unlocked }>
  actions:    Record<ActionID,   { executions, unlocked, lastUsed? }>
  tasks:      Record<TaskID,     { active, level, xp, unlocked, progress?, completions?, paid? }>
  converters: Record<ConverterID,{ owned, active, unlocked }>
  inventory:  ItemID[]
  equipment:  Record<SlotID, ItemID>
  modifiers:  Modifier[]          // permanent buffs from actions/tasks/items
  log: LogEntry[]                 // last 50 entries {msg, category}, newest first
  activeTaskIds: string[]         // ordered running tasks
  maxConcurrentTasks: number      // multitasking cap
  restTaskId / previousTaskId     // auto-rest fallback
  totalTimePlayed: number
}
```

`createInitialState()` (`GameContext.tsx:129`) builds this from config. `LOAD_GAME` (`:229`) merges saved JSON over defaults and runs versioned migrations (e.g. v5→v6 fixes cat/insight clamping) so schema stays forward-compatible.

## 4. Game Loop (`GameContext.tsx:1098`)

* **Tick rate:** `TICK_RATE = 100` ms via `setInterval`. Dispatches `{type:"TICK", dt:100}`.
* **Determinism:** `dt` is fixed; never uses wall-clock delta. Offline progress is **not implemented** (missing feature).
* **Order inside `TICK` (`GameContext.tsx:564`):**

  1. Start-cost payment for auto-restarting timed tasks.
  2. Continuous cost deduction (`costPerSecond` scaled by level/completions). If unaffordable → pause task, optionally auto-switch to `restTaskId`.
  3. Auto-rest return: if resting and previous task's resources are all at max → swap back.
  4. Progress completion (`progressRequired`). Awards `completionEffects` / `firstCompletionEffects` via `applyTaskEffect`.
  5. Continuous `effectsPerSecond` (streamed) + `modify_yield` pipeline.
  6. Drops (`chancePerSecond * dt`) + XP/level (`xpPerSecond`, threshold = `level * 100`).
  7. `passiveGen` from `ResourceConfig.passiveGen` (floored to integer source units).
  8. `modify_passive_gen` modifiers.
  9. Active converters (skip silently if unaffordable; do not deactivate).
  10. Clamp `current` to `[0, max]`; if `max <= 0` force `current = 0` (hidden resource).
  11. Latch unlocks: any `!unlocked && checkPrereqsInternal(...)` → `unlocked = true`. Never re-locks.

## 5. Modifier & Yield Pipeline

### 5.1 Max calculation (`calculateMax` @ `GameContext.tsx:46`)

```
startingBase = max( baseMax, ...setModifiers )
result = floor((startingBase + sum(flat,max)) * (1 + sum(percent,max)))
```

* `set` modifiers (`set_max_resource`) override base; multiples take the largest.
* `flat`/`percent` then stack additively. Equipment modifiers are merged in `getActiveModifiers()` (`GameContext.tsx:15`).

### 5.2 Yield calculation (`calculateYield` @ `GameContext.tsx:70`)

```
yield = (baseAmount + sum(flat,yield)) * (1 + sum(percent,yield))
```

Matching rules per modifier: `property === 'yield'`, then **source match** (global if no `taskId`/`actionId`, else exact) AND **resource match** (if `resourceId` set, must equal target, else wildcard). Flat/percent are additive within their bucket.

Applied in:
* `TRIGGER_ACTION` → `applyEffectWithYield`
* `TICK` → `applyTaskEffect` for completions + streamed `effectsPerSecond` (flat scaled by `dtSeconds`).

### 5.3 Effect costs scaling (`getScaledCost`)

* `!scaleFactor` → raw `amount`.
* `scalesByCompletion ? completions : (level-1)` for tasks; `executions` for actions.
* `scaleType`: `fixed` (linear add), `percentage` (linear mul), `exponential` (pow, default).

## 6. Visibility & Locking

* `checkIsVisible(id, prereqs)` (`GameContext.tsx:1226`): first checks global `locks[]` from any *executed* action or *active/done/leveled* task that lists `id` in its `locks`. If hit → hidden. Otherwise visibility = `state.tasks[id].unlocked || state.actions[id].unlocked`. Note: converters/slots not checked here.
* `checkPrerequisites(prereqs)` (`GameContext.tsx:1200`): every prerequisite must pass. For hidden resources (`max == 0`) pattern still blocks until `modify_max_resource_flat` unlocks it - see *Hidden Resource* pattern in `GAMEDATA_GUIDE.md`.
* `exclusiveWith` (actions only, `ActionCard.tsx:60`): after one fires, siblings become `BLOCKED` (disabled, not hidden) and show blocker name.
* `hideWhenComplete` + `maxExecutions`: when cap reached, card disappears from main tab and moves to **Completed** tab (`App.tsx:53`). If `hideWhenComplete: true`, it vanishes entirely.

## 7. Persistence

* Key: `openidle_save` in `localStorage`.
* `saveGame()` serializes `stateRef.current` raw JSON including `version`.
* `loadGame()` on mount via `GameContext.tsx:1360`; `LOAD_GAME` merges over `createInitialState()` to backfill fields and runs migrations by version (see `GameContext.tsx:229`).
* Auto-save every 30s (`GameContext.tsx:1366`); manual Save/Export/Import/Reset in header.
* Export = `btoa(encodeURIComponent(JSON.stringify(state)))` via `utf8_to_b64`; Import is reverse. Unicode-safe (emoji). Log migration (`migrateLog`) normalizes legacy `string[]` saves to `LogEntry[]`.

## 8. UI Layout (`App.tsx:36`)

```
Header (Title + Save/Export/Import/Reset)
┌──────────────┬──────────────────────────────┬──────────────┐
│ Left  (w-56) │ Middle (flex)                │ Right (w-64) │
│ Resources    │ Auto-Rest select             │ Active Tasks │
│  grouped by  │ Tabs: Activity / Equipment / │  (if max>1)  │
│  category    │       Converters / Completed │    Stats     │
│ Game Log     │ Cards grid (2-3 cols)        │  stat bars   │
└──────────────┴──────────────────────────────┴──────────────┘
```

* Collapsible sections backed by `collapsedSections: Record<string, boolean>` local state.
* Tooltip system: each card uses `createPortal` to `document.body` + `hoverRect` positioning; `hidden` effects are filtered out there, not in reducer.
* `App.tsx` is ~560 lines and handles modal + tab + grouping logic - candidate for extraction (see TODO section).

## 9. Known Gotchas for Contributors

1. **`getScaledCost` branching** (`GameContext.tsx:195`) now uses `level>0` heuristic to distinguish task vs action; card mirrors (`ActionCard.tsx:33`, `TaskCard.tsx:34`) must stay in sync. Old `resourceId` heuristic caused action costs to decay.
2. **`getActiveModifiers` partial coverage** (`GameContext.tsx:15`) - now includes `set_max_resource` and `add_passive_gen_per_unit`; `increase_max_*` still handled via direct state, not modifiers. Keep in sync when adding new `Effect.type`.
3. **`cooldownMs` is enforced** (`GameContext.tsx:561`, `types.ts:106`, `ActionCard.tsx:72`): default `200ms`, blocks spam with `lastUsed` check; long cooldowns (≥1s) log remaining time. Short cooldowns silently drop.
4. **Converter costs are unscaled** - unlike tasks/actions, purchase cost is flat. `getResourceBreakdown` now correctly scales active task drains (`:1469`), but converter toggle afford check uses `*0.1` probe vs `dtSeconds`.
5. **Action tier heuristic** (`ActionCard.tsx:76`): `maxExecutions < 100` → styled as Upgrade (yellow). Keep limits under 100 for yellow styling or change the heuristic.
6. **Resource `category` vs `CategoryConfig`**: basic resources group by `CategoryConfig.id` match; mismatch → bucketed under "Other" (`App.tsx:168`). Always register the category.
7. **`allModifiers` live recomputed** inside each completion via `getActiveModifiers({...state, modifiers:newModifiers})` so preceding `modify_max` in same action is visible; streamed tick effects still compute per-resource max live.

## 10. Extension Points

| Want to… | Touch |
|----------|-------|
| New resource/task/action/item/converter/slot/category | Add to a module in `gameData/`, register in `gameData/index.ts` |
| New effect type | `types.ts:Effect` + `GameContext.tsx` apply branches + card renderers (`TaskCard.tsx:282`, `ActionCard.tsx:105`, `EquipmentView.tsx:41`, `ConverterCard.tsx`) |
| New cost scaling | `types.ts:Cost.scaleType` + `getScaledCost` in reducer + `TaskCard`/`ActionCard` mirrors |
| Offline progress | Replace fixed `TICK` with wall-clock delta + `visibilitychange` handler + saved `lastTick` timestamp |
| Validation/linting | Add `scripts/validateGameData.ts` that imports `CATEGORIES/RESOURCES/...` and checks ID uniqueness & references |
| Tests | Add `vitest` + `npm test`; start with pure functions (`calculateMax`, `calculateYield`, `getScaledCost`) |

## 11. Build & Run

```bash
npm install
npm run dev     # vite @ localhost:3000
npm run build   # → dist/
npm run preview
```

No test or lint scripts exist yet (see `CONTRIBUTING.md` proposal).
