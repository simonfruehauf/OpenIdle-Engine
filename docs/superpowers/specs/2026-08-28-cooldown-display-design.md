# Cooldown Display Design

**Date:** 2026-08-28
**Status:** Approved for Implementation
**Scope:** Subtle visual cooldown for actions with effectiveCooldown >200ms

---

## 1. Overview

`ActionCard` currently dims on cooldown (`components/ActionCard.tsx:407` opacity-70) but shows no timer. Spell casts (1.5-30s) and mastery actions feel unresponsive - player cannot tell if click was ignored vs on cooldown. This spec adds a minimal, non-intrusive display for any action where `effectiveCooldown > 200ms` (i.e., non-default), keeping 200ms upgrades silent.

---

## 2. Goals / Non-Goals

**Goals:**
- Show remaining cooldown for spells and long actions (>200ms) without layout shift
- Reuse existing `lastUsed`/`effectiveCooldown` logic, no reducer changes
- Keep subtle `bar + dim` style approved (thin bottom fill + tooltip countdown)
- Update at 100ms tick rate already driving renders

**Non-Goals:**
- No change for default 200ms actions (still dim-only, avoids flicker)
- No new reducer fields, no interval timers beyond existing TICK
- No full-overlay sweep or circular timer (rejected approaches B/C)

---

## 3. Architecture

### 3.1 Components Affected
- `components/ActionCard.tsx` — sole visual change
- `context/GameContext.tsx` — no change; provides `state.actions[].lastUsed`, `getFailureChance`, `getActiveModifiers`

### 3.2 Data Flow
```
state.actions[action.id].lastUsed (set in GameContext.tsx:753,929 on TRIGGER_ACTION/CAST_SPELL)
  -> ActionCard computes:
     effective = spell ? spell.baseCooldownMs + sum(flat cooldown mods) : action.cooldownMs ?? 200
     remaining = max(0, effective - (Date.now() - lastUsed))
     pct = remaining / effective  // 0..1, for bar width
     isVisible = effective > 200 && remaining > 0
  -> render: absolute h-1 bottom bar width pct*100%, centered "X.Xs" label, tooltip "X.Xs remaining"
```
Rerender driven by `TICK` interval 100ms (`GameContext.tsx:1498`) which already forces `useGame()` consumers to re-render.

### 3.3 Styling
- Button `relative overflow-hidden` (already)
- Bar: `absolute bottom-0 left-0 h-1 bg-slate-400 transition-none` width from `pct`
- Label: `absolute inset-0 flex items-center justify-center text-[10px] font-mono bg-white/40` visible only when `isVisible`
- Tooltip: `createPortal` at `ActionCard.tsx:262`, add line `"<remaining>s remaining"` with amber tint when `remaining>0`, existing failure/mana lines unchanged
- Threshold `>200` avoids showing for default spam; matches user request "any that aren't default 200ms (or lower)"

---

## 4. Edge Cases

- `lastUsed` undefined -> no bar, `isVisible=false`
- `effective` with large flat reductions clamped `max(200, ...)` already in `GameContext.tsx:848`
- `remaining` clamped 0, `pct` clamped 0-1, bar disappears at 0
- Very long cooldowns (60s `the_unmoved`) — bar drains proportionally, label shows `60.0s` -> `0.0s`
- Modifiers changing `effective` mid-cooldown — bar jumps proportionally, acceptable (no retroactive adjustment)
- Tooltip position flip already handled at `ActionCard.tsx:256`

---

## 5. Testing

- Manual `npm run dev`:
  - Click `Coax the Ember (2s)` — bar fills then drains 2s, tooltip countdown 2.0->0.0, button re-enables exactly when bar empty
  - Click `Quiet the Bell (1.5s)`, `Spendthrift's Flare (8s)` same
  - Click upgrade `Deepen Ash` (200ms) — still dims only, no bar (threshold)
  - With `modify_cooldown_flat` items equipped, verify effective reduction reflected in bar duration
- Automated: `npm run build` + `npm run validate` pass, no new IDs
- No persistence change — `lastUsed` is timestamp, not saved across reload (acceptable, cooldown resets)

---

## 6. Implementation Steps (for writing-plans)

1. Compute `focus`-independent `effective`/`remaining`/`pct` in `ActionCard`
2. Add bar + label JSX gated by `effective>200 && isOnCooldown`
3. Add tooltip line gated by same
4. Verify build/validate, manual QA
