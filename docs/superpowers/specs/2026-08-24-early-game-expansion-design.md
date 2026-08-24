# Early Game Expansion Design

**Date:** 2026-08-24
**Status:** Approved for Implementation

---

## 1. Overview

Expand the early game (pre-apartment through post-library) with three independent job paths, three self-contained side-branches, and a loot/drop system for existing and new tasks. All content is additive — no `types.ts` changes required.

---

## 2. Job Paths (Parallel, Independent)

### Design Principle
Jobs are **parallel and independent** — players can work multiple jobs simultaneously or sequentially. No `exclusiveWith` between job paths. Each job has:
- 1 "shift" task (autoRestart loop, main income)
- 2-3 "project" tasks (progressRequired, limited completions, skill-building)
- 2-3 upgrade actions (unlock better shifts, equipment, passive bonuses)
- 3-4 equipment items (slot-specific, thematic effects)

### 2.1 Library Assistant
**Category:** `library_job`
**Unlock:** `library_find` (1) + `lore` ≥ 5
**Core Resources:** `lore`, `insight`, `quiet`, `mana`

| ID | Name | Type | Description |
|----|------|------|-------------|
| `lib_job_shelve` | Shelve Returns | shift (autoRestart) | Cost: time 0.35. Yield: quiet 0.15, lore 0.08, xp 4 |
| `lib_job_catalog` | Catalog New Acquisitions | project (progress 18, max 10) | Start: quiet 5. Yield: insight 0.3, lore 0.5, quiet 1 |
| `lib_job_research` | Assist Patron Research | project (progress 25, max 6) | Start: quiet 8, lore 3. Yield: insight 0.6, mana 0.4 |
| `lib_job_head_start` | Request Head Librarian Role | action (max 1) | Cost: insight 6, lore 10. Effect: +max quiet 15, +max insight 8, unlock `lib_job_archive` |
| `lib_job_archive` | Manage Special Collections | action (max 1) | Cost: insight 12, quiet 15. Effect: +passive lore 0.05, +max mana 10, item `archivist_glasses` |

**Items:** `archivist_glasses` (head, +insight yield), `cardigan` (body, +mana passive), `cataloging_folio` (accessory, +lore yield)

### 2.2 Barista
**Category:** `cafe`
**Unlock:** `appartment` (1) + `money` ≥ 30
**Core Resources:** `money`, `health`, `favor`, `time`

| ID | Name | Type | Description |
|----|------|------|-------------|
| `cafe_shift_morning` | Morning Rush | shift (autoRestart) | Cost: time 0.4, health 0.05. Yield: money 1.2, favor 0.1, xp 5 |
| `cafe_shift_evening` | Evening Calm | shift (autoRestart) | Cost: time 0.3, health 0.03. Yield: money 0.8, mana 0.15, favor 0.15, xp 4 |
| `cafe_learn_recipes` | Learn Specialty Drinks | project (progress 20, max 8) | Start: money 5, favor 3. Yield: insight 0.2, health 0.3 |
| `cafe_regulars` | Remember Regulars' Orders | project (progress 15, max 12) | Start: favor 5. Yield: money 0.5, favor 0.4, lore 0.1 |
| `cafe_promo_shift_lead` | Become Shift Lead | action (max 1) | Cost: money 40, favor 10. Effect: +max money 50, +max favor 10, unlock `cafe_shift_lead` |
| `cafe_promo_manager` | Assistant Manager | action (max 1) | Cost: money 120, favor 20, insight 4. Effect: +passive money 0.08, +max health 8, item `barista_apron` |

**Items:** `barista_apron` (body, +money yield on cafe tasks), `chipped_mug` (accessory, +mana passive), `bag_of_beans` (accessory_2, +health passive)

### 2.3 Community Garden
**Category:** `garden`
**Unlock:** `appartment` (1) + `health` max ≥ 15
**New Resources:** `produce` (basic, baseMax 0), `seeds` (basic, baseMax 0)
**Core Resources:** `health`, `mana`, `produce`, `seeds`

