import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  { id: "blood_money", name: "Blood Money", type: "basic", category: "fighting", baseMax: 0, initialAmount: 0, description: "Folded, warm, counted twice." },
  { id: "champion_token", name: "Champion Token", type: "basic", category: "fighting", baseMax: 0, initialAmount: 0, description: "Not money. Proof you stood in the circle and stayed." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "fight_spar",
    name: "Spar",
    description: "You hit and get hit. Both teach.",
    category: "fighting",
    progressRequired: 8,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.3 }, { resourceId: "health", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "blood_money", amount: 3 },
      { type: "add_resource", resourceId: "reputation", amount: 0.2 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "blood_money", amount: 20 },
      { type: "modify_max_resource_flat", resourceId: "reputation", amount: 6 }
    ],
    prerequisites: [{ resourceId: "health", minMax: 20 }],
    xpPerSecond: 8,
  },
  {
    id: "fight_undercard",
    name: "Undercard Fight",
    description: "A circle of people, a bare bulb, a bell that is a cough.",
    category: "fighting",
    progressRequired: 30,
    autoRestart: true,
    startCosts: [{ resourceId: "health", amount: 10 }, { resourceId: "blood_money", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.4 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "reputation", amount: 2 },
      { type: "add_resource", resourceId: "blood_money", amount: 8 },
      { type: "add_resource", resourceId: "insight", amount: 0.3 }
    ],
    prerequisites: [{ taskId: "fight_spar", minLevel: 3 }],
    maxExecutions: 5,
  },
  {
    id: "fight_main_event",
    name: "Main Event",
    description: "They say your name. You don't recognize it until you step in.",
    category: "fighting",
    progressRequired: 60,
    autoRestart: true,
    startCosts: [{ resourceId: "reputation", amount: 15 }, { resourceId: "health", amount: 20 }, { resourceId: "blood_money", amount: 20 }],
    costPerSecond: [{ resourceId: "time", amount: 0.5 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "reputation", amount: 6 },
      { type: "add_resource", resourceId: "blood_money", amount: 30 },
      { type: "add_resource", resourceId: "money", amount: 50 },
      { type: "add_resource", resourceId: "champion_token", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "champion_token", amount: 4 }],
    prerequisites: [{ actionId: "fight_corner_man", minExecutions: 1 }],
    maxExecutions: 2,
  },
  {
    id: "fight_recover",
    name: "Recover",
    description: "Ice, quiet, and the way a bruise tells time.",
    category: "fighting",
    type: "rest",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "health", amount: 0.6 },
      { type: "add_resource", resourceId: "mana", amount: 0.1 },
      { type: "add_resource", resourceId: "time", amount: 0.3 }
    ],
    prerequisites: [{ taskId: "fight_spar", minLevel: 2 }],
    xpPerSecond: 2,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "fight_better_gear",
    name: "Get Better Gear",
    description: "Wraps, a better mouthguard, shoes that don't slip.",
    category: "fighting",
    costs: [{ resourceId: "blood_money", amount: 30 }, { resourceId: "reputation", amount: 5 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 10 },
      { type: "modify_max_resource_flat", resourceId: "blood_money", amount: 25 },
      { type: "add_item", itemId: "wraps", amount: 1 }
    ],
    prerequisites: [{ taskId: "fight_spar", minLevel: 3 }],
    maxExecutions: 1,
  },
  {
    id: "fight_corner_man",
    name: "Find a Corner Man",
    description: "He doesn't say much. He knows when to put the stool down.",
    category: "fighting",
    costs: [{ resourceId: "reputation", amount: 10 }, { resourceId: "insight", amount: 5 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "blood_money", amount: 0.05 },
      { type: "add_item", itemId: "mouthguard", amount: 1 }
    ],
    prerequisites: [{ taskId: "fight_undercard", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "fight_champion_belt",
    name: "Claim Champion Belt",
    description: "It fits, though it shouldn't. It was measured for someone else.",
    category: "fighting",
    costs: [{ resourceId: "reputation", amount: 30 }, { resourceId: "blood_money", amount: 100 }, { resourceId: "insight", amount: 15 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "reputation", amount: 0.02 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 20 },
      { type: "add_item", itemId: "champion_belt", amount: 1 }
    ],
    prerequisites: [{ taskId: "fight_main_event", minLevel: 1 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "wraps", name: "Hand Wraps", description: "You wind them the same way every time. A ritual, not a habit.", slot: "hand_r", effects: [{ type: "modify_yield_pct", taskId: "fight_spar", amount: 0.15 }] },
  { id: "mouthguard", name: "Mouthguard", description: "You bite down and it fits the shape of you.", slot: "head", effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 6 }] },
  { id: "champion_belt", name: "Champion Belt", description: "Leather, brass, and the idea that you were here.", slot: "body", effects: [{ type: "modify_passive_gen", resourceId: "reputation", amount: 0.02 }, { type: "modify_max_resource_flat", resourceId: "health", amount: 8 }] },
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "fight_betting_pool",
    name: "Betting Pool",
    description: "You run a small book. It pays in two currencies: money and being known.",
    cost: [{ resourceId: "blood_money", amount: 50 }, { resourceId: "reputation", amount: 10 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "blood_money", amount: 0.2 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "money", amount: 0.15 }],
    prerequisites: [{ actionId: "fight_corner_man", minExecutions: 1 }]
  },
];
