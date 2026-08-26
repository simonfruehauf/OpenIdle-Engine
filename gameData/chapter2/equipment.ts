import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "conclave_signet",
    name: "Conclave Signet",
    description: "Ash answers a half-breath faster.",
    slot: "focus_gear",
    effects: [{ type: "modify_cooldown_flat", actionId: "cast_ash", amount: -1000 }],
  },
  {
    id: "practice_wand",
    name: "Practice Wand",
    description: "Steadies the hand before the word finishes.",
    slot: "wardslot",
    effects: [{ type: "modify_failure_chance", amount: -0.02 }],
  },
  {
    id: "wardstone_amulet",
    name: "Wardstone Amulet",
    description: "Quietly, insistently centering.",
    slot: "wardslot",
    effects: [{ type: "modify_max_resource_flat", resourceId: "focus", amount: 3 }],
  },
];
