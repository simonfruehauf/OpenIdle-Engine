# Engine API - Reference & Validation Checklist

> **For agents & reviewers:** how to reason about every config field, what the engine enforces, and how to validate content. Complements `GAMEDATA_GUIDE.md` (tutorial) + `ARCHITECTURE.md` (internals).

## 1. Config Types (via `types.ts`)

### 1.1 CategoryConfig (`types.ts:140`)

```ts
{ id: CategoryID, name: string }
```

Groups cards in middle column (`App.tsx:368`) and resource groups in left column. Unknown category → bucket "Other". Always register categories you reference.

### 1.2 ResourceConfig (`types.ts:16`)

```ts
{
  id: ResourceID, name: string,
  type: 'basic'|'stat',        // basic = left column numbers, stat = right bar
  category?: string,           // groups left-col; mismatch → "Other"
  baseMax: number,             // 0 = hidden/locked until modifier unlocks it
  initialAmount?: number,      // default 0
  color?: string,              // Tailwind class for stat bars
  description?: string,        // Tooltip text

  // Passive generation: each unit of this resource generates ratePerUnit of targetResourceId/sec
  passiveGen?: { targetResourceId, ratePerUnit }[]  // floored source units * rate
}
```

* `getMaxResource(id)` (`GameContext.tsx:1261`) resolves capacity via modifiers. If `max <= 0` → `ResourceRow` hides and `current` clamped to 0 each tick.
* **Hidden resource pattern:** `baseMax:0` + action/task effect `modify_max_resource_flat` to reveal.

### 1.3 Cost (`types.ts:28`)

```ts
{ resourceId, amount, scaleFactor?, scalesByCompletion?, scaleType? }
```

* `scaleFactor` absent → flat.
* `scalesByCompletion ? completions : (level-1)` for tasks; `executions` for actions (reducer & cards must agree).
* `scaleType`: `exponential` (`amount * factor^exp`, default), `fixed` (`amount + factor*exp`), `percentage` (`amount * (1+factor*exp)`).
* Validated at runtime via `getScaledCost`; never persisted separately.

### 1.4 Effect Types (expanded)

| `type` | Required target | Effect | Notes |
|--------|-----------------|--------|-------|
| `add_resource` | `resourceId` | `(base+flat)*(1+pct)` added, clamped to max | Scales with level via `scaleFactor/scaleType`; yielded via `calculateYield`; `chance:0-1` per-trigger probability; `hidden:true` → applied but filtered from tooltips (four renderers) |
| `modify_max_resource_flat` | `resourceId` | `+amount` flat max modifier (`property:'max'`) | Persistent `Modifier` |
| `set_max_resource` | `resourceId` | Add `set` modifier with `value:amount` | Max `set` wins; then flats/pct apply (additive within bucket) |
| `reset_resource_modifiers` | `resourceId` | Remove all modifiers for that resource | Does not affect equipment; `GameContext.tsx:619` |
| `modify_yield_pct` | `taskId\|actionId\|resourceId` | `+amount` percent yield | Global if no target, otherwise task/action/resource-specific; `hidden` respected |
| `modify_yield_flat` | `taskId\|actionId\|resourceId` | `+amount` flat yield | Same targeting as above |
| `modify_passive_gen` | `resourceId` | `+amount` passive `/s` (`property:'gen'`) | Floored source units * rate; shown in breakdown |
| `add_passive_gen_per_unit` | `sourceResourceId` + `targetResourceId` | `+amount` per full unit of source/sec | `property:'gen_per_unit'`; stackable via modifiers |
| `increase_max_tasks` | — | `maxConcurrentTasks += amount` | No target; direct state |
| `increase_max_executions` | `taskId\|actionId` | `+amount` to cap (`property:'max_exec'`) | Stored as modifier but not yet surfaced as separate UI |

