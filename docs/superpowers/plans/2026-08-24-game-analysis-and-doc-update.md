# Game Analysis & Doc+Bug Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring ARCHITECTURE/GAMEDATA_GUIDE/ENGINE_API/AGENTS/CONTRIBUTING/ROADMAP in sync with code (v6), and fix P0/P1 economy & modifier bugs.

**Architecture:** Extract/test pure helpers (calculateMax/Yield/getScaledCost) → fix getScaledCost branching → expand getActiveModifiers → unify prerequisite helpers → refresh docs per file → add scripts/validateGameData.ts + tsc gate → cleanup duplicates & tooltip yield.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind 4, Node 20

## Global Constraints
- IDs stay snake_case globally unique
- State mutations only via gameReducer context/GameContext.tsx:190
- Data-driven content lives in gameData/ registered in gameData/index.ts:26
- Use Tailwind utility patterns, no per-component CSS files
- npm run build must pass (will become tsc --noEmit && vite build); npm run validate must pass after added
- Keep reducer helpers pure and unit-testable

---

### Task 1: Fix getScaledCost economy divergence

**Files:**
- Modify: `context/GameContext.tsx:195-226`
- Modify: `components/TaskCard.tsx:34` and `components/ActionCard.tsx:33` (optional share)
- Test: `context/__tests__/getScaledCost.test.ts` (new, or inline python check)

**Interfaces:**
- Consumes: Cost {resourceId, amount, scaleFactor?, scaleType?, scalesByCompletion?}
- Produces: `getScaledCostForAction(Cost, executions: number): number` and `getScaledCostForTask(Cost, level:number, completions:number): number` — next tasks rely on consistent naming

- [ ] **Step 1: Write failing test (or python repro)**
```ts
// Action: trash_search amount 2.5 factor 1.05, exec 0 => 2.5 ; exec 2 => 2.5*1.05^2=2.75625
expect(getScaledCostForAction({amount:2.5,scaleFactor:1.05}, 2)).toBeCloseTo(2.75625)
// Task: wall_destroy cost 0.5 time factor 1.1, level 3 => 0.5*1.1^2=0.605
```
Run: `python3 -c "..."` or vitest stub. Expected FAIL before fix (currently returns 0.413... due exponent -1).

- [ ] **Step 2: Fix GameContext getScaledCost**
Replace heuristic:
```ts
// OLD
if (scalesByCompletion) exp=completions; else if (resourceId) exp=level-1 else exp=executions
// NEW: split functions or add kind param
const getScaledCost = (c: Cost, execs:number, level:number, comps:number, kind:'task'|'action') => {
  if (!c.scaleFactor) return c.amount;
  const exp = c.scalesByCompletion ? comps : (kind==='task' ? level-1 : execs);
  ...
}
```
Update call sites: `TRIGGER_ACTION` passes 'action', `TOGGLE_TASK`/`TICK` passes 'task'.

- [ ] **Step 3: Align card helpers**
Either import shared helper from `context/GameContext.tsx` or duplicate corrected logic in `ActionCard.getScaledCost` (uses execs) and `TaskCard.getScaledCost` (uses level/completions). Keep in sync.

- [ ] **Step 4: Verify**
Run `npm run build` expected PASS; quick manual: click trash_search 3x, cost should increase not decrease.

- [ ] **Step 5: Commit**
```bash
git add context/GameContext.tsx components/ActionCard.tsx components/TaskCard.tsx
git commit -m "fix: correct getScaledCost branching for actions vs tasks"
```

### Task 2: Complete getActiveModifiers & yield handling

**Files:**
- Modify: `context/GameContext.tsx:15-43` (getActiveModifiers)
- Modify: `context/GameContext.tsx:594-642` (TRIGGER_ACTION apply) and `:768-823` (TICK applyTaskEffect)
- Create: `components/tooltipHelpers.tsx` (optional extract)

**Interfaces:**
- Consumes: ItemConfig.effects Effect[]
- Produces: Modifier[] covering all Effect.type handled uniformly

- [ ] **Step 1: Extend getActiveModifiers**
Add branches:
```ts
else if (e.type==='set_max_resource' && e.resourceId) push {type:'set', property:'max', ...}
else if (e.type==='add_passive_gen_per_unit' && e.sourceResourceId) push {type:'flat', property:'gen_per_unit', sourceResourceId, targetResourceId}
else if (e.type==='increase_max_tasks') push {property:'max_tasks' ? handle separately?}
else if (e.type==='increase_max_executions') push {property:'max_exec', taskId/actionId}
// reset_resource_modifiers does not create modifier
```

- [ ] **Step 2: Fix yield pushes in TRIGGER_ACTION/TICK**
Change from `if(e.taskId) push... if(e.actionId) push...` to:
```ts
if (e.type==='modify_yield_pct' || e.type==='modify_yield_flat') {
  // Allow global (no taskId/actionId) or specific
  mods.push({ sourceId: config.name, type, value, property:'yield', taskId:e.taskId, actionId:e.actionId, resourceId:e.resourceId })
}
```

- [ ] **Step 3: Extract tooltip helpers (optional but reduces drift)**
Create `components/tooltipHelpers.tsx` with `getName(config, id)` and `renderEffect(e, modifiers)` shared.

- [ ] **Step 4: Verify**
`npm run build` PASS; check pineal_lens still buffs faith_alley_walk; test gen_per_unit converter via wellness.

- [ ] **Step 5: Commit**
```bash
git add context/GameContext.tsx components/tooltipHelpers.tsx
git commit -m "fix: expand getActiveModifiers and yield handling"
```

