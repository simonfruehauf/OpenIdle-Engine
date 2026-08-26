import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "millers_charm",
    name: "Miller's Charm",
    description: "A worn brass disc. Focus comes easier with something to hold.",
    slot: "focus_gear",
    effects: [{ type: "modify_max_resource_flat", resourceId: "focus", amount: 5 }],
  },
];