| ID | Name | Type | Description |
|----|------|------|-------------|
| `garden_tend_beds` | Tend the Beds | shift (autoRestart) | Cost: time 0.5, health 0.1. Yield: produce 0.15, health 0.1, mana 0.05, xp 4 |
| `garden_plant_seasonal` | Plant Seasonal Crop | project (progress 30, max 4) | Start: seeds 5, produce 3. Yield: produce 4, insight 0.3, mana 0.4 |
| `garden_compost` | Manage Compost | project (progress 20, max 6) | Start: produce 8. Yield: seeds 3, health 0.5, lore 0.2 |
| `garden_harvest_festival` | Organize Harvest Share | project (progress 40, max 2) | Start: produce 20, favor 10. Yield: money 30, favor 8, reputation 5 |
| `garden_tool_shed` | Access Tool Shed | action (max 1) | Cost: money 60, produce 10. Effect: +max produce 20, +max seeds 15, item `gardening_gloves` |
| `garden_greenhouse_key` | Get Greenhouse Key | action (max 1) | Cost: produce 30, insight 8, mana 15. Effect: +passive mana 0.03, unlock `rooftop_garden` branch, item `sun_hat` |

**Items:** `gardening_gloves` (hand_r, +produce yield), `sun_hat` (head, +mana passive), `woven_basket` (accessory, +max produce), `almanac` (accessory_2, +insight passive)

---

## 3. Side-Branches (Self-Contained)

### 3.1 Abandoned Subway Tunnels
**Category:** `tunnels`
**Unlock:** `find_cat` (1) + `insanity` ≥ 5
**New Resources:** `scrap` (basic), `echoes` (basic)

| Content | Details |
|---------|---------|
| **Tasks** | `tunnel_explore` (shift): time 0.4, health 0.08 → scrap 0.12, echoes 0.05, insanity 0.02<br>`tunnel_map` (project, progress 25, max 8): start echoes 5 → lore 0.4, insight 0.2, scrap 2<br>`tunnel_salvage` (project, progress 20, max 10): start scrap 8, health 2 → money 5, scrap 3, item chance<br>`tunnel_deep_delve` (project, progress 50, max 3): start echoes 15, insanity 10 → insight 2, `strange_artifact` 1 |
| **Actions** | `tunnel_gear_up`: money 80, scrap 10 → +max health 5, +max scrap 20, item `headlamp`<br>`tunnel_follow_echo`: echoes 20, insight 6 → +passive insight 0.02, unlock `tunnel_deep_delve`<br>`tunnel_cat_guidance`: cat 1, insanity 8 → +passive echoes 0.03, item `cat_whisker` |
| **Items** | `headlamp` (head, +scrap yield), `cat_whisker` (accessory, +echoes passive), `tunnel_map_item` (accessory_2, +lore yield) |
| **Converter** | `tunnel_scrap_press`: cost money 100, scrap 20 → cost/sec: money 0.15 → effects/sec: scrap 0.12 |

### 3.2 Rooftop Garden
**Category:** `rooftop`
**Unlock:** `wellness_visit_center` (1) OR `garden_greenhouse_key` (1)
**New Resources:** `sunlight` (basic, baseMax 0, passiveGen: time 0.01), `herbs` (basic)

