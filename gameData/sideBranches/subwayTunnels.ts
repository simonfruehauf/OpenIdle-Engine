import { ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "@types";

export const RESOURCES: ResourceConfig[] = [
  { id: "scrap", name: "Scrap", type: "basic", category: "tunnels", baseMax: 0, initialAmount: 0, description: "Metal, concrete dust, things that were once something else." },
  { id: "echoes", name: "Echoes", type: "basic", category: "tunnels", baseMax: 0, initialAmount: 0, description: "Not sound. The residue of being heard." },
  { id: "strange_artifact", name: "Strange Artifact", type: "basic", category: "tunnels", baseMax: 0, initialAmount: 0, description: "You don't know what it is. It hums when you're not looking." },
];

export const TASKS: TaskConfig[] = [
  {
    id: "tunnel_explore",
    name: "Explore Tunnels",
    description: "You follow the maintenance door down. The air gets cooler.",
    category: "tunnels",
    progressRequired: 12,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.4 }, { resourceId: "health", amount: 0.08 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "scrap", amount: 1.8 },
      { type: "add_resource", resourceId: "echoes", amount: 0.6 },
      { type: "add_resource", resourceId: "insanity", amount: 0.15 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "scrap", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "echoes", amount: 10 }
    ],
    prerequisites: [{ actionId: "find_cat", minExecutions: 1 }, { resourceId: "insanity", minAmount: 5 }],
    xpPerSecond: 3,
  },
  {
    id: "tunnel_map",
    name: "Map the Tunnels",
    description: "You draw lines where you've been. The lines connect where they shouldn't.",
    category: "tunnels",
    progressRequired: 25,
    autoRestart: true,
    startCosts: [{ resourceId: "echoes", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "lore", amount: 0.8 },
      { type: "add_resource", resourceId: "insight", amount: 0.2 },
      { type: "add_resource", resourceId: "scrap", amount: 2 }
    ],
    prerequisites: [{ taskId: "tunnel_explore", minLevel: 2 }],
    maxExecutions: 8,
  },
  {
    id: "tunnel_salvage",
    name: "Salvage Materials",
    description: "You pry, you carry, you sort. Some things are still useful.",
    category: "tunnels",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "scrap", amount: 8 }, { resourceId: "health", amount: 2 }],
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 8 },
      { type: "add_resource", resourceId: "scrap", amount: 4 },
      { type: "add_resource", resourceId: "echoes", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "tunnel_explore", minLevel: 3 }],
    maxExecutions: 10,
  },
  {
    id: "tunnel_deep_delve",
    name: "Deep Delve",
    description: "Past the flooded section, past the place where your phone lost signal and never found it again.",
    category: "tunnels",
    progressRequired: 50,
    autoRestart: true,
    startCosts: [{ resourceId: "echoes", amount: 15 }, { resourceId: "insanity", amount: 6 }],
    costPerSecond: [{ resourceId: "time", amount: 0.4 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 2 },
      { type: "add_resource", resourceId: "strange_artifact", amount: 1 },
      { type: "add_resource", resourceId: "lore", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "strange_artifact", amount: 5 }],
    prerequisites: [{ actionId: "tunnel_follow_echo", minExecutions: 1 }],
    maxExecutions: 3,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "tunnel_gear_up",
    name: "Gear Up for Tunnels",
    description: "Boots, gloves, a light that won't fail when you need it most.",
    category: "tunnels",
    costs: [{ resourceId: "money", amount: 80 }, { resourceId: "scrap", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 5 },
      { type: "modify_max_resource_flat", resourceId: "scrap", amount: 20 },
      { type: "add_item", itemId: "headlamp", amount: 1 }
    ],
    prerequisites: [{ taskId: "tunnel_explore", minLevel: 2 }],
    maxExecutions: 1,
  },
  {
    id: "tunnel_follow_echo",
    name: "Follow the Echo",
    description: "You hear something that is not a sound. You follow it anyway.",
    category: "tunnels",
    costs: [{ resourceId: "echoes", amount: 20 }, { resourceId: "insight", amount: 6 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "insight", amount: 0.02 },
      { type: "modify_max_resource_flat", resourceId: "echoes", amount: 10 }
    ],
    prerequisites: [{ taskId: "tunnel_map", minLevel: 3 }],
    maxExecutions: 1,
  },
  {
    id: "tunnel_cat_guidance",
    name: "Follow the Cat",
    description: "The cat goes down. You didn't know there was a down there. It waits for you.",
    category: "tunnels",
    costs: [{ resourceId: "insanity", amount: 6 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "echoes", amount: 0.03 },
      { type: "add_item", itemId: "cat_whisker", amount: 1 }
    ],
    prerequisites: [{ resourceId: "cat", minMax: 1 }, { taskId: "tunnel_explore", minLevel: 2 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "headlamp", name: "Headlamp", description: "It makes your forehead heavier and your way clearer.", slot: "head", effects: [{ type: "modify_yield_pct", taskId: "tunnel_explore", amount: 0.15 }] },
  { id: "cat_whisker", name: "Cat Whisker", description: "Found on your coat. Vibrates slightly.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "echoes", amount: 0.02 }] },
  { id: "tunnel_map_item", name: "Tunnel Map", description: "Your lines, now legible to someone else.", slot: "accessory_2", effects: [{ type: "modify_yield_pct", taskId: "tunnel_map", amount: 0.2 }] },
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "tunnel_scrap_press",
    name: "Scrap Press",
    description: "You set up a press in the old service alcove. It folds scrap into something tradeable.",
    cost: [{ resourceId: "money", amount: 100 }, { resourceId: "scrap", amount: 20 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "money", amount: 0.15 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "scrap", amount: 0.12 }],
    prerequisites: [{ actionId: "tunnel_gear_up", minExecutions: 1 }]
  },
];
