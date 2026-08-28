# Cooldown Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show remaining cooldown for any ActionCard with effectiveCooldown >200ms via subtle bottom fill bar + centered countdown + tooltip line.

**Architecture:** Pure derived render in `components/ActionCard.tsx` — compute `effective` from `spell.baseCooldownMs` + `modify_cooldown_flat` mods, `remaining` from `Date.now() - lastUsed`, `pct` for bar width. No reducer change; rerender driven by existing 100ms TICK.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Vite 6, `context/GameContext.tsx` state

## Global Constraints

- Only show when `effectiveCooldown > 200` (hides default 200ms)
- No reducer/new interval — reuse `state.actions[].lastUsed` and TICK 100ms rerenders
- Keep existing dim `opacity-70` on cooldown, add bar/label on top
- `npm run build` and `npm run validate` must pass

---

### Task 1: Add cooldown derived state + bottom bar + tooltip

**Files:**
- Modify: `components/ActionCard.tsx:72-80` (derive effective/remaining/pct)
- Modify: `components/ActionCard.tsx:245-310` (tooltip add line)
- Modify: `components/ActionCard.tsx:395-425` (styleClass + bar/label JSX)
- Test: manual via `npm run dev` at http://localhost:3000

**Interfaces:**
- Consumes: `state.actions[action.id].lastUsed: number|undefined`, `SPELLS: SpellConfig[]`, `getActiveModifiers(): Modifier[]`, `getMaxResource`, `getFailureChance`
- Produces: `effectiveCooldown: number`, `remainingMs: number`, `cooldownPct: number`, `showCooldown: boolean` for bar/tooltip gating

- [ ] **Step 1: Verify current file state**

Read `components/ActionCard.tsx` lines 72-78 and 395-420 to confirm existing `effectiveCooldown`/`isOnCooldown`/`isDisabled` logic.

- [ ] **Step 2: Add derived cooldown vars after isUpgrade**

In `components/ActionCard.tsx` after line `const isUpgrade = ...`, add:

```ts
// Focus failure telegraph already exists in file from prior fix; keep it
// Cooldown derived state (>200ms only)
const baseEffective = spell ? spell.baseCooldownMs : (action.cooldownMs ?? 200);
const cooldownMods = spell || action.id
    ? getActiveModifiers().filter(m => m.property === 'cooldown' && m.type === 'flat' && (!m.actionId || m.actionId === action.id))
    : [];
const effectiveCooldown = spell
    ? Math.max(200, baseEffective + cooldownMods.reduce((s, m) => s + m.value, 0))
    : baseEffective;
const remainingMs = actionState.lastUsed ? Math.max(0, effectiveCooldown - (Date.now() - actionState.lastUsed)) : 0;
const cooldownPct = effectiveCooldown > 0 ? remainingMs / effectiveCooldown : 0;
const showCooldown = effectiveCooldown > 200 && remainingMs > 0 && isOnCooldown;
```

Note: `isOnCooldown` already computed as `Date.now() - lastUsed < effectiveCooldown` — align `effectiveCooldown` var so tooltip and bar use same value (currently tooltip uses `spell.baseCooldownMs` alone; unify).

- [ ] **Step 3: Update tooltip to show remaining**

In `renderTooltip` block for spell (around line 285-295), replace:

```tsx
<div className={`${failureChance > 0.10 ? 'text-amber-600 font-bold' : 'text-amber-700'}`}>
    {Math.round(failureChance * 100)}% failure risk{isFocusStrained ? ' • Focus strained' : ''}
</div>
```

Add below it (still inside `spell` div):

```tsx
{showCooldown && (
    <div className="text-slate-600 font-mono">
        {(remainingMs/1000).toFixed(1)}s remaining
    </div>
)}
```

Keep existing `Focus x/y (z%)` line intact.

- [ ] **Step 4: Add bar + label JSX + styleClass gating**

Update `styleClass` block (around 415-425) to keep `isFocusStrained` amber tint but also ensure cooldown dim still applies. The `showCooldown` dim is already via `isOnCooldown` (`bg-slate-50 opacity-70`), so no extra class needed.

In returned JSX, inside `<button>` before `</button>` close, after the existing header/limit badge div, add at bottom of button (absolute):

```tsx
{showCooldown && (
    <>
        <div className="absolute bottom-0 left-0 h-1 bg-slate-400" style={{ width: `${cooldownPct * 100}%` }} />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono bg-white/40 pointer-events-none">
            {(remainingMs/1000).toFixed(1)}s
        </div>
    </>
)}
```

Ensure button has `relative overflow-hidden` (already `overflow-visible` — change to `overflow-hidden` or keep bar inside: change `overflow-visible` to `overflow-hidden` in base `styleClass` string at line 395).

- [ ] **Step 5: Run validate + build**

Run:
```bash
npm run validate
npm run build
```
Expected: `Validate: PASS`, vite `✓ built in ...` with no TS errors. If `getActiveModifiers` filter type error, fix import.

- [ ] **Step 6: Manual QA in dev**

Run `npm run dev`, open http://localhost:3000:
- Trigger `first_spark` -> `catch_your_breath` done -> click `Coax the Ember` (2s) — verify bottom bar fills 100% then drains 2s, centered `2.0s` -> `0.0s`, tooltip shows `1.8s remaining` while hovering, button re-enables when bar empty.
- Test `Quiet the Bell (1.5s)`, `Spendthrift's Flare (8s)` same.
- Click `Condense Motes to Mana` (1s) -> effective 1000 >200, should show bar (1s). If undesired, confirm threshold still >200.
- Click upgrade `Deepen Ash` (200ms default) -> no bar, only dim (threshold).
- Equip `conclave_signet` (-1000ms Ash) -> Ash bar duration visibly shorter.

- [ ] **Step 7: Commit**

```bash
git add components/ActionCard.tsx
git commit -m "feat(ui): show cooldown bar+countdown for actions >200ms"
```

---

## Self-Review

- Spec coverage: §1 scope (>200ms subtle bar) -> Task1 Step2-4; §2 data flow (lastUsed/effective/remaining/pct via TICK) -> Step2; §3 styling/edge/testing -> Step4-6
- Placeholder scan: no TBD/TODO, all file paths exact, all code blocks concrete
- Type consistency: `effectiveCooldown`/`remainingMs`/`cooldownPct` types number, `showCooldown` boolean reused in tooltip+bar, matches `GameContext` `lastUsed: number|undefined` and `Modifier` `property:'cooldown'`
