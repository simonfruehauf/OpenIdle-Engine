import { ConverterConfig } from "../types";

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "kettle",
    name: "Chipped Kettle",
    description: "You leave it on low. It turns spare time and loose change into warmth and a little mana.",
    cost: [{ resourceId: "money", amount: 45 }],
    canBeToggled: true,
    costPerSecond: [
      { resourceId: "time", amount: 0.08 },
      { resourceId: "money", amount: 0.06 }
    ],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "health", amount: 0.04 },
      { type: "add_resource", resourceId: "mana", amount: 0.025 }
    ],
    prerequisites: [{ actionId: "appartment", minExecutions: 1 }]
  },
 {
    id: "clock",
    name: "Old Clock",
    description: "Tock-tick. You wind it up and it winds down. Time is running out, but you can make a little more of it.",
    cost: [{ resourceId: "money", amount: 100 }],
    canBeToggled: false,
    costPerSecond: [
      { resourceId: "health", amount: 0.01 }
    ],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 0.01 }
    ],
    prerequisites: [{ actionId: "get_job", minExecutions: 1 }]
  },
  {
    id: "dryer",
    name: "Laundromat Dryer",
    description: "A rattling dryer that eats time and spits out warm bills. You are not sure how.",
    cost: [{ resourceId: "money", amount: 70 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "time", amount: 0.18 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "money", amount: 0.12 }],
    prerequisites: [{ actionId: "get_job", minExecutions: 1 }]
  },
  {
    id: "incense_burner",
    name: "Incense Burner",
    description: "You burn the cheap sticks from the bookstore. Lore smolders into insight and a faint mana haze.",
    cost: [
      { resourceId: "lore", amount: 6 },
      { resourceId: "money", amount: 30 }
    ],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "lore", amount: 0.02 }],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "insight", amount: 0.012 },
      { type: "add_resource", resourceId: "mana", amount: 0.018 }
    ],
    prerequisites: [{ actionId: "bookstore", minExecutions: 1 }]
  }
];
