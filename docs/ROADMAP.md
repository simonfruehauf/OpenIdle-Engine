# Roadmap & Known Gaps

> Consolidated TODO list for contributors and agents. Items are ordered roughly by impact / effort. Check off as you ship.

## P0 - Bugs / Correctness

- [x] **Fix `cat/catpaths.ts` dangling refs** - Added `insight` resource (`gameData/resources.ts`) and `strange` category (`gameData/categories.ts`).
- [x] **Remove dead code in `GameContext.tsx`** - removed empty `else if (tid === 'fester')` and duplicated `applyEffect` (kept `applyEffectWithYield`).
- [x] **`getResourceBreakdown` scaling** - active task `costPerSecond` drain now uses `scaleFactor`/`scaleType`/`scalesByCompletion` like TICK.
- [x] **Fix `getScaledCost` action branching** - `GameContext.tsx:195` heuristic now uses `level>0` (not `resourceId`) so action costs scale with `executions`; fixes `trash_search` decay.
- [x] **Expand `getActiveModifiers`** - now covers `set_max_resource`/`add_passive_gen_per_unit` and generic `modify_yield_*` for equipment; `TRIGGER_ACTION`/`TICK` no longer drop resource-only yield mods.
- [x] **Unify prerequisite checks** - `evaluatePrereq`/`checkPrereqsList` (`GameContext.tsx:126`) handles `minAmount/maxAmount/minMax/minLevel/completions` uniformly; internal latch and UI `checkPrerequisites` agree.
- [ ] **Duplicate “Rest” names** - `gameData/tasks.ts:5`+`:22` both “Rest”; rename to distinct bench/bed labels before adding more rest tasks.
- [ ] **TaskCard yield display** - computes `val` with buffs but renders `e.amount`; fix tooltip to show final amount (`TaskCard.tsx:282`).

## P1 - Validation & Safety

- [x] **GameData validator** - `scripts/validateGameData.ts`: checks duplicate IDs, dangling `resourceId`/`category`/`taskId`/`actionId`/`itemId`/`slot` refs, hidden (`baseMax 0`) unlock path, `exclusiveWith` targets. Wired as `npm run validate` and CI gate. See `docs/ENGINE_API.md` §3.
- [x] **Save versioning** - added `version: number` to `GameState` (`types.ts:211`) and migration harness in `LOAD_GAME` (`GameContext.tsx:229`, current `6`). Handles `cat`/`insight` clamping fixes.
- [ ] **Error boundaries** - wrap `GameProvider` with React error boundary; don't crash entire app on one bad config.

## P2 - Missing Engine Features

- [x] **`cooldownMs` enforcement** - field parsed (`types.ts:106`) + `lastUsed` gated in `TRIGGER_ACTION` (`GameContext.tsx:561`, default `200ms`, ≥1s logs); `ActionCard.tsx:72` dims.
- [ ] **Improve `exclusiveWith`** - currently action-only, block-not-hide. Consider task branching or auto-hiding losers; surface reason in tooltip (already done in `ActionCard:282`).
- [ ] **Converter cost scaling** - `ConverterConfig.cost` is flat; consider `scaleFactor` support or explicit note that converters are one-shot.
- [ ] **Offline progress** - save `lastTick` timestamp, on load compute `delta = now - lastSave`, apply `TICK` in bulk (respect caps & `canBeToggled`).
- [ ] **Large-number formatting** - beyond `toFixed(1/2)`; add `formatNumber` (K/M/B, or 1e6) for `ResourceRow` and tooltips.
- [ ] **Prestige / reset_resource_modifiers expansion** - already have the effect; document a full prestige module template.

## P3 - DX & Testing

- [ ] **Test harness** - add `vitest` + `npm test`. Start with pure functions: `calculateMax`, `calculateYield`, `getScaledCost`, `checkPrerequisites`. Then reducer snapshots for `TICK`/`TRIGGER_ACTION`/`TOGGLE_TASK`.
- [ ] **Linter & format** - add `eslint` + `prettier` + `npm run lint` / `npm run format`. Low churn if run once.
- [ ] **Shared tooltip helpers** - extract `getName` + `renderEffect` (duplicated in 4 cards) into `components/tooltipHelpers.tsx`.
- [ ] **App.tsx split** - extract `Header`, `LeftPanel`, `MiddlePanel`, `RightPanel`, `SaveModals`, `SectionHeader` into `components/layout/`.
- [ ] **Typed module registry** - replace `modules: any[]` in `gameData/index.ts` with `GameModule` interface.

## P4 - UX Polish

- [ ] **Notifications / toasts** - when prerequisites unlock, when tasks auto-switch, when max reached.
- [ ] **Settings persistence** - collapse state + tab selection to `localStorage`.
- [ ] **Accessibility** - keyboard nav for cards, aria labels, color-blind friendly palette.
- [ ] **Mobile** - current `w-56`/`w-64` sidebars overflow on narrow screens; add responsive collapse or drawer.
- [ ] **Debug overlay** - `?dev=1` or local flag that shows active modifiers, raw `GameState` JSON, and fast-forward tick.

## P5 - Docs

- [x] Add `ARCHITECTURE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/ENGINE_API.md`, `gameData/_template.ts` - *done in this batch*.
- [ ] Add `CHANGELOG.md` once releases start being tagged.
- [ ] Add `docs/EXAMPLES.md` with more complete packs (e.g., prestige loop, farming sim).

---

### How to pick an item

For agents: prefer P0/P1 items whose scope is one file and verifiable by `npm run build` + manual dev check. Open an issue or PR with `Fixes #X`. For P2+ engine features, open an RFC issue describing the `types.ts` shape before coding.
