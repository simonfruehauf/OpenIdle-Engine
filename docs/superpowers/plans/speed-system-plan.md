# Speed System Plan — x1/x2/x4/x8 with offline time_essence

## Context
Add a data-driven game-speed multiplier (1x,2x,4x,8x). Higher speeds consume a flat per-tick cost definable in gameData. `time_essence` resource is gained ONLY from offline time. UI shows selector with visual feedback. All per-tickflat costs are validated.

Current loop: fixed 100ms interval (`TICK_RATE=100`), reducer receives `dt:100`, uses `dtSeconds=dt/1000` for all perSecond math.
Target: `dispatch({type:"TICK", dt: TICK_RATE * gameSpeed})` so all math auto-scales.

## Tasks

### Task 1 — Types & State Infrastructure
**Files:** `types.ts`, `gameData/index.ts`
- Add `SpeedTierConfig { multiplier: 1|2|4|8, costs: Cost[], prerequisites?: Prerequisite[], name?: string, description?: string }`
- Add `SPEED_TIERS` collection to `gameData/index.ts` (`collect("SPEED_TIERS")` export)
- Extend `GameState` with `gameSpeed: 1|2|4|8`, `lastSeen: number` (unix ms, for offline calc), bump version if needed (or keep same and handle defaults)
- Extend `GameContextType` with `setGameSpeed(multiplier)`, `getSpeedCost(multiplier): Cost[]`, config gets `speedTiers: SpeedTierConfig[]`
- Create `gameData/core/speed.ts` template (empty placeholder) to document shape — real content in Task3.

### Task 2 — Core Engine: Loop Scaling + Per-Tick Cost + Offline Accumulation
**Files:** `context/GameContext.tsx`
- In `createInitialState()`: init `gameSpeed=1`, `lastSeen=Date.now()`
- In `LOAD_GAME` merge: default missing fields, then compute offline gain:
  - Lookup offline resource: find SPEED_TIERS costs that use resourceId, or dedicated `OFFLINE_RESOURCE_ID = "time_essence"` constant.
  - Rate defined in `gameData/core/speed.ts` as `OFFLINE_GENERATION: { resourceId:"time_essence", ratePerOfflineSecond: 0.05 }` (definable). If not defined, default 0.1/sec.
  - `elapsedSec = (Date.now() - incoming.lastSeen)/1000`, cap at e.g. 7 days (604800s), calculate `gained = floor(rate * elapsedSec)`, add to resource respecting `calculateMax`, log entry "Welcome back! Gained X time_essence while away (Y hours)".
  - Update `lastSeen` to now.
- Game loop: read `stateRef.current.gameSpeed || 1`, dispatch `dt: TICK_RATE * speed`. Also update `lastSeen` periodically (every tick or every save) — mutate `newResources?` no, just state field.
- TICK reducer: at top, check affordability for current speed tier before processing other tasks. Use tier's `costs[]` (flat per tick, NOT scaled by dt). If cannot afford any cost entry, auto-downgrade to highest affordable tier (including 1x which always affordable) before scaling dt logic. Log "Insufficient time_essence..." when downgrading. Deduct costs AFTER checking.
- Also update `lastSeen` in returned state each tick (or every ~1s to avoid churn): `lastSeen: Date.now()`.
- Add `SET_GAME_SPEED` reducer case: validates prerequisites, checks canAfford, sets `gameSpeed`, logs. Used by UI.
- Add helper `getActiveSpeedTier()` and export `SPEED_TIERS` import.

### Task 3 — GameData Content
**Files:** `gameData/core/resources.ts`, `gameData/core/speed.ts` (new)
- `resources.ts`: add `time_essence` ResourceConfig `{ id:"time_essence", name:"Time Essence", type:"basic", baseMax:1000, initialAmount:0, description:"Crystallized time itself. Accumulates only while you are away. Spend to accelerate the world." }`
- New `gameData/core/speed.ts`: export `SPEED_TIERS: SpeedTierConfig[]` with 1x/2x/4x/8x:
  - 1x: `{ multiplier:1, name:"Normal", costs:[], description:"Real time." }`
  - 2x: `{ multiplier:2, name:"Haste", costs:[{resourceId:"time_essence", amount:1}], description:"2× speed, 1 essence/tick." }`
  - 4x: `{ multiplier:4, costs:[{resourceId:"time_essence", amount:3}] }`
  - 8x: `{ multiplier:8, costs:[{resourceId:"time_essence", amount:8}], prerequisites:[{resourceId:"time_essence", minMax:500}] }` — gate 8x behind capacity.
  - Also export `OFFLINE_RATE: { resourceId:"time_essence", ratePerSecond:0.08 }` — ~5 per minute offline, ~288/hr.
- Register new module in `gameData/index.ts`.
- Ensure `baseMax:0` unlock path not needed — time_essence starts visible but gains only offline; optionally give 0 max then unlock via first offline? Better baseMax 500 visible. Leave as 1000 visible.
- Run validate.

### Task 4 — UI: Speed Selector & Visual Feedback
**Files:** `App.tsx`, `components/SpeedControl.tsx` (new), maybe `index.css`
- Create `components/SpeedControl.tsx`: horizontal button group 1× 2× 4× 8×, highlights active. Each button:
  - Tooltip on hover (reuse portal pattern) showing costs per tick, prerequisites, affordability.
  - Disabled state if prerequisites not met or cannot afford (dim, tooltip explains).
  - Active pulse animation when >1x (Tailwind `animate-pulse` + speed-tinted border).
- Integrate into `App.tsx` Header (next to save buttons or below resource header). Show:
  - Current speed indicator always visible.
  - When >1x, show drain rate: "−X essence/tick (Y/sec)" and remaining time: "≈ N seconds left".
  - Warning flash (amber/red) when essence < 10 ticks worth.
  - Offline gain toast/log on load handled in engine.
- Wire `setGameSpeed` from GameContext.
- Accessibility: keyboard nav, aria labels.
- No change to `TaskCard`/`ActionCard`.

### Task 5 — Persistence, Validation & Polish
**Files:** `scripts/validateGameData.ts`, `context/GameContext.tsx` (save/load finalize), `types.ts` version bump
- Validation: if `SPEED_TIERS` defined, check referenced `resourceId` in `costs[]` exists in RESOURCES, check multipliers are subset of {1,2,4,8}, warn if hidden unlock missing, check offline rate resource exists.
- Save: ensure `gameSpeed` and `lastSeen` included in persisted JSON (already via `stateRef.current`). Add migration for old saves (`version` 7→8 or keep 7 but handle defaults gracefully).
- Auto-save still 30s but also save `lastSeen` on `visibilitychange` / `beforeunload`.
- Test manual: `npm run build` must pass, `npm run validate` must pass, dev reload shows speed control, offline simulation via `localStorage` timestamp manipulation.

## Global Constraints
- Never edit save version without migration handling additive.
- Keep reducer pure, helpers pure where possible.
- Tailwind 4 patterns only, no custom CSS files per component.
- IDs snake_case, no duplicates.
- `npm run build` + `npm run validate` must pass at each task.

## Verification
- Task1: `npm run build` passes, types correct.
- Task2: Manual TICK test: set speed 2x, dt doubled, task progress 2× faster, resource drain 1/tick.
- Task3: Validate passes with new resource/tiers.
- Task4: Visual: controls render, tooltips show, pulse at higher speeds.
- Task5: Simulate offline 10min → gain ~48 essence, check log.