### Task 3: Unify prerequisite & visibility logic + prerequisitesAny

**Files:**
- Modify: `context/GameContext.tsx:1167`, `:1396`, `:1423`, `App.tsx:368`

**Interfaces:**
- Produces: `checkPrereqsInternal(resources|state, prereqs)` single implementation used by both TICK latch and exposed checkPrerequisites/checkIsVisible

- [ ] **Step 1: Create shared helper**
```ts
const evalPrereq = (p:Prerequisite, ctx:{resources,actions,tasks,getMax}) => {
  if (p.resourceId) { check minAmount, maxAmount, minMax via getMax }
  if (p.actionId) { check executions >= (p.minExecutions ?? 1) }
  if (p.taskId) { require unlocked, then minLevel ??1, plus minAmount/minExecutions for completions }
  return true;
}
const checkPrereqs = (list, ctx) => !list || list.every(p=>evalPrereq(p,ctx))
```

- [ ] **Step 2: Support prerequisitesAny on slots**
Update slot unlock check to `prerequisites?.every && prerequisitesAny?.some` (`types.ts:74`)

- [ ] **Step 3: Fix checkIsVisible to also hide resources/converters reliably and align App dropdown**
Ensure `App.tsx:368` filters Auto-Rest with same check.

- [ ] **Step 4: Fix tooltip Needs rendering to cover all prereq kinds**

- [ ] **Step 5: Verify & Commit**
```bash
git add context/GameContext.tsx App.tsx components/TaskCard.tsx components/ActionCard.tsx
git commit -m "fix: unify prerequisite checks and add prerequisitesAny support"
```

### Task 4: Docs sync ARCHITECTURE & ENGINE_API

**Files:**
- Modify: `ARCHITECTURE.md:124,149`, `ARCHITECTURE.md:62`, `docs/ENGINE_API.md:84`

- [ ] **Step 1: ARCHITECTURE.md** update §7 persistence to mention version 6 + migration; §9 known gotchas remove dead fester/cooldown/breakdown items, add new ones (getScaledCost, getActiveModifiers partial)
- [ ] **Step 2: docs/ENGINE_API.md** §1.4 add row for `add_passive_gen_per_unit`, §1.6 note cooldownMs enforced (200ms default), §2 hooks include getActiveModifiers
- [ ] **Step 3: Verify docs render** `npm run build` already; manual read

- [ ] **Step 4: Commit**
```bash
git add ARCHITECTURE.md docs/ENGINE_API.md
git commit -m "docs: sync ARCHITECTURE and ENGINE_API with code v6"
```

### Task 5: Docs sync AGENTS / CONTRIBUTING / ROADMAP / GAMEDATA_GUIDE

**Files:**
- Modify: `AGENTS.md:4`, `CONTRIBUTING.md:8`, `docs/ROADMAP.md`, `GAMEDATA_GUIDE.md`

- [ ] **Step 1: AGENTS.md §4** replace stale bug list with current (dup Rest names, TaskCard yield display, validate missing, etc.)
- [ ] **Step 2: CONTRIBUTING.md §8** check off fixed items, add remaining P0/P1
- [ ] **Step 3: docs/ROADMAP.md** move fixed cooldown/breakdown to done, add getScaledCorrect etc.
- [ ] **Step 4: GAMEDATA_GUIDE.md** add `add_passive_gen_per_unit` doc, slot `prerequisitesAny`, Equipment example

- [ ] **Step 5: Commit**
```bash
git add AGENTS.md CONTRIBUTING.md docs/ROADMAP.md GAMEDATA_GUIDE.md
git commit -m "docs: refresh AGENTS/CONTRIBUTING/ROADMAP/GAMEDATA_GUIDE"
```

### Task 6: Validation & build hardening

**Files:**
- Create: `scripts/validateGameData.ts`
- Modify: `package.json:6`
- Modify: `gameData/index.ts:26` (typed GameModule)
- Modify: `gameData/tasks.ts:5` rename rest

- [ ] **Step 1: Implement validate script** checking duplicate IDs, dangling resourceId/category/taskId/actionId/itemId refs, hidden unlock path (as per ENGINE_API §3)
- [ ] **Step 2: package.json** add `"validate": "tsx scripts/validateGameData.ts"` or `ts-node`, and `"build": "tsc --noEmit && vite build"`
- [ ] **Step 3: Rename** rest_bench/rest_bed display names to distinct
- [ ] **Step 4: Verify** `npm run validate` PASS, `npm run build` PASS
- [ ] **Step 5: Commit**
```bash
git add scripts/validateGameData.ts package.json gameData/index.ts gameData/tasks.ts
git commit -m "feat: add validate script and build hardening"
```

### Task 7: Cleanup duplicates & UI polish

**Files:**
- Modify: `context/GameContext.tsx:320` (duplicate migration), `components/TaskCard.tsx:279` (yield display), `components/ActionCard.tsx` format

- [ ] **Step 1: Deduplicate LOAD_GAME v6 migration** extract helper `fixCatInsightResources`
- [ ] **Step 2: Fix TaskCard yield display** render `val.toFixed(2)` instead of `e.amount`
- [ ] **Step 3: Optional shared getName/renderEffect extraction or at least sync**
- [ ] **Step 4: Verify**
Run `npm run build`; manual tooltip shows boosted values.

- [ ] **Step 5: Commit**
```bash
git add context/GameContext.tsx components/TaskCard.tsx components/ActionCard.tsx
git commit -m "fix: cleanup migration duplication and tooltip yield display"
```
