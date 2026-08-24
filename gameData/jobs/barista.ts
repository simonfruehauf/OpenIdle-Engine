import { TaskConfig, ActionConfig, ItemConfig } from "../../types";

export const TASKS: TaskConfig[] = [
  {
    id: "cafe_shift_morning",
    name: "Morning Rush",
    description: "Steam, clatter, and names you learn before faces. You get fast or you get burned.",
    category: "cafe",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.4 }, { resourceId: "health", amount: 0.05 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 6 },
      { type: "add_resource", resourceId: "favor", amount: 0.6 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "favor", amount: 8 }],
    prerequisites: [{ actionId: "appartment", minExecutions: 1 }],
    xpPerSecond: 5,
  },
  {
    id: "cafe_shift_evening",
    name: "Evening Calm",
    description: "Fewer orders, more lingering. People talk. You listen.",
    category: "cafe",
    progressRequired: 6,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.3 }, { resourceId: "health", amount: 0.03 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 4 },
      { type: "add_resource", resourceId: "mana", amount: 0.7 },
      { type: "add_resource", resourceId: "favor", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "cafe_shift_morning", minLevel: 2 }],
    xpPerSecond: 4,
  },
  {
    id: "cafe_learn_recipes",
    name: "Learn Specialty Drinks",
    description: "Latte art, cold brew ratios, the drink that has no name yet.",
    category: "cafe",
    progressRequired: 20,
    autoRestart: true,
    startCosts: [{ resourceId: "money", amount: 5 }, { resourceId: "favor", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 0.2 },
      { type: "add_resource", resourceId: "health", amount: 0.3 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "favor", amount: 6 }],
    prerequisites: [{ taskId: "cafe_shift_morning", minLevel: 2 }],
    maxExecutions: 8,
  },
  {
    id: "cafe_regulars",
    name: "Remember Regulars' Orders",
    description: "You know what they want before they do. They notice.",
    category: "cafe",
    progressRequired: 15,
    autoRestart: true,
    startCosts: [{ resourceId: "favor", amount: 5 }],
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 3 },
      { type: "add_resource", resourceId: "favor", amount: 1.2 },
      { type: "add_resource", resourceId: "lore", amount: 0.15 }
    ],
    prerequisites: [{ taskId: "cafe_learn_recipes", minLevel: 2 }],
    maxExecutions: 12,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "cafe_promo_shift_lead",
    name: "Become Shift Lead",
    description: "Keys, a clipboard, and the understanding that you open even when you don't want to.",
    category: "cafe",
    costs: [{ resourceId: "money", amount: 40 }, { resourceId: "favor", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "money", amount: 50 },
      { type: "modify_max_resource_flat", resourceId: "favor", amount: 10 }
    ],
    prerequisites: [{ taskId: "cafe_shift_morning", minLevel: 4 }],
    maxExecutions: 1,
  },
  {
    id: "cafe_promo_manager",
    name: "Assistant Manager",
    description: "You schedule. You order beans. The espresso machine listens to you now.",
    category: "cafe",
    costs: [{ resourceId: "money", amount: 120 }, { resourceId: "favor", amount: 20 }, { resourceId: "insight", amount: 4 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "money", amount: 0.08 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 8 },
      { type: "add_item", itemId: "barista_apron", amount: 1 }
    ],
    prerequisites: [{ actionId: "cafe_promo_shift_lead", minExecutions: 1 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  {
    id: "barista_apron",
    name: "Barista Apron",
    description: "Stained, practical, yours. The pockets know coins by feel.",
    slot: "body",
    effects: [{ type: "modify_yield_pct", taskId: "cafe_shift_morning", amount: 0.12 }],
  },
  {
    id: "chipped_mug",
    name: "Chipped Mug",
    description: "Your mug. No one else uses it. It keeps things warm longer than it should.",
    slot: "accessory",
    effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.025 }],
  },
  {
    id: "bag_of_beans",
    name: "Bag of Beans",
    description: "A sample bag, gifted. You grind slowly, deliberately.",
    slot: "accessory_2",
    effects: [{ type: "modify_passive_gen", resourceId: "health", amount: 0.02 }],
  },
];
