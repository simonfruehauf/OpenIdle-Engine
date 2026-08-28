import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "steady_hand",
    name: "The Steady Hand",
    description: "+8 Focus. Reduces Wild variance - steadiness learned from five sessions of Wild Practice.",
    slot: "focus_gear",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 8 },
      { type: "modify_failure_chance", amount: -0.05 },
    ],
  },
  {
    id: "basic_current_tuner",
    name: "Basic Current-Tuner",
    description: "Better Motes→Mana conversion via undertow tap.",
    slot: "current_tuner",
    effects: [
      { type: "add_passive_gen_per_unit", sourceResourceId: "motes", targetResourceId: "mana", amount: 0.008 },
    ],
  },
  {
    id: "fine_current_tuner",
    name: "Fine Current-Tuner",
    description: "+3 Focus and still better conversion than basic.",
    slot: "current_tuner",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 3 },
      { type: "add_passive_gen_per_unit", sourceResourceId: "motes", targetResourceId: "mana", amount: 0.015 },
    ],
  },
];
