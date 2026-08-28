/**
 * Live Content — Seasonal Calendar + Weekly Rotations
 * Spec §9.1-9.3
 *
 * MVP is data-only: exports are consumed by UI / flag system.
 * No reducer integration required (deferred: getActiveModifiers seasonal hook).
 * If engine integration lands, SEASONAL_MODIFIERS can be consumed in
 * context/GameContext.tsx getActiveModifiers() keyed by current month.
 */

import type { Effect } from "../../types";

// ── Monthly Events (§9.1) ──────────────────────────────────────────────

export interface MonthlyEvent {
  id: string;
  name: string;
  /** 0 = January .. 11 = December */
  month: number;
  theme: string;
  bonus: string;
  carryOver: string;
  description: string;
  /** Suggested runtime effects (not yet applied engine-side) */
  effects: Effect[];
}

/**
 * Four themed monthly events on a quarterly cadence; intervening months
 * are quiet (no global bonus) to keep the calendar readable in MVP.
 */
export const MONTHLY_EVENTS: MonthlyEvent[] = [
  {
    id: "season_cinderfall",
    name: "Cinderfall",
    month: 0,
    theme: "Ash",
    bonus: "Ash yields ×2",
    carryOver: "+10% Mana regen (lingering after Cinderfall)",
    description: "The scar's heat spikes — Ash castings yield twice their Motes. After the month ends, a faint warmth lingers.",
    effects: [
      { type: "modify_yield_pct", actionId: "cast_ash", amount: 1.0 },
      { type: "modify_yield_pct", actionId: "cast_ash_mastery", amount: 1.0 },
    ],
  },
  {
    id: "season_long_bloom",
    name: "Long Bloom",
    month: 3,
    theme: "Root",
    bonus: "Root braid cost -1 Mote per cast",
    carryOver: "Lasting braid discount (1.1× Root yield thereafter)",
    description: "Growth overruns its season — Root workings and Heartwood braids cost less, and Root remembers the ease.",
    effects: [
      { type: "modify_yield_pct", actionId: "cast_root", amount: 0.1 },
      { type: "modify_yield_pct", actionId: "cast_heartwood", amount: 0.1 },
    ],
  },
  {
    id: "season_quiet_week",
    name: "Quiet Week",
    month: 6,
    theme: "Hush",
    bonus: "Hush timing gear available +5 Focus",
    carryOver: "+5 Focus (permanent if purchased during Quiet Week)",
    description: "The world holds its breath — a week's market holds Hush timing gear not otherwise offered.",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 5 },
      { type: "modify_yield_pct", actionId: "cast_hush", amount: 0.15 },
    ],
  },
  {
    id: "season_deep_rest",
    name: "Deep Rest",
    month: 9,
    theme: "Iron",
    bonus: "Iron lowest yield gives largest gain",
    carryOver: "1.5× Iron yield (permanent)",
    description: "Weight settles deepest when the yield is thinnest — the smallest Iron gain this month is the one that teaches most.",
    effects: [
      { type: "modify_yield_pct", actionId: "cast_iron", amount: 0.5 },
      { type: "modify_yield_pct", actionId: "cast_iron_mastery", amount: 0.5 },
    ],
  },
];

/** Alias required by plan: month-indexed table under SEASONS name. */
export const SEASONS = MONTHLY_EVENTS;

/**
 * Runtime modifier view keyed by month (for future engine hook).
 * MVP is descriptive; engine would apply on getActiveModifiers.
 */
export interface SeasonalModifier {
  month: number;
  eventId: string;
  eventName: string;
  effects: Effect[];
}

export const SEASONAL_MODIFIERS: SeasonalModifier[] = MONTHLY_EVENTS.map((e) => ({
  month: e.month,
  eventId: e.id,
  eventName: e.name,
  effects: e.effects,
}));

export function getSeasonForMonth(month: number): MonthlyEvent | undefined {
  return MONTHLY_EVENTS.find((e) => e.month === month);
}

export function getSeasonForDate(date: Date): MonthlyEvent | undefined {
  return getSeasonForMonth(date.getMonth());
}

// ── Quarterly Events (§9.2) ────────────────────────────────────────────

export interface QuarterlyEvent {
  id: string;
  name: string;
  quarter: number; // 0..3
  description: string;
  mechanic: string;
  effects: Effect[];
}

