# Contributing - OpenIdle Engine

## 1. Setup

```bash
git clone https://github.com/simonfruehauf/OpenIdle-Engine.git
cd OpenIdle-Engine
npm install
npm run dev     # http://localhost:3000
```

Requirements: Node 16+ (Node 20 recommended), npm 8+.

## 2. Project Structure for Contributors

| Path | What lives there |
|------|------------------|
| `types.ts` | Contract. Change here ripples everywhere. |
| `context/GameContext.tsx` | Reducer + loop + persistence. Keep pure helpers (`calculateMax`, `calculateYield`, `getScaledCost`) at top. |
| `gameData/` | Content. Safe to edit freely; register modules in `gameData/index.ts`. |
| `components/` | Presentational. No state mutations; call `useGame()` dispatchers only. |
| `App.tsx` | Layout. Prefer extracting components over growing it. |
| `docs/` | Engine API + validation checklist for reviewers. |
| `ARCHITECTURE.md` | How the engine works (for agents & humans). |
| `AGENTS.md` | AI-agent working guide - read before automating changes. |

## 3. How to Make Changes

### 3.1 Adding game content (no engine change)

1. Create `gameData/myFeature.ts` exporting typed arrays. Start from `gameData/_template.ts`.
2. Register: add `import * as MyFeatureModule from './myFeature'` and push to `modules` in `gameData/index.ts`.
3. Validate: every referenced `resourceId`/`category`/`taskId`/`actionId`/`itemId` must exist. Categories must be registered. IDs global + `snake_case`.
4. Test: `npm run dev` → verify visibility (`prerequisites`), affordability (cost scaling), progression (effects), tooltip, save reload.

### 3.2 Engine change (schema / reducer / UI)

1. Update `types.ts` interface first.
2. Update reducer in `context/GameContext.tsx` - add to the exhaustive `Action` union and handle in `gameReducer`.
3. Update all tooltip renderers: `TaskCard.tsx:282`, `ActionCard.tsx:105`, `ConverterCard.tsx:53`, `EquipmentView.tsx:41` (they duplicate `getName`/`renderEffect` - keep in sync or extract).
4. Document the change in `ARCHITECTURE.md` and `docs/ENGINE_API.md`.
5. Consider save compatibility: bump a `version` field and handle migration in `LOAD_GAME` if you rename/remove fields.

## 4. Code Style

* TypeScript strict. No `any` beyond `modules: any[]` in `gameData/index.ts` (known tech debt).
* React 19 + Tailwind CSS 4. Use existing utility patterns; no per-component CSS files.
* No comments as scratch-paper. Keep them concise and on purpose.
* Keep reducer branches pure; clone via `cloneResources` and `{...state}`. Never mutate `state` directly.
* Prefer minimal diffs. Don't reformat unrelated files.

## 5. Verification (required before PR)

```bash
npm run build        # tsc --noEmit + vite build; must pass
npm run validate     # duplicate-ID & reference checks; must pass
# manual QA
npm run dev
# open http://localhost:3000, verify:
#  - new content appears/disappears per prerequisites/locks
#  - costs scale as expected; tooltips show correct amounts (including yield buffs)
#  - save → reload → same state; export → reset → import → same state
#  - Completed tab shows maxed actions/tasks; hideWhenComplete truly hides
#  - Rest tasks distinct (bench vs bed) and auto-rest fallback works
```

**Current tooling:** `npm run validate` (`scripts/validateGameData.ts`) now exists. No unit tests or linters yet - add them as P3 DX work when ready.

## 6. Commit & PR Guidelines

* Commits: concise, imperative ("Add cat prestige resource", not "Added...").
* PRs: include
  * What & why (link issue if any).
  * IDs added / referenced (spotting collisions).
  * Screenshot/GIF if UI change.
  * Manual QA steps taken + `npm run build` output.
* Do not commit: `node_modules/`, `dist/`, `*.local`, `.vscode/`, local saves (`localStorage` export strings).

## 7. Reporting Bugs / Proposing Features

Open an issue with:

* **Repro steps** (which resource/action/task, what you expected vs saw).
* **Game state** (export string or `localStorage` JSON redacted if needed).
* **Logs**: `state.log` tail + browser console.

Feature proposals: describe the data shape first (new `types.ts` fields), then UI, then example content. Check "Known Gaps" (§8) to avoid duplicates.

## 8. Known Gaps - Good First Contributions

* ✅ `cooldownMs` enforced (`types.ts:106`, `GameContext.tsx:561`, default 200ms).
* ✅ Fix `insight`/`strange` missing definitions (`gameData/resources.ts:74`, `gameData/categories.ts:8`).
* ✅ Remove dead `fester` branch & dedup `applyEffect` → `applyEffectWithYield`.
* ✅ `getResourceBreakdown` scaling uses `scaleFactor/scaleType/scalesByCompletion` like TICK.
* ✅ Add `scripts/validateGameData.ts` (duplicate-ID & dangling-reference linter, `npm run validate`).
* ✅ Save versioning + migration harness (`GameState.version:6`, `LOAD_GAME`).
* ⏳ Extract pure helpers for testability; add `vitest` + coverage for `calculateMax/Yield/getScaledCost/checkPrereqs`.
* ⏳ Add `eslint` + `prettier` + `npm run lint` / `npm run format`.
* ⏳ Extract shared tooltip helpers (duplicated in 4 cards) into `components/tooltipHelpers.tsx`.
* ⏳ Split `App.tsx` into components (`Header`, `LeftPanel`, `MiddlePanel`, `RightPanel`, `SaveModals`).
* ⏳ Notifications / toasts for unlocks, auto-switches, and max reaches.
* ⏳ Settings persistence (collapse state + tab selection to `localStorage`).
* ⏳ Accessibility: keyboard nav, aria labels, color-blind palette.
* ⏳ Mobile responsive design (current sidebars overflow on narrow screens).
* ⏳ Debug overlay (`?dev=1` flag showing active modifiers, raw `GameState`, fast-forward tick).