| Content | Details |
|---------|---------|
| **Tasks** | `rooftop_bask` (shift, rest): cost: none → time 0.4, health 0.2, mana 0.15, sunlight 0.1<br>`rooftop_grow_herbs` (project, progress 25, max 6): start sunlight 10, seeds 3 → herbs 2, mana 0.5, insight 0.15<br>`rooftop_dry_herbs` (project, progress 15, max 8): start herbs 5 → dried_herbs 3, mana 0.3<br>`rooftop_brew_tea` (project, progress 20, max 5): start dried_herbs 4, mana 5 → insight 1, mana 2, calm 1 |
| **Actions** | `rooftop_install_trellis`: money 50, produce 10 → +max sunlight 15, +max herbs 12, item `trellis_clippers`<br>`rooftop_moon_garden`: insight 10, mana 20 → +passive mana 0.04, unlock `rooftop_brew_tea`, item `moonwater_vial` |
| **Items** | `trellis_clippers` (hand_r, +herbs yield), `moonwater_vial` (accessory, +mana passive), `pressed_flower` (accessory_2, +insight passive) |
| **Converter** | `rooftop_solar_still`: cost money 120, sunlight 30 → cost/sec: sunlight 0.08 → effects/sec: mana 0.06, insight 0.015 |

### 3.3 Underground Fighting Ring
**Category:** `fighting`
**Unlock:** `subways_job_2` (1) OR `oddjobs` (1) + `health` max ≥ 20
**New Resources:** `blood_money` (basic), `reputation` (stat, baseMax 0)

| Content | Details |
|---------|---------|
| **Tasks** | `fight_spar` (shift): cost: time 0.3, health 0.3 → blood_money 0.8, reputation 0.05, xp 8<br>`fight_undercard` (project, progress 30, max 5): start health 10, blood_money 5 → reputation 2, blood_money 8, insight 0.3<br>`fight_main_event` (project, progress 60, max 2): start reputation 15, health 20, blood_money 20 → reputation 8, blood_money 30, money 50, `champion_token` 1<br>`fight_recover` (rest, autoRestart): cost: none → health 0.6, mana 0.1, time 0.3 |
| **Actions** | `fight_better_gear`: blood_money 30, reputation 5 → +max health 10, +max blood_money 25, item `wraps`<br>`fight_corner_man`: reputation 10, insight 5 → +passive blood_money 0.05, unlock `fight_main_event`, item `mouthguard`<br>`fight_champion_belt`: reputation 30, blood_money 100, insight 15 → +passive reputation 0.02, +max health 20, item `champion_belt` |
| **Items** | `wraps` (hand_r, +blood_money yield), `mouthguard` (head, +health max), `champion_belt` (body, +reputation passive, +health max) |
| **Converter** | `fight_betting_pool`: cost blood_money 50, reputation 10 → cost/sec: blood_money 0.2 → effects/sec: money 0.15, reputation 0.01 |

---

## 4. Loot System (TaskDrop)

### 4.1 Retrofitted Existing Tasks
| Task | Drop Item | Chance/sec | Item Effect |
|------|-----------|------------|-------------|
| `trash_search` | `lucky_coin` | 0.002 | (existing) |
| `subways_job` | `crumpled_receipt` | 0.005 | New item: accessory, +money yield 5% |
| `subways_job_2` | `manager_memo` | 0.003 | New item: accessory, +lore yield 3% |
| `rest_bench` | `park_feather` | 0.001 | New item: accessory, +mana passive 0.01 |
| `wall_destroy` | `wall_dust` | 0.004 | New item: accessory, +insanity yield 2% |
| `explore_neighborhood` | `neighborhood_map` | 0.002 | New item: accessory_2, +lore passive 0.02 |

### 4.2 New Scavenging Tasks (Category: `scavenging`)
| Task | Cost | Drops (chance/sec) |
|------|------|-------------------|
| `scav_dumpster` | time 0.4, health 0.05 | `scrap_metal` (0.008), `discarded_book` (0.003), `moldy_sandwich` (0.01) |
| `scav_alleys` | time 0.3, mana 0.1 | `lost_token` (0.006), `strange_charm` (0.002), `whisper_paper` (0.004) |
| `scav_lost_found` | time 0.2, favor 1 | `misplaced_ring` (0.005), `old_photo` (0.003), `library_card_duplicate` (0.001) |

