import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "@types";

export const RESOURCES: ResourceConfig[] = [
  { id: "sunlight", name: "Sunlight", type: "basic", category: "rooftop", baseMax: 0, initialAmount: 0, description: "You collect it without touching it. It collects you anyway." },
  { id: "herbs", name: "Herbs", type: "basic", category: "rooftop", baseMax: 0, initialAmount: 0, description: "Scent first, then shape, then use." },
  { id: "dried_herbs", name: "Dried Herbs", type: "basic", category: "rooftop", baseMax: 0, initialAmount: 0, description: "Lighter, stronger, quieter." },
  { id: "calm", name: "Calm", type: "stat", category: "rooftop", baseMax: 0, initialAmount: 0, description: "Not the absence of noise. The presence of not needing it." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "rooftop_bask",
    name: "Bask on the Roof",
    description: "You sit with sun on your face. Time feels less scarce up here.",
    category: "rooftop",
    type: "rest",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 0.4 },
      { type: "add_resource", resourceId: "health", amount: 0.15 },
      { type: "add_resource", resourceId: "mana", amount: 0.12 },
      { type: "add_resource", resourceId: "sunlight", amount: 0.12 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "sunlight", amount: 12 },
      { type: "modify_max_resource_flat", resourceId: "herbs", amount: 10 }
    ],
    prerequisites: [{ actionId: "wellness_visit_center", minExecutions: 1 }],
    xpPerSecond: 3,
  },
  {
    id: "rooftop_grow_herbs",
    name: "Grow Herbs",
    description: "You plant small things in shallow soil. They want exactly what you have.",
    category: "rooftop",
    progressRequired: 25,
    autoRestart: true,
    startCosts: [{ resourceId: "sunlight", amount: 6 }, { resourceId: "seeds", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "herbs", amount: 2 },
      { type: "add_resource", resourceId: "mana", amount: 0.5 },
      { type: "add_resource", resourceId: "insight", amount: 0.15 }
    ],
    prerequisites: [{ taskId: "rooftop_bask", minLevel: 2 }],
    maxExecutions: 6,
  },
  {
    id: "rooftop_dry_herbs",
    name: "Dry Herbs",
    description: "You hang them upside down. They whisper as they dry.",
    category: "rooftop",
    progressRequired: 15,
    autoRestart: true,
    startCosts: [{ resourceId: "herbs", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "dried_herbs", amount: 3 },
      { type: "add_resource", resourceId: "mana", amount: 0.3 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "dried_herbs", amount: 15 }],
    prerequisites: [{ taskId: "rooftop_grow_herbs", minLevel: 2 }],
    maxExecutions: 8,
  },
  {
    id: "rooftop_brew_tea",
    name: "Brew Tea",
    description: "Water, leaf, waiting. The steam makes a shape you almost recognize.",
    category: "rooftop",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "dried_herbs", amount: 4 }, { resourceId: "mana", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 1 },
      { type: "add_resource", resourceId: "mana", amount: 2 },
      { type: "add_resource", resourceId: "calm", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "calm", amount: 6 }],
    prerequisites: [{ actionId: "rooftop_moon_garden", minExecutions: 1 }],
    maxExecutions: 5,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "rooftop_install_trellis",
    name: "Install Trellis",
    description: "Vertical space is still space. Things climb if you let them.",
    category: "rooftop",
    costs: [{ resourceId: "money", amount: 50 }, { resourceId: "produce", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "sunlight", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "herbs", amount: 12 },
      { type: "add_item", itemId: "trellis_clippers", amount: 1 }
    ],
    prerequisites: [{ taskId: "rooftop_bask", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "rooftop_moon_garden",
    name: "Plant Moon Garden",
    description: "You plant at night. The seeds don't mind. They were waiting for this.",
    category: "rooftop",
    costs: [{ resourceId: "insight", amount: 10 }, { resourceId: "mana", amount: 20 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.04 },
      { type: "add_item", itemId: "moonwater_vial", amount: 1 }
    ],
    prerequisites: [{ taskId: "rooftop_grow_herbs", minLevel: 3 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "trellis_clippers", name: "Trellis Clippers", description: "Small, sharp, green at the edge.", slot: "hand_r", effects: [{ type: "modify_yield_pct", taskId: "rooftop_grow_herbs", amount: 0.15 }] },
  { id: "moonwater_vial", name: "Moonwater Vial", description: "Left out overnight. It remembers.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.02 }] },
  { id: "pressed_flower", name: "Pressed Flower", description: "Flat, color-held, still faintly scented.", slot: "accessory_2", effects: [{ type: "modify_passive_gen", resourceId: "insight", amount: 0.01 }] },
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "rooftop_solar_still",
    name: "Solar Still",
    description: "A glass box that turns sunlight into something you can drink slowly.",
    cost: [{ resourceId: "money", amount: 120 }, { resourceId: "sunlight", amount: 30 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "sunlight", amount: 0.08 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "mana", amount: 0.06 }],
    prerequisites: [{ actionId: "rooftop_install_trellis", minExecutions: 1 }]
  },
];
