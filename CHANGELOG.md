# CHANGELOG

## v0.0.0 — Initial Release

- Engine core: React 19 + TypeScript + Vite + Tailwind CSS 4
- GameState with versioned persistence (version 6)
- Load/Game migrations for schema forward-compatibility
- `scripts/validateGameData.ts` linter for duplicate IDs & dangling references
- Auto-save every 30s; export/import as Base64 (Unicode-safe, emoji)

## Known Fixes (pre-release documentation)

| Issue | Status | File |
|-------|--------|------|
| `cat/catpaths.ts` dangling refs to `insight`/`strange` | ✅ FIXED | Added definitions in `gameData/resources.ts:74`, `gameData/categories.ts:8` |
| Dead `fester` branch & duplicated `applyEffect` | ✅ REMOVED | Replaced with `applyEffectWithYield` |
| `getResourceBreakdown` scaling for active task drains | ✅ FIXED | Now uses `scaleFactor/scaleType/scalesByCompletion` like TICK |
| `getScaledCost` action branching bug (`trash_search` decay) | ✅ FIXED | Heuristic now uses `level>0` to distinguish tasks vs actions |
| `getActiveModifiers` partial coverage for equipment | ✅ EXPANDED | Now covers `set_max_resource`, `add_passive_gen_per_unit`, generic `modify_yield_*` |
| Duplicate "Rest" names (`rest_bench` vs `rest_bed`) | ✅ FIXED | Renamed for HUD clarity |
| Save versioning + migration harness | ✅ DONE | `GameState.version:6`; `LOAD_GAME` merges over defaults with versioned migrations |

## Next Steps (see ROADMAP.md)

- P0: TaskCard yield display fix, cooldownMs enforcement
- P1: Error boundaries, save versioning
- P2: Offline progress, large-number formatting, converter cost scaling
- P3: Test harness (vitest), linter (eslint/prettier), shared tooltip helpers, App.tsx split
- P4: Notifications/toasts, settings persistence, accessibility, mobile responsive design