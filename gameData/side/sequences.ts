import { ActionConfig } from "../../types";

export const ACTIONS: ActionConfig[] = [
  {
    id: "seq_fourfold_rite",
    name: "Secret: Fourfold Rite",
    description: "10 clean castings of each Aspect in fixed order (Ash→Root→Hush→Iron). +15 Focus, +20 Mana, Warden progress.",
    category: "notebook",
    costs: [
      { resourceId: "motes", amount: 60 },
      { resourceId: "skyglass", amount: 8 },
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 20 },
      { type: "set_flag", flagId: "fourfold_rite_complete", amount: 1 },
      { type: "set_flag", flagId: "warden_progress_fourfold", amount: 1 },
    ],
    firstCompletionEffects: [{ type: "add_resource", resourceId: "focus", amount: 15 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_ash", minExecutions: 10 },
      { actionId: "cast_root", minExecutions: 10 },
      { actionId: "cast_hush", minExecutions: 10 },
      { actionId: "cast_iron", minExecutions: 10 },
    ],
    logMessage: "Fourfold Rite complete - Ash, Root, Hush, Iron answer in order. Warden's first threshold holds.",
  },
  {
    id: "seq_menders_working",
    name: "Secret: Mender's Working",
    description: "10 braids across 3+ types + stabilize a fracture Delayed. +10 Focus, Long Sight insight, Mender progress.",
    category: "notebook",
    costs: [
      { resourceId: "motes", amount: 55 },
      { resourceId: "skyglass", amount: 6 },
      { resourceId: "deep_current", amount: 3 },
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 10 },
      { type: "set_flag", flagId: "menders_working_complete", amount: 1 },
      { type: "set_flag", flagId: "mender_progress_working", amount: 1 },
    ],
    firstCompletionEffects: [{ type: "add_resource", resourceId: "focus", amount: 10 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_smolder", minExecutions: 3 },
      { actionId: "cast_dormancy", minExecutions: 3 },
      { actionId: "cast_heartwood", minExecutions: 3 },
      { actionId: "cast_temper", minExecutions: 1 },
      { actionId: "reconcile_journals", minExecutions: 1 },
      { actionId: "mender_stabilize_fracture", minExecutions: 1 },
    ],
    logMessage: "Mender's Working holds - ten braids, three kinds, one fracture steadied. The wound is tended.",
  },
  {
    id: "seq_wellspring_test",
    name: "Secret: Wellspring Test",
    description: "Hold 5 simultaneous workings across 4 Aspects - the Wellspring threshold. +20 Focus, +30 Mana, Wellspring progress.",
    category: "notebook",
    costs: [
      { resourceId: "motes", amount: 75 },
      { resourceId: "skyglass", amount: 8 },
      { resourceId: "deep_current", amount: 6 },
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 20 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 30 },
      { type: "set_flag", flagId: "wellspring_test_complete", amount: 1 },
      { type: "set_flag", flagId: "wellspring_progress_test", amount: 1 },
    ],
    firstCompletionEffects: [{ type: "add_resource", resourceId: "deep_current", amount: 5 }],
    maxExecutions: 1,
    prerequisites: [
      { taskId: "sustain_training", minExecutions: 5 },
      { actionId: "cast_ash_mastery", minExecutions: 1 },
      { actionId: "cast_root_mastery", minExecutions: 1 },
      { actionId: "cast_hush_mastery", minExecutions: 1 },
      { actionId: "cast_iron_mastery", minExecutions: 1 },
      { actionId: "unlock_deep_current", minExecutions: 1 },
    ],
    logMessage: "Wellspring Test holds - five at once, four Aspects, one source that is none of them.",
  },
];
