# Architecture — OpenIdle Engine

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

## 3. State Shape (`types.ts:196`)

```ts
GameState {
  resources:  Record<ResourceID, { current, unlocked }>
  actions:    Record<ActionID,   { executions, unlocked, lastUsed? }>
  tasks:      Record<TaskID,     { active, level, xp, unlocked, progress?, completions?, paid? }>
  converters: Record<ConverterID,{ owned, active, unlocked }>
  inventory:  ItemID[]
  equipment:  Record<SlotID, ItemID>
  modifiers:  Modifier[]          // permanent buffs from actions/tasks/items
  log: string[]                   // last 50 entries, newest first
  activeTaskIds: string[]         // ordered running tasks
  maxConcurrentTasks: number      // multitasking cap
  restTaskId / previousTaskId     // auto-rest fallback
  totalTimePlayed: number
}
```

`createInitialState()` (`GameContext.tsx:104`) builds this from config. `LOAD_GAME` merges saved JSON over defaults so schema migrations are additive.

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
* `checkPrerequisites(prereqs)` (`GameContext.tsx:1200`): every prerequisite must pass. For hidden resources (`max == 0`) pattern still blocks until `modify_max_resource_flat` unlocks it — see *Hidden Resource* pattern in `GAMEDATA_GUIDE.md`.
* `exclusiveWith` (actions only, `ActionCard.tsx:60`): after one fires, siblings become `BLOCKED` (disabled, not hidden) and show blocker name.
* `hideWhenComplete` + `maxExecutions`: when cap reached, card disappears from main tab and moves to **Completed** tab (`App.tsx:53`). If `hideWhenComplete: true`, it vanishes entirely.

## 7. Persistence

* Key: `openidle_save` in `localStorage`.
* `saveGame()` serializes `stateRef.current` raw JSON; no version field (migration risk).
* `loadGame()` on mount via `GameContext.tsx:1163`; `LOAD_GAME` merges over `createInitialState()` to backfill missing fields.
* Auto-save every 30s (`GameContext.tsx:1170`); manual Save/Export/Import/Reset in header.
* Export = `btoa(encodeURIComponent(JSON.stringify(state)))` via `utf8_to_b64`; Import is reverse. Unicode-safe.

## 8. UI Layout (`App.tsx:36`)

```
Header (Title + Save/Export/Import/Reset)
┌──────────────┬──────────────────────────────┬──────────────┐
│ Left  (w-56) │ Middle (flex)                │ Right (w-64) │
│ Resources    │ Auto-Rest select             │ Active Tasks │
│  grouped by  │ Tabs: Activity / Equipment / │  (if max>1)  │
│  category    │       Converters / Completed │ Body & Stats │
│ Game Log     │ Cards grid (2-3 cols)        │  stat bars   │
└──────────────┴──────────────────────────────┴──────────────┘
```

* Collapsible sections backed by `collapsedSections: Record<string, boolean>` local state.
* Tooltip system: each card uses `createPortal` to `document.body` + `hoverRect` positioning; `hidden` effects are filtered out there, not in reducer.
* `App.tsx` is ~560 lines and handles modal + tab + grouping logic — candidate for extraction (see TODO section).

## 9. Known Gotchas for Contributors

1. **Dead code** in `GameContext.tsx:668` (`fester` branch) and duplicated `applyEffect` (`:375` vs `:417`) — do not extend; clean up first.
2. **`cooldownMs` is a no-op** (`types.ts:102` TODO). Do not rely on it.
3. **Converter costs are unscaled** — unlike tasks/actions, purchase cost is flat.
4. **`getResourceBreakdown` cost math** (`GameContext.tsx:1288`) ignores `scaleFactor` for active task drain display — tooltip rate differs from actual tick rate after leveling.
5. **Action tier heuristic** (`ActionCard.tsx:74`): `maxExecutions < 100` → styled as Upgrade. Keep limits under 100 for yellow styling or change the heuristic.
6. **Resource `category` vs `CategoryConfig`**: basic resources group by `CategoryConfig.id` match; mismatch → bucketed under "Other" (`App.tsx:145`). Always register the category.
7. **`allModifiers` snapshot**: captured at reducer entry; effects that add modifiers inside the same tick still use the old snapshot for `calculateYield`/`calculateMax` that tick — next tick picks them up.

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
