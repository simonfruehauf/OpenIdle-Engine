# AGENTS.md - Working Guide for AI Agents

> **Purpose:** Minimize setup/wrong-assumption churn when an AI agent (or human mimicking one) picks up this repo. Read `ARCHITECTURE.md` for engine internals, this file for *how to work*.

## 0. Quick Start for Agents

```bash
npm install
npm run dev   # Vite on http://localhost:3000
npm run build # type-check + production bundle → dist/
npm run validate # duplicate-ID & reference checks (useful before PRs)
```

* **One validation script** (`npm run validate`) exists. No unit tests or linters yet.
* **No `.vscode` config** in repo. Use vanilla tools.
* Entry points: `index.tsx` → `App.tsx` (layout) → `context/GameContext.tsx` (state + loop) → `gameData/index.ts` (content).

## 1. Project Conventions

### 1.1 Data-driven content belongs in `gameData/`

* **Never edit** `context/GameContext.tsx` to add content. Add a module under `gameData/` exporting typed arrays (`RESOURCES`, `TASKS`, `ACTIONS`, `CATEGORIES`, `ITEMS`, `SLOTS`, `CONVERTERS`) and register it in `gameData/index.ts:14` (`modules` array). See `GAMEDATA_GUIDE.md` + `gameData/_template.ts`.
* `types.ts` is the schema. If you add a new field/effect, update the interface there **and** the reducer **and** all four tooltip renderers (`TaskCard.tsx`, `ActionCard.tsx`, `ConverterCard.tsx`, `EquipmentView.tsx`).
* IDs are global strings. Keep them `snake_case` and namespaced if needed (`myMod_gold`). Duplicates across modules silently collide - validate (see `docs/ENGINE_API.md`).

### 1.2 State mutations only via reducer

* `GameState` (`types.ts:196`) is immutable outside `gameReducer` (`GameContext.tsx:171`). UI calls `triggerAction` / `toggleTask` / `buyConverter` etc., which dispatch. Do not mutate `state` directly.
* Add new reducer branches with exhaustive `Action` union (`GameContext.tsx:149`). Keep `LOAD_GAME` merge additive.

### 1.3 Styling

* Tailwind CSS 4 (`index.css` import). Use existing utility patterns; no custom CSS files per component.
* Cards: `TaskCard` = blue/orange by `autoRestart`, `ActionCard` = yellow (upgrade heuristic `maxExecutions < 100`) vs orange (repeatable). Preserve this.

## 2. File-Level Rules

| Path | Do | Don't |
|------|----|-------|
| `context/GameContext.tsx` | Keep `getScaledCost`, `calculateMax`, `calculateYield`, `getActiveModifiers`, `evaluatePrereq` pure and unit-testable (extract if adding tests) | Add game content directly; duplicate `applyEffect` logic |
| `App.tsx` | Keep header persistence buttons; tabs route via `activeTab` state | Grow past 600 lines - extract `Header`, `LeftPanel`, `MiddlePanel`, `RightPanel`, `SaveModals` |
| `components/*` | Tooltip = `createPortal` + `hoverRect`; filter `hidden` effects in tooltip, not reducer | Forget `prerequisitesAny` for slots; `TaskCard` yield display uses `val` not `e.amount` |
| `gameData/cat/catpaths.ts` | Valid pattern for branching packs (`exclusiveWith` + `locks`) | Forget to define the resource/category you reference (now fixed: `insight`/`strange` exist in `resources.ts`/`categories.ts`) |

## 3. Common Tasks - Where to Look

| Task | Files | Notes |
|------|-------|-------|
| Add a resource | `gameData/resources.ts` (`RESOURCES` array) + maybe `gameData/categories.ts` | `type: 'basic'` → left column, `'stat'` → right bar. `baseMax:0` hides until unlocked via `modify_max_resource_flat`. |
| Add a task | `gameData/tasks.ts` | `progressRequired` + `autoRestart` controls loop vs project. Costs scaled by level/completions automatically. |
| Add an upgrade | `gameData/actions.ts` (`maxExecutions:1`) | Will render yellow. Use `firstCompletionEffects` for one-time bonus, `locks`/`exclusiveWith` for branching. |
| Add equipment | `gameData/equipment.ts` (`SLOTS` + `ITEMS`) | Slot prerequisite example: `mutation_eye` needs `surgery_eye`. |
| Add converter | `gameData/converters.ts` | `canBeToggled:false` → auto-on. Purchase cost not scaled. |
| Tweak economy | Adjust `amount`/`scaleFactor`/`scaleType` in costs/effects | Test incrementally: one change → reload → verify `getResourceBreakdown` rates. |
| Fix tooltip | `TaskCard.tsx:127`, `ActionCard.tsx:227`, `ConverterCard.tsx:53`, `EquipmentView.tsx:8` | Each duplicates `getName` + `renderEffect`. Keep in sync. |

