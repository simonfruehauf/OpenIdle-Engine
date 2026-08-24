# AGENTS.md - Working Guide for AI Agents

> **Purpose:** Minimize setup/wrong-assumption churn when an AI agent (or human mimicking one) picks up this repo. Read `ARCHITECTURE.md` for engine internals, this file for *how to work*.

## 0. Quick Start for Agents

```bash
npm install
npm run dev   # Vite on http://localhost:3000
npm run build # type-check + production bundle → dist/
```

* **No tests, no linter** in `package.json` yet. Do not run `npm test` / `npm run lint` - they don't exist.
* **No `.opencode` / `.vscode` config** in repo. Use vanilla `bash` / `read` / `edit` tools.
* **Entry points:** `index.tsx` → `App.tsx` (layout) → `context/GameContext.tsx` (state + loop) → `gameData/index.ts` (content).

## 1. Project Conventions

### 1.1 Data-driven content belongs in `gameData/`

* **Never edit `context/GameContext.tsx` to add content.** Add a module under `gameData/` exporting typed arrays (`RESOURCES`, `TASKS`, `ACTIONS`, `CATEGORIES`, `ITEMS`, `SLOTS`, `CONVERTERS`) and register it in `gameData/index.ts:14` (`modules` array). See `GAMEDATA_GUIDE.md` + `gameData/_template.ts`.
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

## 4. Known Bugs / Sharp Edges (Check Before Claiming "Done")

1. **Duplicate `Rest` names:** `gameData/tasks.ts:5` `rest_bench` and `:22` `rest_bed` both display “Rest” — HUD ambiguous. Rename for clarity before adding more rest tasks.
2. **TaskCard yield display:** `components/TaskCard.tsx:282` computed `val` with flat/pct but rendered `e.amount`; boosted values not shown. Fixed in current plan, verify after merge.
3. **`cooldownMs` enforced:** `GameContext.tsx:561` default `200ms` blocks spam via `lastUsed`; long cooldowns (≥1s) log remaining. `ActionCard.tsx:72` dims when on cooldown — not a TODO anymore.
4. **Converter / breakdown drift:** `getResourceBreakdown` (`GameContext.tsx:1469`) now scales drains but converter afford probe uses `*0.1` vs `dtSeconds`; tiny mismatch when converter near-affordable.
5. **`exclusiveWith` is action-only** and blocks purchase but doesn't hide. Show blocker name in UI (`ActionCard.tsx:282`). Use `locks` for task branching.
6. **Save version is `6`:** `GameState.version` (`types.ts:211`) + `LOAD_GAME` migrations (`GameContext.tsx:229`). Additive merge still orphans removed/renamed IDs — bump version + add migration if you rename.
7. **Locale/format:** `toFixed(1)`/`toFixed(2)` on resources; large numbers (1e6+) not abbreviated. Add `formatNumber` if needed.
8. **`getScaledCost` heuristic:** reducer uses `level>0` to distinguish task vs action (`GameContext.tsx:195`); cards must mirror. Verify after leveling.
9. **`prerequisitesAny`:** `SlotConfig` (`types.ts:74`) only used for `accessory_2` (`gameData/wellness.ts:13`); evaluated in `EquipmentView.tsx:118`. Don’t assume it works elsewhere without wiring `evaluatePrereq`.

## 5. Agent Workflow

1. **Read** `README.md` (user-facing quick start) + `ARCHITECTURE.md` + `GAMEDATA_GUIDE.md` (content schema) before editing.
2. **Inspect** `types.ts` fully (242 lines) - it's the contract. Grep for the ID you plan to use to avoid collisions (`rg '"my_id"' gameData`).
3. **Make minimal edits:** prefer editing existing gameData modules or adding a new file + one line in `gameData/index.ts`. Don't refactor reducer unless the feature truly requires it.
4. **Verify by execution:** `npm run build` must pass (type-check). Manual QA: `npm run dev`, open browser, check visibility, affordability, progression. For reducer math, inline a quick sanity check via `bash` `python3 -c` or a vitest stub once tests exist.
5. **No secrets in saves/commits:** `exportSave` is base64, not encrypted. Don't commit local saves.

## 6. When to Ask vs Act

* **Ask first:** changing `types.ts` effect/cost shape, altering `TICK` order, bumping `maxConcurrentTasks` default, adding a build tool (e.g., vitest, eslint) with config changes.
* **Act directly:** adding/modifying `gameData/*` content, fixing tooltip copy, adding a template doc, extracting a component from `App.tsx` with no behavior change, adding validation script.

## 7. Useful Commands (Powershell)

```powershell
# Find where an ID is referenced
Select-String -Pattern '"money"' -Path gameData\*.ts -Recurse

# Verify no duplicate action IDs
python -c "import re,glob; ids=[]; [ids.extend(re.findall(r'id:\s*\"([^\"]+)\"',open(f).read())) for f in glob.glob('gameData/**/*.ts',recursive=True)]; print([x for x in set(ids) if ids.count(x)>1])"

# Build check (type + vite)
npm run build
```

## 8. Definition of Done (for content PRs)

- [ ] New IDs are unique across `gameData/` (manual or future `scripts/validateGameData.ts`).
- [ ] Every referenced `resourceId`/`category`/`taskId`/`actionId`/`itemId` exists and its category is registered.
- [ ] `baseMax:0` resources have a `modify_max_resource_flat/pct/set` unlock path and are tested hidden→visible.
- [ ] `prerequisites`/`locks`/`exclusiveWith`/`hideWhenComplete` behave as intended (check both main and Completed tabs).
- [ ] `npm run build` passes; game loads in dev, save/export/import/reset still work.
