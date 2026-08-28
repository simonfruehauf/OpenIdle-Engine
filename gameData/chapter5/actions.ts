import { ActionConfig } from "../../types";

export const ACTIONS: ActionConfig[] = [
  // --- Deep Current unlock ---
  {
    id: "unlock_deep_current",
    name: "Tap the Deep Current",
    description: "The listening and sustain training align — the undertow answers. Opens Deep Current (base 100) and grants an initial 20 to work with.",
    category: "chapter5",
    costs: [
      { resourceId: "motes", amount: 60 },
      { resourceId: "skyglass", amount: 8 },
    ],
    effects: [],
    firstCompletionEffects: [
      { type: "set_max_resource", resourceId: "deep_current", amount: 100 },
      { type: "add_resource", resourceId: "deep_current", amount: 20 },
      { type: "set_flag", flagId: "deep_current_unlocked", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [
      { taskId: "sustain_training", minExecutions: 3 },
      { taskId: "deep_listening", minExecutions: 3 },
    ],
    logMessage: "The undertow steadies under your attention — Deep Current answers, slow and inexorable.",
  },

  // --- Path gates (one-time) ---
  {
    id: "warden_path",
    name: "Take the Warden's Oath",
    description: "100 clean castings in each Aspect — the Warden's threshold. Mastery without a single tremor. Flags endgame_path_warden.",
    category: "endgame",
    costs: [
      { resourceId: "motes", amount: 100 },
      { resourceId: "skyglass", amount: 10 },
    ],
    effects: [],
    firstCompletionEffects: [
      { type: "set_flag", flagId: "endgame_path_warden", amount: 1 },
      { type: "set_flag", flagId: "chapter5_complete", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_ash", minExecutions: 100 },
      { actionId: "cast_root", minExecutions: 100 },
      { actionId: "cast_hush", minExecutions: 100 },
      { actionId: "cast_iron", minExecutions: 100 },
    ],
    logMessage: "You take the Warden's Oath — stewardship, not dominion. The Aspects steady as one.",
  },
  {
    id: "mender_path",
    name: "Walk the Mender's Path",
    description: "Requires the Long Sight and reconciliation of the Year 74 journals. Stabilize, do not dominate — flags endgame_path_mender.",
    category: "endgame",
    costs: [
      { resourceId: "motes", amount: 80 },
      { resourceId: "skyglass", amount: 8 },
    ],
    effects: [],
    firstCompletionEffects: [
      { type: "set_flag", flagId: "endgame_path_mender", amount: 1 },
      { type: "set_flag", flagId: "chapter5_complete", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "acquire_long_sight", minExecutions: 1 },
      { actionId: "reconcile_journals", minExecutions: 1 },
    ],
    logMessage: "You walk the Mender's Path — the wound may be tended, if never made whole.",
  },
  {
    id: "wellspring_path",
    name: "Claim the Wellspring",
    description: "Hold the current across all four Aspects — 5 sustained trainings and one mastery casting of each Aspect. Flags endgame_path_wellspring.",
    category: "endgame",
    costs: [
      { resourceId: "deep_current", amount: 10 },
      { resourceId: "motes", amount: 90 },
    ],
    effects: [],
    firstCompletionEffects: [
      { type: "set_flag", flagId: "endgame_path_wellspring", amount: 1 },
      { type: "set_flag", flagId: "chapter5_complete", amount: 1 },
    ],
    maxExecutions: 1,
    prerequisites: [
      { taskId: "sustain_training", minExecutions: 5 },
      { actionId: "cast_ash_mastery", minExecutions: 1 },
      { actionId: "cast_root_mastery", minExecutions: 1 },
      { actionId: "cast_hush_mastery", minExecutions: 1 },
      { actionId: "cast_iron_mastery", minExecutions: 1 },
    ],
    logMessage: "The Wellspring answers — you cast from no known Aspect, and the world answers back.",
  },

  // --- Path-exclusive post-content (repeatable high-yield) ---
  {
    id: "warden_flawless_working",
    name: "Warden: Flawless Working",
    description: "Warden challenge — a near-zero-failure working. High Motes yield, reliability rewarded. Requires Warden's Oath.",
    category: "endgame",
    costs: [
      { resourceId: "mana", amount: 35 },
      { resourceId: "focus", amount: 6 },
    ],
    effects: [{ type: "add_resource", resourceId: "motes", amount: 28 }],
    maxExecutions: 999999,
    cooldownMs: 12000,
    prerequisites: [{ actionId: "warden_path", minExecutions: 1 }],
    logMessage: "Flawless — the Aspects answer without a tremor.",
  },
  {
    id: "mender_stabilize_fracture",
    name: "Mender: Stabilize Fracture",
    description: "Delayed-form fracture stabilization — set now, triggers later on the wound's rhythm. Grants a Mender world-flag. Requires Mender's Path.",
    category: "endgame",
    costs: [
      { resourceId: "mana", amount: 30 },
      { resourceId: "deep_current", amount: 3 },
    ],
    effects: [
      { type: "add_resource", resourceId: "motes", amount: 22 },
      { type: "set_flag", flagId: "fracture_stabilized", amount: 1 },
    ],
    maxExecutions: 999999,
    cooldownMs: 30000,
    prerequisites: [{ actionId: "mender_path", minExecutions: 1 }],
    logMessage: "The fracture steadies — not healed, but it holds.",
  },
  {
    id: "wellspring_generative_weave",
    name: "Wellspring: Generative Weave",
    description: "Wild + Inward combinatorial weave — generative casting scaling off Deep Current. Requires Wellspring claim.",
    category: "endgame",
    costs: [
      { resourceId: "deep_current", amount: 4 },
      { resourceId: "mana", amount: 22 },
    ],
    effects: [{ type: "add_resource", resourceId: "motes", amount: 30 }],
    maxExecutions: 999999,
    cooldownMs: 8000,
    prerequisites: [{ actionId: "wellspring_path", minExecutions: 1 }],
    logMessage: "The generative weave catches — something new shakes loose and resolves as Motes.",
  },

  // --- Endgame equipment acquisition helpers ---
  {
    id: "acquire_long_sight",
    name: "Cut the Long Sight",
    description: "Grind skyglass for fracture-work. Reveals fracture locations (Mender prerequisite). Grants farseer_lens: The Long Sight.",
    category: "chapter5",
    costs: [
      { resourceId: "skyglass", amount: 6 },
      { resourceId: "motes", amount: 40 },
    ],
    effects: [],
    firstCompletionEffects: [{ type: "add_item", itemId: "long_sight", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [
      { taskId: "deep_listening", minExecutions: 2 },
      { actionId: "unlock_deep_current", minExecutions: 1 },
    ],
    logMessage: "The Long Sight clears — fractures resolve at the edge of sight.",
  },
  {
    id: "acquire_undertow_fork",
    name: "Tune the Undertow Fork",
    description: "Tap Deep Current directly. Grants current_tuner: The Undertow Fork (Deep Current → Mana).",
    category: "chapter5",
    costs: [
      { resourceId: "deep_current", amount: 8 },
      { resourceId: "skyglass", amount: 4 },
      { resourceId: "motes", amount: 30 },
    ],
    effects: [],
    firstCompletionEffects: [{ type: "add_item", itemId: "undertow_fork", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "The fork hums against the undertow — Deep Current begins to seep into reserve.",
  },
  {
    id: "acquire_archivists_charm",
    name: "Recover the Archivist's Charm",
    description: "Fourfold Rite completion — +10 Focus, -500ms all cooldowns. Grants focus_gear: The Archivist's Charm.",
    category: "chapter5",
    costs: [
      { resourceId: "motes", amount: 90 },
      { resourceId: "skyglass", amount: 8 },
    ],
    effects: [],
    firstCompletionEffects: [{ type: "add_item", itemId: "archivists_charm", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
    logMessage: "The Archivist's Charm settles — time shortens around your workings.",
  },
  {
    id: "acquire_secret_braidstone",
    name: "Claim the Secret Braidstone",
    description: "Mender's Working recognition — combine any two Aspects for bonus yield. Grants focus_gear: The Secret Braidstone.",
    category: "chapter5",
    costs: [
      { resourceId: "skyglass", amount: 7 },
      { resourceId: "motes", amount: 70 },
    ],
    effects: [],
    firstCompletionEffects: [{ type: "add_item", itemId: "secret_braidstone", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [{ actionId: "mender_path", minExecutions: 1 }],
    logMessage: "The Secret Braidstone is warm in your palm — two colors at once, and a third you didn't ask for.",
  },
  {
    id: "acquire_cathals_ashwork",
    name: "Inherit Cathal's Ashwork",
    description: "Widow Cathal's final ashwork — unique. Ash answers faster and with less failure. Grants focus_gear: Cathal's Ashwork.",
    category: "chapter5",
    costs: [
      { resourceId: "deep_current", amount: 12 },
      { resourceId: "motes", amount: 85 },
    ],
    effects: [],
    firstCompletionEffects: [{ type: "add_item", itemId: "cathals_ashwork", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "warden_path", minExecutions: 1 },
      { actionId: "unlock_deep_current", minExecutions: 1 },
    ],
    logMessage: "Cathal's ashwork fits as if made for you. Ash steadies and shortens in your hands.",
  },
];
