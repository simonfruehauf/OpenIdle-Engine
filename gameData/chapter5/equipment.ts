import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "undertow_fork",
    name: "The Undertow Fork",
    description: "A tuned fork that answers only to the deep current. While equipped, Deep Current itself seeps into Mana.",
    slot: "current_tuner",
    effects: [
      { type: "add_passive_gen_per_unit", sourceResourceId: "deep_current", targetResourceId: "mana", amount: 0.04 },
    ],
  },
  {
    id: "long_sight",
    name: "The Long Sight",
    description: "Ground for fracture-work: reveals fracture locations for Mender stabilization. +5 Focus, steadier sight for braided repair.",
    slot: "farseer_lens",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 5 },
      { type: "modify_failure_chance", amount: -0.02 },
    ],
  },
  {
    id: "archivists_charm",
    name: "The Archivist's Charm",
    description: "Warded charm from the Fourfold Rite. +10 Focus and shortens every cooldown by half a second — ritual steadiness made tangible.",
    slot: "focus_gear",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 10 },
      { type: "modify_cooldown_flat", amount: -500 },
    ],
  },
  {
    id: "secret_braidstone",
    name: "The Secret Braidstone",
    description: "A braidstone that was never meant to be cut. Lets any two Aspects combine for a bonus yield when woven together.",
    slot: "focus_gear",
    effects: [
      { type: "modify_yield_pct", amount: 0.15 },
      { type: "modify_failure_chance", amount: -0.04 },
    ],
  },
  {
    id: "cathals_ashwork",
    name: "Cathal's Ashwork",
    description: "Widow Cathal's final ashwork — unique, warm to the touch. Ash answers faster and with less failure while you wear it.",
    slot: "focus_gear",
    effects: [
      { type: "modify_cooldown_flat", actionId: "cast_ash", amount: -400 },
      { type: "modify_cooldown_flat", actionId: "cast_ash_mastery", amount: -400 },
      { type: "modify_failure_chance", amount: -0.05 },
    ],
  },
];
