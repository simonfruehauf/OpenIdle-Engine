import { ItemConfig } from "../../types";

export const ITEMS: ItemConfig[] = [
  {
    id: "braidstone_ring",
    name: "Braidstone Ring",
    description: "Woven from two Aspects at once. Enables braided casting outside the Undercroft and steadies focus.",
    slot: "focus_gear",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "focus", amount: 5 },
      { type: "modify_failure_chance", amount: -0.03 },
    ],
  },
  {
    id: "basic_lens",
    name: "Basic Farseer's Lens",
    description: "Ground skyglass. Reveals the braid's secondary effect faintly; steadies sight.",
    slot: "farseer_lens",
    effects: [{ type: "modify_max_resource_flat", resourceId: "focus", amount: 2 }],
  },
  {
    id: "fine_lens",
    name: "Fine Farseer's Lens",
    description: "Clear-cut skyglass. Reveals braid secondary effects fully and lends durable focus.",
    slot: "farseer_lens",
    effects: [{ type: "modify_max_resource_flat", resourceId: "focus", amount: 4 }],
  },
];
