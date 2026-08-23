# Fix Report — Important #1: wellness_stitch_pouch rest minLevel:3 gate

**Date:** 2026-08-23
**Issue:** Final review Important #1 — `wellness_stitch_pouch` had no rest minLevel gate; `accessory_2` unlockable before any discipline leveling (prereqs only `wellness_find_flyer` + money/mana).
**Files changed:**
- `gameData/wellness.ts`
- `types.ts`
- `components/EquipmentView.tsx`

## Changes

### 1. `types.ts:68-73`
Added OR support to `SlotConfig`:
```ts
export interface SlotConfig {
  id: SlotID;
  name: string;
  prerequisites?: Prerequisite[]; // AND
  prerequisitesAny?: Prerequisite[]; // OR: if present, at least one entry must be satisfied
}
```
Allows slot visibility to be satisfied by any one of multiple actions without engine AND limitation. Backward compatible: empty/undefined `prerequisitesAny` is ignored.

### 2. `components/EquipmentView.tsx:116-123`
Patched slot filter from:
```ts
config.slots.filter(s => checkPrerequisites(s.prerequisites))
```
to:
```ts
config.slots.filter(s => {
  if (!checkPrerequisites(s.prerequisites)) return false;
  if (s.prerequisitesAny && s.prerequisitesAny.length > 0) {
    return s.prerequisitesAny.some(p => checkPrerequisites([p]));
  }
  return true;
})
```
Implements OR semantics per `SlotConfig.prerequisitesAny`. Each entry is evaluated via existing `checkPrerequisites([p])` (which handles `actionId`/`taskId`/`resourceId` AND internally via `every`).

### 3. `gameData/wellness.ts:9-21` — SLOTS
Replaced:
```ts
{ id: "accessory_2", name: "Accessory II", prerequisites: [{ actionId: "wellness_stitch_pouch", minExecutions: 1 }] }
```
With:
```ts
{
  id: "accessory_2",
  name: "Accessory II",
  prerequisites: [],
  prerequisitesAny: [
    { actionId: "wellness_stitch_pouch_yoga", minExecutions: 1 },
    { actionId: "wellness_stitch_pouch_running", minExecutions: 1 },
    { actionId: "wellness_stitch_pouch_swimming", minExecutions: 1 },
    { actionId: "wellness_stitch_pouch_hiking", minExecutions: 1 },
  ],
}
```
Slot now visible after ANY pouch is purchased; empty `prerequisites` (AND) always passes, then OR decides.

### 4. `gameData/wellness.ts:162-209` — ACTIONS
Replaced single:
```ts
wellness_stitch_pouch (prereq: wellness_find_flyer, costs 80/15, health+4, max1)
```
With 4 discipline-specific actions:
- `wellness_stitch_pouch_yoga` — prereqs `[wellness_find_flyer, rest_yoga minLevel:3]`, costs money 80 + mana 15, effect health+4, maxExecutions 1, exclusiveWith other 3, log "Your bag now holds two charms... (Yoga discipline)", category wellness
- `wellness_stitch_pouch_running` — prereqs `[wellness_find_flyer, rest_running minLevel:3]` ...
- `wellness_stitch_pouch_swimming` — prereqs `[wellness_find_flyer, rest_swimming minLevel:3]` ...
- `wellness_stitch_pouch_hiking` — prereqs `[wellness_find_flyer, rest_hiking minLevel:3]` ...

Each retains same costs/effects (health +4 flat max), same category, same maxExecutions, exclusiveWith mutual 3. Achieves OR semantics without engine change beyond the EquipmentView patch.

## Verification

- `npm run build` — PASS (vite v6.4.1, 51 modules, 353.44 kB, no type errors)
- ID uniqueness: 192 total IDs, 192 unique, duplicates [] (was 189; +3 for 1→4 pouch expansion)
- Slot prereqAny entries: 4, each `actionId` resolves to defined pouch action
- Each pouch prereqs contain `wellness_find_flyer` + correct `rest_*` `minLevel:3`
- Each pouch costs `money 80 + mana 15` verified
- Each pouch effect `modify_max_resource_flat health 4` verified
- Each pouch `exclusiveWith` lists other 3 verified via regex
- Old exact `wellness_stitch_pouch` (without suffix) no longer present — 0 refs in wellness.ts
- Resource refs `{time, health, mana, money}` remain valid; no new resources
- Category `wellness` unchanged; no save version bump needed (additive; old saves with single pouch will have orphaned executions but health modifier remains — acceptable for dev saves; new slot requires new pouch actions)

## Trade-offs / Notes

- **Backward compat:** Saves that purchased old `wellness_stitch_pouch` will not automatically show `accessory_2` until a new pouch is earned (orphan modifier health+4 remains). Not migrated automatically to keep change minimal; could add `prerequisitesAny` 5th entry `wellness_stitch_pouch` or LOAD_GAME migration if needed for production saves.
- **Engine change is minimal:** Only `SlotConfig` type + 6-line EquipmentView filter change; `GameContext.checkPrerequisites` NOT patched (used only in EquipmentView for slots; tasks/actions still use AND only, as intended).
- **Spec compliance:** Now enforces plan Global Constraint "level 3 gate for slot" via rest minLevel:3 on each pouch, resolving final-review Important #1.