**Notes:**
- `chance:0-1` per-trigger probability (e.g. drops). `hidden:true` effects are applied to state but **filtered from tooltips**. Four renderers duplicate this filter: `TaskCard.tsx:282`, `ActionCard.tsx:105`, `ConverterCard.tsx:53`, `EquipmentView.tsx:41`.
- `firstCompletionEffects` fire **once** on completion; `effectsPerSecond` stream continuously. Don't mix them for recurring boosts.
- Modifiers stack via `getActiveModifiers()` (`GameContext.tsx:15`) — they clone the current state, apply modifiers, and return a flat list. No priority system yet (last one wins for same property).

### 1.5 TaskConfig (`types.ts:111`)

```ts
{ id, name, description, category, type?: 'normal'|'rest',
  costPerSecond: Cost[], effectsPerSecond: Effect[],
  xpPerSecond?, drops?: { itemId, chancePerSecond }[]
}
```

* No `progressRequired` → infinite loop task (must be `autoRestart`; not enforced yet).
* `progressRequired` set → timed; when `progress >= required` awards completions, runs `completionEffects`, then resets `progress=0, paid=false`. If `autoRestart:false` → `active=false`.
* `paid` flag prevents double-charging `startCosts` mid-run; cleared on completion/toggle off.
* `xpPerSecond`: `xpNeeded = level * 100` (`GameContext.tsx:872`).

### 1.6 ActionConfig (`types.ts:98`)

```ts
{ id, name, description, category, costs, effects, firstCompletionEffects?, maxExecutions?,
  cooldownMs?, prerequisites?, exclusiveWith?, locks?, lockDescription?, hideWhenComplete? }
```

* `cooldownMs` **enforced** (`GameContext.tsx:561`, `ActionCard.tsx:72`): default `200ms`; fast repeat silently dropped, long cooldowns (≥1s) log remaining seconds. Stored as `lastUsed` per action.
* `exclusiveWith: ActionID[]` - blocks purchase if sibling has `executions>0`; still visible. Show blocker name in UI (`ActionCard.tsx:282`). Use `locks` for task branching.
* `hideWhenComplete`: when cap reached, card disappears from main tab and moves to **Completed** tab (`App.tsx:53`). If `hideWhenComplete:true`, it vanishes entirely.

### 1.7 ConverterConfig (`types.ts:145`)

```ts
{ id, name, description, cost: Cost[], canBeToggled, effectsPerSecond, costPerSecond, prerequisites? }
```

* `canBeToggled:false` → auto-on when owned; others toggle via button. Silently skips tick if unaffordable (`GameContext.tsx:936`) but is not deactivated.
* Purchase cost is **unscaled** and one-time (unlike tasks/actions).

### 1.8 ItemConfig / SlotConfig (`types.ts:62,71`)

```ts
ItemConfig { id, name, description, slot: SlotID, effects: Effect[] }
SlotConfig { id, name, prerequisites?, prerequisitesAny? }
```

Item effects become `Modifier`s in `getActiveModifiers` while equipped (supports `max`/`yield`/`gen`/`set`/`gen_per_unit`). Slots gate via `prerequisites` (AND) plus `prerequisitesAny` (OR, at least one entry, each AND internally). Example: `mutation_eye` requires `surgery_eye`; `accessory_2` unlocks via `wellness_stitch_pouch_*` any.

### 1.9 Prerequisite (`types.ts:84`)

```ts
{ resourceId?, minAmount?, maxAmount?, minMax?, actionId?, minExecutions?, taskId?, minLevel?, minAmount?, minExecutions? }
```

All entries per config are **AND** via `evaluatePrereq` (`GameContext.tsx:126`). Empty → unlocked. Visibility = `checkPrerequisites` AND (`state.*.unlocked`). Latch unlock never re-locks (reducer: `unlocked` true stays). `minMax` checks capacity, not amount.

## 2. Runtime Hooks (`types.ts:227` / `GameContext.tsx:1438`)

