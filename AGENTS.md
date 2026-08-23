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
| `context/GameContext.tsx` | Keep `getScaledCost`, `calculateMax`, `calculateYield`, `getActiveModifiers` pure and unit-testable (extract if adding tests) | Add game content directly; duplicate `applyEffect` logic (clean the dead `applyEffect` at `:375`) |
| `App.tsx` | Keep header persistence buttons; tabs route via `activeTab` state | Grow past 600 lines - extract `Header`, `LeftPanel`, `MiddlePanel`, `RightPanel`, `SaveModals` |
| `components/*` | Tooltip = `createPortal` + `hoverRect`; filter `hidden` effects in tooltip, not reducer | Assume `cooldownMs` works (it's a TODO at `types.ts:102`) |
| `gameData/cat/catpaths.ts` | Valid pattern for branching packs (`exclusiveWith`) | Forget to define the resource/category you reference (current bug: `insight` + `strange` missing - see §4) |

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

1. **`cat/catpaths.ts` references missing IDs:** `insight` resource and `strange` category don't exist. Any new module must define every `resourceId`/`category`/`taskId`/`actionId` it touches, or the UI will show placeholders and logic will operate on a hidden 0-max resource. Create them or remove the refs.
2. **Dead code:** `GameContext.tsx:668` empty `else if (tid === 'fester')`, duplicated `applyEffect` at `:375`. Clean before extending.
3. **`cooldownMs` not implemented** (`types.ts:102`): field exists, reducer ignores it.
4. **Converter / breakdown display mismatch:** `getResourceBreakdown` (`GameContext.tsx:1288`) omits scaling; shown drain rate diverges after task levels up.
5. **`exclusiveWith` is action-only** and blocks purchase but doesn't hide. Document the block reason in UI (`ActionCard.tsx:270`).
6. **Save has no version:** `localStorage` JSON merge in `LOAD_GAME` is additive but field removals/renames will orphan data. Add `version` if you change `GameState`.
7. **Locale/format:** `toFixed(1)`/`toFixed(2)` on resources; large numbers (1e6+) not abbreviated.

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