export const QUARTERLY_EVENTS: QuarterlyEvent[] = [
  {
    id: "quarterly_steady_season",
    name: "The Steady Season",
    quarter: 0,
    description: "Balance meter quarter — casting evenly across Aspects is rewarded. Perfect balance grants a bonus.",
    mechanic: "Track clean castings per Aspect in quarter; variance < 15% → bonus +10% global yield, flawless balance → +15 Focus flat (one-time).",
    effects: [{ type: "modify_yield_pct", amount: 0.1 }],
  },
  {
    id: "quarterly_widening",
    name: "The Widening",
    quarter: 2,
    description: "The Sundering flares — failure rates rise, and rewards rise with them.",
    mechanic: "Global failure chance +5pp, but success yields 1.4× and failure residue 2×. Widening weeks are learning weeks.",
    effects: [
      { type: "modify_failure_chance", amount: 0.05 },
      { type: "modify_yield_pct", amount: 0.4 },
    ],
  },
];

export function getQuarterForDate(date: Date): QuarterlyEvent | undefined {
  const q = Math.floor(date.getMonth() / 3);
  return QUARTERLY_EVENTS.find((e) => e.quarter === q);
}

// ── Weekly Rotations (§9.3) ───────────────────────────────────────────

export type WeeklyGoalType = "cast_aspect" | "sustain" | "collect_motes";

export interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  type: WeeklyGoalType;
  aspectId?: "ash" | "root" | "hush" | "iron";
  target: number;
  reward: Effect[];
  weekNumber: number;
  weekStartISO: string;
}

const WEEKLY_TEMPLATES: Omit<WeeklyGoal, "weekNumber" | "weekStartISO" | "id">[] = [
  {
    title: "Ember Week",
    description: "Cast Ash — feed the scar's first Aspect.",
    type: "cast_aspect",
    aspectId: "ash",
    target: 25,
    reward: [{ type: "add_resource", resourceId: "motes", amount: 12 }],
  },
  {
    title: "Root Week",
    description: "Cast Root — let something grow and hold it.",
    type: "cast_aspect",
    aspectId: "root",
    target: 25,
    reward: [{ type: "add_resource", resourceId: "motes", amount: 12 }],
  },
  {
    title: "Hush Week",
    description: "Cast Hush — practice the absence that remembers.",
    type: "cast_aspect",
    aspectId: "hush",
    target: 25,
    reward: [{ type: "add_resource", resourceId: "motes", amount: 12 }],
  },
  {
    title: "Iron Week",
    description: "Cast Iron — set something and mean it.",
    type: "cast_aspect",
    aspectId: "iron",
    target: 25,
    reward: [{ type: "add_resource", resourceId: "motes", amount: 12 }],
  },
  {
    title: "Sustained Week",
    description: "Sustain workings — keep the current through duration.",
    type: "sustain",
    target: 6,
    reward: [{ type: "modify_max_resource_flat", resourceId: "focus", amount: 2 }],
  },
  {
    title: "Mote Harvest",
    description: "Collect Motes — anything shaken loose counts.",
    type: "collect_motes",
    target: 120,
    reward: [{ type: "add_resource", resourceId: "skyglass", amount: 2 }],
  },
];

/** Deterministic week number since Unix epoch (UTC), 7-day cycles. */
export function getWeekNumber(date: Date): number {
  const ms = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayMs = 24 * 3600 * 1000;
  const weekMs = 7 * dayMs;
  return Math.floor(ms / weekMs);
}

function weekStartISOForWeekNumber(weekNumber: number): string {
  const dayMs = 24 * 3600 * 1000;
  const weekMs = 7 * dayMs;
  const ms = weekNumber * weekMs;
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

/** Mulberry32 — tiny seeded RNG for deterministic target variance. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pure, deterministic week-seeded goal generator.
 * Same date → same goal; no I/O, no randomness outside seed.
 */
export function getWeeklyGoal(date: Date): WeeklyGoal {
  const wn = getWeekNumber(date);
  const rng = mulberry32(wn + 0x9e3779b9);
  const idx = wn % WEEKLY_TEMPLATES.length;
  const base = WEEKLY_TEMPLATES[idx];
  // Small deterministic target variance (±20%) to keep rotation fresh without breaking balance
  const variance = 0.2;
  const roll = rng();
  const target = Math.max(1, Math.round(base.target * (1 + (roll - 0.5) * 2 * variance)));
  const id = `weekly_${wn}_${base.type}${base.aspectId ? "_" + base.aspectId : ""}`;
  return {
    id,
    title: base.title,
    description: base.description,
    type: base.type,
    aspectId: base.aspectId,
    target,
    reward: base.reward,
    weekNumber: wn,
    weekStartISO: weekStartISOForWeekNumber(wn),
  };
}

/** Convenience: week's templates for display/debug */
export const WEEKLY_GOAL_TEMPLATES = WEEKLY_TEMPLATES;