```ts
state: GameState // version 6, log: LogEntry[] {msg, category}
config: { resources, actions, tasks, categories, items, slots, converters }
triggerAction(actionId) // respects cooldownMs, cost scaling, yield
toggleTask(taskId) // respects maxConcurrentTasks, startCosts, paid flag
equipItem(itemId) / unequipItem(slotId) // accessory auto-fills accessory_2 if available
buyConverter / toggleConverter // canBeToggled false = auto-on
getMaxResource(resourceId) -> number
getActiveModifiers() -> Modifier[] // includes set/gen_per_unit/yield variants
getResourceBreakdown(resourceId) -> { maxModifiers, rates: {source, amount}[], totalRate } // costs scale with level/completions
checkPrerequisites(prereqs?) -> boolean // uses evaluatePrereq (resource/action/task)
checkIsVisible(id, prereqs?) -> boolean // also honors locks from actions/tasks
saveGame / resetGame / exportSave / importSave / setRestTask / addLog // log categories: flavour/loot/unlock/other
```

## 3. Validation Checklist (for content PRs & `scripts/validateGameData.ts`)

Run these before review. All are cheap static checks.

### 3.1 ID Uniqueness

No duplicate `id` within or across modules for each kind (resources/tasks/actions/items/slots/converters). Duplicate silently wins last import.

```powershell
# PowerShell: duplicate detector (paste verbatim)
python3 -c "import re,glob,collections; ids=[]; [ids.extend(re.findall(r'id:\s*\"([^\"]+)\"',open(f).read())) for f in glob.glob('gameData/**/*.ts',recursive=True)]; print([x for x in set(ids) if ids.count(x)>1])"
```

### 3.2 Reference Integrity

For every config file, grep each `resourceId`/`category`/`taskId`/`actionId`/`itemId`/`slot`:

* `resourceId` must exist in `RESOURCES`.
* `category` must exist in `CATEGORIES` (else → "Other").
* `taskId`/`actionId`/`itemId`/`slot` must match a defined ID of that kind.
* Historical violation (fixed): `cat/catpaths.ts` previously dangled `insight`/`strange`; now defined in `gameData/resources.ts:74` and `gameData/categories.ts:8`.

```powershell
Select-String -Pattern 'insight|strange' -Path gameData\*.ts -Recurse # should resolve to defined IDs
```

### 3.3 Hidden Resource Reachability

If `resource.baseMax === 0`, there must be at least one `modify_max_resource_flat|pct|set` effect targeting it, and prerequisites eventually unlock the path. Test hidden→visible in dev.

### 3.4 Prerequisite Round-Trips

