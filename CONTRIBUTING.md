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
npm run build   # type-check + vite build; must pass
# manual QA
npm run dev
# open http://localhost:3000, verify:
#  - new content appears/disappears per prerequisites/locks
#  - costs scale as expected; tooltips show correct amounts
#  - save → reload → same state; export → reset → import → same state
#  - Completed tab shows maxed actions/tasks; hideWhenComplete truly hides
```

**Future:** `npm test` (vitest) and `npm run lint` do not exist yet. When adding them, add at least:

* `calculateMax`, `calculateYield`, `getScaledCost` unit tests.
* `scripts/validateGameData.ts` - checks duplicate IDs & missing references.

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

Feature proposals: describe the data shape first (new `types.ts` fields), then UI, then example content. Check `Known Gaps` (§8) to avoid duplicates.

## 8. Known Gaps - Good First Contributions

* [ ] `cooldownMs` actually enforce a cooldown (`types.ts:102` is TODO).
* [ ] Fix `insight`/`strange` missing definitions in `cat/catpaths.ts` (or remove the refs).
* [ ] Remove dead code: `fester` branch & duplicated `applyEffect` in `GameContext.tsx`.
* [ ] Extract pure helpers for testability; add `vitest` + coverage for them.
* [ ] Add `scripts/validateGameData.ts` (duplicate-ID & dangling-reference linter).
* [ ] Save versioning + migration harness.
* [ ] Offline progress (wall-clock delta + `visibilitychange`).
* [ ] Large-number formatting (K/M/B) beyond `toFixed`.
* [ ] Extract `App.tsx` subcomponents (`Header`, `LeftPanel`, `MiddlePanel`, `RightPanel`, `SaveModals`).
* [ ] Shared `getName`/`renderEffect` helper to de-duplicate tooltip logic.

## 9. License

MIT. By contributing you agree your changes are under the same license.

## 10. For AI Agents

Read `AGENTS.md` before bulk edits. It documents sharp edges, file-level do/don't rules, and the Definition of Done checklist reviewers will hold you to.