### 4.3 New Loot Items (10 trinkets + 4 curios)
**Trinkets (accessory, minor effects):**
- `crumpled_receipt` — +money yield 5%
- `manager_memo` — +lore yield 3%
- `park_feather` — +mana passive 0.01
- `wall_dust` — +insanity yield 2%
- `neighborhood_map` — +lore passive 0.02
- `scrap_metal` — +scrap yield 8%
- `discarded_book` — +lore yield 5%
- `lost_token` — +favor passive 0.01
- `strange_charm` — +insight passive 0.005
- `whisper_paper` — +mana yield 4%
- `misplaced_ring` — +health max 2
- `old_photo` — +lore max 3
- `library_card_duplicate` — +quiet max 2

**Curios (body/head, unique effects):**
- `vintage_pocket_watch` (accessory_2) — +time max 3, +time passive 0.02
- `brass_compass` (accessory) — +yield 10% on `explore_neighborhood` and `tunnel_explore`
- `dried_flower_crown` (head) — +mana max 5, +health passive 0.02
- `iron_key_on_chain` (accessory) — unlocks `secret_room` action (future content hook)

---

## 5. New Resources Summary

| Resource | Type | Category | BaseMax | Notes |
|----------|------|----------|---------|-------|
| `produce` | basic | garden | 0 | Harvested from garden tasks |
| `seeds` | basic | garden | 0 | Consumed to plant, found/bought |
| `scrap` | basic | tunnels | 0 | Salvage, converter fuel |
| `echoes` | basic | tunnels | 0 | Lore/insight source |
| `sunlight` | basic | rooftop | 0 | Time-gated, passiveGen: time 0.01 |
| `herbs` | basic | rooftop | 0 | Mana/insight conversion |
| `blood_money` | basic | fighting | 0 | High-value currency |
| `reputation` | stat | fighting | 0 | Unlocks better fights |
| `dried_herbs` | basic | rooftop | 0 | Intermediate for tea |
| `strange_artifact` | basic | tunnels | 0 | Deep delve reward, insight source |
| `champion_token` | basic | fighting | 0 | Main event reward, progression token |
| `calm` | stat | rooftop | 0 | Tea ceremony resource |

---

## 6. New Categories (Add to `categories.ts`)

```typescript
{ id: "library_job", name: "Library Assistant" },
{ id: "cafe", name: "Cafe Work" },
{ id: "garden", name: "Community Garden" },
{ id: "tunnels", name: "Abandoned Tunnels" },
{ id: "rooftop", name: "Rooftop Garden" },
{ id: "fighting", name: "Fighting Ring" },
{ id: "scavenging", name: "Scavenging" },
```

---

## 7. File Structure

```
gameData/
  jobs/
    libraryAssistant.ts
    barista.ts
    communityGarden.ts
  sideBranches/
    subwayTunnels.ts
    rooftopGarden.ts
    fightingRing.ts
  scavenging.ts
```

Register all modules in `gameData/index.ts:19-32` (modules array).

---

## 8. Implementation Constraints

- **No `types.ts` changes** — all mechanics exist (TaskDrop, exclusiveWith, converters, prerequisitesAny, passiveGen)
- **Additive only** — no modifications to existing gameData modules (except adding TaskDrop to existing tasks in `tasks.ts`)
- **Balance conservatively** — start with lower numbers, tune via `npm run build` + manual QA
- **Save compatibility** — new IDs only, no schema changes. Existing saves load without migration.

---

## 9. Verification Checklist

- [ ] All new IDs unique across `gameData/` (grep check)
- [ ] Every referenced `resourceId`/`category`/`taskId`/`actionId`/`itemId`/`slotId` defined
- [ ] `baseMax:0` resources have unlock path via `modify_max_resource_flat/pct/set`
- [ ] `prerequisites`/`locks`/`exclusiveWith`/`hideWhenComplete` behave as intended
- [ ] `npm run build` passes (type-check)
- [ ] Game loads in dev, save/export/import/reset work
- [ ] New content visible at correct progression points
- [ ] TaskDrop items appear and equip correctly
- [ ] Converters display correct rates in breakdown