## 4. Known Bugs / Sharp Edges (Status at Last Review)

| # | Issue | Status | Details |
|---|-------|--------|---------|
| 1 | Duplicate "Rest" names (`rest_bench` vs `rest_bed`) | ✅ FIXED | Renamed for HUD clarity |
| 2 | TaskCard yield displays raw value, not boosted amount | ⏳ P0 | Computes `val` with buffs but renders `e.amount`; fix in `TaskCard.tsx:282` |
| 3 | cooldownMs enforced (default 200ms, dims on timeout) | ✅ DONE | action card dims + lastUsed gate |
| 4 | getResourceBreakdown scales active task drains | ✅ DONE | now uses scaleFactor/scaleType like TICK |
| 5 | exclusiveWith blocks purchase but doesn't hide | ⚠️ Partial | Warning shown in ActionCard:282; use `locks` for tasks |
| 6 | Save version is `7` with migration harness (SUNDERED) | ✅ DONE | VERSIONED migrations (LOAD_GAME:347) + v7 casting fields (flags/fluency/forms/chapter) |
| 7 | Locale/format | ⏳ P2 | Add `formatNumber` for 1e6+ values |
| 8 | getScaledCost level>0 heuristic vs card mirrors | ✅ DONE | Cards use executions/level correctly |
| 9 | prerequisitesAny only used for accessory_2 | ✅ Done | types.ts:74 + EquipmentView.tsx:118 |
| 10 | Start pacing 50/100 mana half-full + unlock spam after Catch | ✅ FIXED | `core/resources.ts:6` 18/100 mana 10/30 focus + staggered prereqs (`chapter1/tasks.ts:32` hedge behind 3 ash, `actions.ts:31` hush behind 3 root, `actions.ts:62` widow behind 4 ash, `chapter2/tasks.ts:23` focus_meditation behind widow) |
| 11 | 0/999999 badge on repeatables | ✅ FIXED | Removed `maxExecutions:999999` from 7 repeatables (`chapter2/actions.ts:12` etc.) — `ActionCard.tsx:72` isLimited false → no badge |
| 12 | Activity tab not scrollable with many cards | ✅ FIXED | `App.tsx:396` main `flex-col overflow-hidden` + activity `flex-1 overflow-y-auto` |
| 13 | Casting Forms visible at 0s with “unlock in Ch IV” hint | ✅ FIXED | `FormSelector.tsx:14` `return null` until `forms_awakened` |
| 14 | Auto-Rest dropdown visible from start | ✅ FIXED | `App.tsx:396` gated behind `state.flags["met_cathal"]` (Widow visit) |
| 15 | Pure loops show Completed:0 with no completion path | ✅ FIXED | `TaskCard.tsx:157,450` hide when no `maxExecutions`/`progressRequired`; loops `ember/hedge/stillness/stonewatch` now `progressRequired:5 autoRestart:true` so counter ticks (or hidden if pure) |
| 16 | Loop tasks used minExecutions (deadlock) — ritual/wild/sustain/braid/deep_listening | ✅ FIXED | `2701670` added `progressRequired 25-35 autoRestart` to `chapter3/tasks.ts:60` `chapter4/tasks.ts:6` `chapter5/tasks.ts:6` |

## 5. Agent Workflow

1. **Read** `README.md` (user-facing quick start) + `ARCHITECTURE.md` + `GAMEDATA_GUIDE.md` (content schema) before editing.
2. **Inspect** `types.ts` fully - it's the contract. Grep for the ID you plan to use to avoid collisions (`rg '"my_id"' gameData`).
3. **Make minimal edits:** prefer editing existing gameData modules or adding a new file + one line in `gameData/index.ts`. Don't refactor reducer unless the feature truly requires it.
4. **Verify by execution:** `npm run build` must pass (type-check). Manual QA: `npm run dev`, open browser, check visibility, affordability, progression. For reducer math, inline a quick sanity check via bash or a vitest stub once tests exist.
5. **No secrets in saves/commits:** `exportSave` is base64, not encrypted. Don't commit local saves.

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

## 9. Validation Script (`scripts/validateGameData.ts`)

This script checks: duplicate IDs across modules, dangling references to undefined resources/categories/tasks/actions/items/slots, hidden resource unlock paths, and `exclusiveWith` target existence. Run with `npm run validate`. Full spec in `docs/ENGINE_API.md §3`.

## 10. Documentation Audit (for future contributors)

- **AGENTS.md** - AI-agent working guide
- **ARCHITECTURE.md** - Engine internals map  
- **GAMEDATA_GUIDE.md** - Tutorial: defining resources/tasks/actions/items/converters
- **CONTRIBUTING.md** - Setup, style, verification, PR process
- **docs/ENGINE_API.md** - Field-by-field API reference + validation checklist
- **README.md** - User-facing quick start