import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "millers_charm",
    name: "Miller's Charm",
    description: "A worn brass disc. Focus comes easier with something to hold. The familiar weight steadies your reserve - a faint trickle of Mana returns while you hold it.",
    slot: "focus_gear",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 5 },
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.06 },
    ],
  },
];
