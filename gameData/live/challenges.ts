/**
 * Live Content - Challenge Modes
 * Spec §9.4
 *
 * MVP is data-only: CHALLENGE_MODES captures design intent and
 * per-mode rules/modifiers. Challenge starter ACTIONS set flags
 * (challenge_mode + per-mode flag) so progress can be tracked and
 * gated. No reducer reset-preserve (SECOND_KINDLING) integration
 * required for MVP - noted as deferred (see header).
 *
 * Deferred engine work: SECOND_KINDLING reducer case that resets
 * GameState while preserving flags + equipment + Temper workings and
 * seeding higher-start resources. Until then, challenges are flag-gated
 * replay modifiers the player can self-enforce; Second Kindling is
 * the only one with a distinct start action.
 */

import { ActionConfig } from "../../types";

export interface ChallengeMode {
  id: string;
  name: string;
  description: string;
  /** Flag set when challenge is activated */
  flagId: string;
  /** Group flag indicating any challenge is active */
  groupFlagId: string;
  rules: string[];
  /** Suggested runtime effects (informational; not auto-applied) */
  modifiers: string[];
}

export const CHALLENGE_MODES: ChallengeMode[] = [
  {
    id: "second_kindling",
    name: "Second Kindling (NG+)",
    description: "New game plus - equipment and Temper workings intact, higher start, immediate endgame access. The scar remembers you this time.",
    flagId: "challenge_second_kindling",
    groupFlagId: "challenge_mode",
    rules: [
      "Retains: all equipment, all flags (except endgame_path_*), Temper braid workings and unlocks.",
      "Resets: resources to Chapter I start +40 Mana, +10 Focus, +30 Motes, +4 Skyglass; tasks/actions executions cleared except Temper.",
      "Unlocks: Chapter V gates immediately (deep_current already tapped); endgame paths selectable from start.",
    ],
    modifiers: [
      "Start Mana 58, Focus 20 (higher than fresh); Deep Current pre-unlocked at 40.",
      "Temper costs 0.8× for the run; Iron yields 1.2× (the one braid taught openly as a trade).",
    ],
  },
  {
    id: "quiet_run",
    name: "Quiet Run",
    description: "Speed challenge - reach Mender's Path within a fixed window. The Undercroft does not wait.",
    flagId: "challenge_quiet_run",
    groupFlagId: "challenge_mode",
    rules: [
      "Goal: Mender's Path (reconcile_journals + acquire_long_sight) within a fixed window after challenge start (MVP: self-timed; engine timer deferred).",
      "Failing the window does not block completion - flag remains for record.",
    ],
    modifiers: ["Nominal: Focus regen +0.05/s during window (deferred); Hush yields 1.15×."],
  },
  {
    id: "bare_handed",
    name: "Bare-Handed",
    description: "Chapter I equipment only - no Temper. Iron answers; nothing else tempers it.",
    flagId: "challenge_bare_handed",
    groupFlagId: "challenge_mode",
    rules: [
      "Only Miller's Charm and Chapter I slot items may be equipped (self-enforced; engine restriction deferred).",
      "Braidstone Ring, lenses, current tuners and Temper items provide no bonus while flagged.",
    ],
    modifiers: ["Iron baseMotesYield +2 while flagged (compensation; deferred engine)."],
  },
  {
    id: "single_thread",
    name: "Single Thread",
    description: "One Aspect only - six tiers are a full build. The other three are left deliberately unkissed.",
    flagId: "challenge_single_thread",
    groupFlagId: "challenge_mode",
    rules: [
      "Choose one Aspect at challenge start (flag single_thread_aspect); other Aspect cast actions are to be avoided (self-enforced).",
      "Six tiers of the chosen Aspect constitute a complete run; braids requiring other Aspects cannot be woven.",
    ],
    modifiers: ["Chosen Aspect yields 1.35×; cross-Aspect synergy disabled."],
  },
  {
    id: "unwitnessed",
    name: "Unwitnessed",
    description: "Hush challenge - minimize footprint. The world should not remember you were there.",
    flagId: "challenge_unwitnessed",
    groupFlagId: "challenge_mode",
    rules: [
      "Tracked via footprintCounter (every cast increments). Lower is better; best scores minimize casts between gates.",
      "Hush casts increment footprint at 0.5× (the silence remembers less). Deferred: engine counts Hush specially.",
    ],
    modifiers: ["Hush failure chance -3pp; footprint display in log header (deferred UI)."],
  },
];

/**
 * Challenge starter actions - all share category "endgame" (existing,
 * so validate passes without new categories). Each sets its challenge
 * flag plus the group flag. Prerequisites proxy Chapter V entry
 * (unlock_deep_current) to keep challenges late-game without needing OR
 * prerequisites (union deferred).
 */
export const ACTIONS: ActionConfig[] = [
  {
    id: "challenge_second_kindling",
    name: "Challenge: Second Kindling",
    description: "Begin NG+ - retain equipment and Temper workings, higher start, immediate endgame. Resets progress (engine reset-preserve deferred; presently flag-only).",
    category: "endgame",
    costs: [{ resourceId: "motes", amount: 0 }],
    effects: [
      { type: "set_flag", flagId: "challenge_mode", amount: 1 },
      { type: "set_flag", flagId: "challenge_second_kindling", amount: 1 },
    ],
    firstCompletionEffects: [{ type: "set_flag", flagId: "second_kindling_started", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "Second Kindling - the scar remembers your hands. Equipment and Temper hold.",
  },
  {
    id: "challenge_quiet_run",
    name: "Challenge: Quiet Run",
    description: "Speed challenge - reach Mender's Path quickly. Flag-only start; timer deferred.",
    category: "endgame",
    costs: [{ resourceId: "motes", amount: 0 }],
    effects: [
      { type: "set_flag", flagId: "challenge_mode", amount: 1 },
      { type: "set_flag", flagId: "challenge_quiet_run", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "Quiet Run - the Undercroft clock starts (flagged).",
  },
  {
    id: "challenge_bare_handed",
    name: "Challenge: Bare-Handed",
    description: "Chapter I gear only - eschew Temper and fine tools. Self-enforced until engine restriction lands.",
    category: "endgame",
    costs: [{ resourceId: "motes", amount: 0 }],
    effects: [
      { type: "set_flag", flagId: "challenge_mode", amount: 1 },
      { type: "set_flag", flagId: "challenge_bare_handed", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "Bare-Handed - only the first charm remains true.",
  },
  {
    id: "challenge_single_thread",
    name: "Challenge: Single Thread",
    description: "One Aspect for six tiers. Choose by casting only that Aspect thereafter (aspect choice deferred).",
    category: "endgame",
    costs: [{ resourceId: "motes", amount: 0 }],
    effects: [
      { type: "set_flag", flagId: "challenge_mode", amount: 1 },
      { type: "set_flag", flagId: "challenge_single_thread", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "Single Thread - one Aspect, six tiers. The others wait outside.",
  },
  {
    id: "challenge_unwitnessed",
    name: "Challenge: Unwitnessed",
    description: "Minimize footprint - every cast counts. Hush remembers less (0.5×). Track via footprintCounter.",
    category: "endgame",
    costs: [{ resourceId: "motes", amount: 0 }],
    effects: [
      { type: "set_flag", flagId: "challenge_mode", amount: 1 },
      { type: "set_flag", flagId: "challenge_unwitnessed", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "Unwitnessed - move as Hush does. The footprint begins.",
  },
];