* Every `prerequisites` entry should be satisfiable (e.g., don't require `money.minAmount: 999` when no yield ever reaches it).
* `minMax` checks capacity, not amount - use it to gate "is this hidden resource revealed?"

### 3.5 Locks / Hide Behavior

* `locks` IDs actually exist; toggling the lock source indeed hides the target (check `checkIsVisible` both contexts).
* `hideWhenComplete` + `maxExecutions` → verify item moves to Completed tab; `hideWhenComplete:true` → vanishes.

### 3.6 Scaling & Economy

* Pick one `scaleType` and keep it. `exponential` grows fast - keep `scaleFactor` in `[1.01, 1.5]` for costs, `[1.05, 2]` for rewards.
* Verify both reducer and card `getScaledCost` agree (they share the `level>0` heuristic; `ActionCard` uses `executions`, `TaskCard` uses `level/completions`).
* Check breakdown rates (`getResourceBreakdown:1469`) now scale with `scaleFactor/scaleType/scalesByCompletion` like TICK; converter afford probe still uses `*0.1` vs `dtSeconds` tiny drift.

## 4. Common Pitfalls

* **Forgetting to register categories/items** - config compiles but UI groups incorrectly or items unreachable.
* **Assuming `cooldownMs` is free** - it now blocks with default `200ms` (`ActionCard` dims + `lastUsed` gate); keep short or set explicitly.
* **Adding `exclusiveWith` to tasks** - no reducer handling; only actions (locks handle task branching).
* **Relying on save compatibility after renames** - `LOAD_GAME` is versioned (current 6); removed fields orphan, renamed IDs duplicate unless migrated.
* **Modifying state outside reducer** - will be overwritten next tick.
* **Duplicate "Rest" names** (`rest_bench` vs `rest_bed` in `gameData/tasks.ts:5`) — both show "Rest"; rename for HUD clarity.

## 5. Agent Workflow (from AGENTS.md)

1. Read `README.md` + `ARCHITECTURE.md` + `GAMEDATA_GUIDE.md` before editing.
2. Inspect `types.ts` fully - it's the contract. Grep for the ID you plan to use to avoid collisions.
3. Make minimal edits: prefer editing existing gameData modules or adding a new file + one line in `gameData/index.ts`. Don't refactor reducer unless the feature truly requires it.
4. Verify by execution: `npm run build` must pass (type-check). Manual QA: `npm run dev`, open browser, check visibility, affordability, progression. For reducer math, inline a quick sanity check via bash or vitest stub once tests exist.
5. No secrets in saves/commits: `exportSave` is base64, not encrypted. Don't commit local saves.

## 6. When to Ask vs Act

* **Ask first:** changing `types.ts` effect/cost shape, altering `TICK` order, bumping `maxConcurrentTasks` default, adding a build tool (e.g., vitest, eslint) with config changes.
* **Act directly:** adding/modifying `gameData/*` content, fixing tooltip copy, adding a template doc, extracting a component from `App.tsx` with no behavior change, adding validation script.

## 7. Useful Commands

```powershell
# Find where an ID is referenced
Select-String -Pattern '"money"' -Path gameData\*.ts -Recurse

# Verify no duplicate action IDs
python -c "import re,glob; ids=[]; [ids.extend(re.findall(r'id:\s*\"([^\"]+)\"',open(f).read())) for f in glob.glob('gameData/**/*.ts',recursive=True)]; print([x for x in set(ids) if ids.count(x)>1])"

# Build check
npm run build
```

## 8. Definition of Done (for content PRs)

- [ ] New IDs are unique across `gameData/` (run `npm run validate`)
- [ ] Every referenced `resourceId`/`category`/`taskId`/`actionId`/`itemId` exists and its category is registered
- [ ] `baseMax:0` resources have a `modify_max_resource_flat/pct/set` unlock path and are tested hidden→visible
- [ ] `prerequisites`/`locks`/`exclusiveWith`/`hideWhenComplete` behave as intended (check both main and Completed tabs)
- [ ] `npm run build` passes; game loads in dev, save/export/import/reset still work

## 9. Extension Points (see ARCHITECTURE.md §10)

| Want to… | Touch |
|----------|-------|
| New resource/task/action/item/converter/slot/category | Add to a module in `gameData/` |
| New effect type | `types.ts:Effect` + reducer branches + card renderers (`TaskCard.tsx:282`, `ActionCard.tsx:105`, `ConverterCard.tsx:53`, `EquipmentView.tsx:41`) |
| New cost scaling | `types.ts:Cost.scaleType` + `getScaledCost` in reducer + card mirrors |
| Offline progress | Replace fixed `TICK` with wall-clock delta + `visibilitychange` handler + saved `lastTick` timestamp |
| Large-number formatting | Beyond `toFixed(1/2)`; add `formatNumber` (K/M/B, or 1e6) for `ResourceRow` and tooltips |
| Prestige / reset_resource_modifiers expansion | Already have the effect; document a full prestige module template |

## 10. Build & Run

```bash
npm install
npm run dev     # vite @ localhost:3000
npm run build   # → dist/
npm run validate # duplicate-ID & reference checks (useful before PRs)
```

No test or lint scripts exist yet (see P3 DX items). When adding them, start with pure functions: `calculateMax`, `calculateYield`, `getScaledCost`, `checkPrerequisites`. Then reducer snapshots for `TICK`/`TRIGGER_ACTION`/`TOGGLE_TASK`.