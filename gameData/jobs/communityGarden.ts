import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  { id: "produce", name: "Produce", type: "basic", category: "garden", baseMax: 0, initialAmount: 0, description: "What the beds give back. Heavier than it looks." },
  { id: "seeds", name: "Seeds", type: "basic", category: "garden", baseMax: 0, initialAmount: 0, description: "Small promises. You keep them in paper envelopes." },
  { id: "reputation", name: "Reputation", type: "stat", category: "garden", baseMax: 0, initialAmount: 0, description: "People know your work. They talk when you're not there." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "garden_tend_beds",
    name: "Tend the Beds",
    description: "Water, weed, thin. The soil is warm.",
    category: "garden",
    progressRequired: 10,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.5 }, { resourceId: "health", amount: 0.08 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "produce", amount: 1.5 },
      { type: "add_resource", resourceId: "health", amount: 0.4 },
      { type: "add_resource", resourceId: "mana", amount: 0.25 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "produce", amount: 12 },
      { type: "modify_max_resource_flat", resourceId: "seeds", amount: 10 }
    ],
    prerequisites: [{ actionId: "appartment", minExecutions: 1 }],
    xpPerSecond: 4,
  },
  {
    id: "garden_plant_seasonal",
    name: "Plant Seasonal Crop",
    description: "You tuck seeds into dark lines. You cover them and wait.",
    category: "garden",
    progressRequired: 30,
    autoRestart: true,
    startCosts: [{ resourceId: "seeds", amount: 3 }, { resourceId: "produce", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "produce", amount: 4 },
      { type: "add_resource", resourceId: "insight", amount: 0.3 },
      { type: "add_resource", resourceId: "mana", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "garden_tend_beds", minLevel: 2 }],
    maxExecutions: 4,
  },
  {
    id: "garden_compost",
    name: "Manage Compost",
    description: "Everything returns. You turn it and it steams in the cold.",
    category: "garden",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "produce", amount: 8 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "seeds", amount: 3 },
      { type: "add_resource", resourceId: "health", amount: 0.5 },
      { type: "add_resource", resourceId: "lore", amount: 0.2 }
    ],
    prerequisites: [{ taskId: "garden_tend_beds", minLevel: 3 }],
    maxExecutions: 6,
  },
  {
    id: "garden_harvest_festival",
    name: "Organize Harvest Share",
    description: "Tables on the street, everyone takes what they need. You are thanked in a way that feels like currency.",
    category: "garden",
    progressRequired: 40,
    autoRestart: true,
    startCosts: [{ resourceId: "produce", amount: 20 }, { resourceId: "favor", amount: 10 }],
    costPerSecond: [{ resourceId: "time", amount: 0.4 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 30 },
      { type: "add_resource", resourceId: "favor", amount: 8 },
      { type: "add_resource", resourceId: "reputation", amount: 5 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "reputation", amount: 8 }],
    prerequisites: [{ taskId: "garden_plant_seasonal", minLevel: 2 }],
    maxExecutions: 2,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "garden_tool_shed",
    name: "Access Tool Shed",
    description: "The shed is unlocked. Inside: everything has its place, even the rust.",
    category: "garden",
    costs: [{ resourceId: "money", amount: 60 }, { resourceId: "produce", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "produce", amount: 20 },
      { type: "modify_max_resource_flat", resourceId: "seeds", amount: 15 },
      { type: "add_item", itemId: "gardening_gloves", amount: 1 }
    ],
    prerequisites: [{ taskId: "garden_tend_beds", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "garden_greenhouse_key",
    name: "Get Greenhouse Key",
    description: "The coordinator hands you a key. 'It was always for you,' she says, though you've never met.",
    category: "garden",
    costs: [{ resourceId: "produce", amount: 30 }, { resourceId: "insight", amount: 8 }, { resourceId: "mana", amount: 15 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.03 },
      { type: "add_item", itemId: "sun_hat", amount: 1 }
    ],
    prerequisites: [{ taskId: "garden_plant_seasonal", minLevel: 2 }, { actionId: "garden_tool_shed", minExecutions: 1 }],
    maxExecutions: 1,
    logMessage: "The greenhouse key is cold. The glass house waits."
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "gardening_gloves", name: "Gardening Gloves", description: "Stained at the fingertips. You feel roots before you see them.", slot: "hand_r", effects: [{ type: "modify_yield_pct", taskId: "garden_tend_beds", amount: 0.15 }] },
  { id: "sun_hat", name: "Sun Hat", description: "Wide brim, faded. You wear it even in shade.", slot: "head", effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.02 }] },
  { id: "woven_basket", name: "Woven Basket", description: "Holds more than it should.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "produce", amount: 10 }] },
  { id: "almanac", name: "Almanac", description: "Planting dates, moon phases, marginal notes in three hands.", slot: "accessory_2", effects: [{ type: "modify_passive_gen", resourceId: "insight", amount: 0.015 }] },
];
