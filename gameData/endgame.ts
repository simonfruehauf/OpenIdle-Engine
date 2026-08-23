import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "../types";

// Endgame - The Threshold
// This is the convergence point for all major paths. It is meant to feel like an ending,
// not a grind. High costs, clear prerequisites, and three distinct final choices.
// Each ending gives a different permanent bonus and is exclusiveWith the others.
// A fourth action offers a prestige-style "Begin Again" that resets some modifiers
// but leaves a permanent echo. All effects are implemented; no dangling mechanics.

export const CATEGORIES: CategoryConfig[] = [
  { id: "threshold", name: "The Threshold" },
  { id: "ending", name: "Ending" }
];

export const RESOURCES: ResourceConfig[] = [
  {
    id: "echo",
    name: "Echo",
    type: "basic",
    category: "threshold",
    baseMax: 0,
    initialAmount: 0,
    description: "The sound the apartment makes after everyone has left. You can collect it, carefully, if you know how to be still."
  },
  {
    id: "resonance",
    name: "Resonance",
    type: "stat",
    category: "threshold",
    baseMax: 0,
    initialAmount: 0,
    color: "bg-violet-500",
    description: "How strongly the threshold knows your name. It grows when you hold the door open."
  }
];

export const TASKS: TaskConfig[] = [
  {
    id: "threshold_hold",
    name: "Hold the Threshold Open",
    description: "You stand in the doorway of what the apartment has become. Cold on one cheek, warm on the other. You hold it.",
    category: "threshold",
    costPerSecond: [
      { resourceId: "time", amount: 0.6 },
      { resourceId: "health", amount: 0.05 },
      { resourceId: "mana", amount: 0.04 }
    ],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "echo", amount: 0.045 },
      { type: "add_resource", resourceId: "resonance", amount: 0.02 }
    ],
    progressRequired: 30,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 1 },
      { type: "add_resource", resourceId: "lore", amount: 0.8 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "echo", amount: 20 },
      { type: "modify_max_resource_flat", resourceId: "resonance", amount: 12 }
    ],
    prerequisites: [
      { resourceId: "insight", minAmount: 18 },
      { resourceId: "echo", minMax: 1 }
    ],
    xpPerSecond: 5
  },
  {
    id: "threshold_listen_final",
    name: "Listen for the Last Word",
    description: "The walls have been talking the whole time. Now you are quiet enough to hear the sentence end.",
    category: "threshold",
    costPerSecond: [{ resourceId: "time", amount: 0.45 }],
    effectsPerSecond: [],
    startCosts: [
      { resourceId: "echo", amount: 8 },
      { resourceId: "quiet", amount: 6 }
    ],
    progressRequired: 25,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "echo", amount: 3 },
      { type: "add_resource", resourceId: "resonance", amount: 1.2 }
    ],
    prerequisites: [{ taskId: "threshold_hold", minLevel: 2 }],
    maxExecutions: 8
  }
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "threshold_open",
    name: "Open the Threshold",
    description: "You have enough threads, enough ashes, enough notes. You pull the patched plaster away. Behind it is not a wall. It is a door that was always a door.",
    category: "threshold",
    costs: [
      { resourceId: "insight", amount: 18 },
      { resourceId: "lore", amount: 12 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "echo", amount: 15 },
      { type: "add_resource", resourceId: "echo", amount: 6 },
      { type: "modify_max_resource_flat", resourceId: "resonance", amount: 10 },
      { type: "add_resource", resourceId: "resonance", amount: 4 }
    ],
    prerequisites: [
      { resourceId: "insight", minAmount: 18 },
      { resourceId: "lore", minAmount: 12 }
    ],
    maxExecutions: 1,
    logMessage: "The door opens inward. The apartment does not get bigger. You do."
  },
  // Three true endings - mutually exclusive
  {
    id: "ending_stay",
    name: "Stay. Keep the Door Ajar.",
    description: "You do not go through. You keep the apartment, the job, the market, the library, the cat's visits. You learn to live with a door that is bigger inside. You make a life around it.",
    category: "ending",
    costs: [
      { resourceId: "echo", amount: 25 },
      { resourceId: "resonance", amount: 8 },
      { resourceId: "threads", amount: 8 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "time", amount: 8 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 8 },
      { type: "add_item", itemId: "key_ajar", amount: 1 },
      { type: "increase_max_tasks", amount: 1 }
    ],
    firstCompletionEffects: [
      { type: "modify_passive_gen", resourceId: "health", amount: 0.03 },
      { type: "modify_passive_gen", resourceId: "time", amount: 0.02 }
    ],
    prerequisites: [
      { actionId: "threshold_open", minExecutions: 1 },
      { taskId: "threshold_hold", minLevel: 3 }
    ],
    maxExecutions: 1,
    exclusiveWith: ["ending_leave", "ending_become"],
    logMessage: "You stay. The door stays. A fair arrangement.",
    lockDescription: "An ending. You can only choose one."
  },
  {
    id: "ending_leave",
    name: "Leave. Close the Door Behind You.",
    description: "You pack nothing that does not fit in your pockets. You step out, not through the strange door but the ordinary one, and you do not look back. The city is the same. You are not.",
    category: "ending",
    costs: [
      { resourceId: "echo", amount: 22 },
      { resourceId: "resonance", amount: 8 },
      { resourceId: "ashes", amount: 10 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "money", amount: 80 },
      { type: "add_resource", resourceId: "money", amount: 60 },
      { type: "add_item", itemId: "packed_bag", amount: 1 },
      { type: "modify_max_resource_flat", resourceId: "insanity", amount: -6 },
      { type: "add_resource", resourceId: "insanity", amount: -4 }
    ],
    prerequisites: [
      { actionId: "threshold_open", minExecutions: 1 },
      { taskId: "threshold_hold", minLevel: 3 }
    ],
    maxExecutions: 1,
    exclusiveWith: ["ending_stay", "ending_become"],
    logMessage: "You leave. The wall remembers the shape of a door for a week, then forgets.",
    lockDescription: "An ending. You can only choose one."
  },
  {
    id: "ending_become",
    name: "Become. Step Through.",
    description: "You step through. There is no other side. There is a longer hallway that contains your apartment, and you, and the cat waiting a little ahead with its tail curled around the threshold.",
    category: "ending",
    costs: [
      { resourceId: "echo", amount: 30 },
      { resourceId: "resonance", amount: 12 },
      { resourceId: "insight", amount: 10 },
      { resourceId: "mana", amount: 12 }
    ],
    effects: [
      { type: "add_item", itemId: "threshold_coat", amount: 1 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 20 },
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.06 },
      { type: "modify_max_resource_flat", resourceId: "insight", amount: 15 },
      { type: "increase_max_tasks", amount: 1 }
    ],
    prerequisites: [
      { actionId: "threshold_open", minExecutions: 1 },
      { taskId: "threshold_hold", minLevel: 3 }
    ],
    maxExecutions: 1,
    exclusiveWith: ["ending_stay", "ending_leave"],
    logMessage: "You become the threshold. It is quiet work. You are good at it.",
    lockDescription: "An ending. You can only choose one."
  },
  {
    id: "prestige_begin_again",
    name: "Begin Again, Differently",
    description: "You sweep the apartment. You wash the cups. You leave the threshold door alone. Next time will be different, because you will be.",
    category: "ending",
    costs: [
      { resourceId: "echo", amount: 35 },
      { resourceId: "resonance", amount: 15 }
    ],
    effects: [
      { type: "reset_resource_modifiers", resourceId: "money", amount: 1 },
      { type: "reset_resource_modifiers", resourceId: "lore", amount: 1 },
      { type: "set_max_resource", resourceId: "money", amount: 30 },
      { type: "modify_max_resource_flat", resourceId: "money", amount: 40 },
      { type: "modify_max_resource_flat", resourceId: "time", amount: 6 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 6 },
      { type: "add_resource", resourceId: "insight", amount: 5 },
      { type: "add_resource", resourceId: "echo", amount: 2 },
      { type: "add_item", itemId: "echo_keepsake", amount: 1 }
    ],
    prerequisites: [
      { taskId: "threshold_hold", minLevel: 3 },
      { resourceId: "echo", minAmount: 25 }
    ],
    maxExecutions: 3,
    logMessage: "You begin again. The apartment is new. You are not.",
    hideWhenComplete: false
  }
];

export const ITEMS: ItemConfig[] = [
  {
    id: "key_ajar",
    name: "Key Left Ajar",
    description: "Not a key that locks. A key that holds.",
    slot: "accessory",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "time", amount: 6 },
      { type: "modify_passive_gen", resourceId: "health", amount: 0.02 }
    ]
  },
  {
    id: "packed_bag",
    name: "Packed Bag",
    description: "Light, efficient. You know how to leave now.",
    slot: "body",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "money", amount: 30 },
      { type: "modify_passive_gen", resourceId: "money", amount: 0.05 }
    ]
  },
  {
    id: "threshold_coat",
    name: "Threshold Coat",
    description: "It fits the hallway, not the weather. Pockets deeper than they should be.",
    slot: "body",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 12 },
      { type: "modify_passive_gen", resourceId: "mana", amount: 0.04 },
      { type: "modify_passive_gen", resourceId: "insight", amount: 0.015 }
    ]
  },
  {
    id: "echo_keepsake",
    name: "Echo Keepsake",
    description: "A smooth stone from the threshold. Warm when you doubt.",
    slot: "accessory",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "echo", amount: 10 },
      { type: "modify_yield_pct", taskId: "threshold_hold", amount: 0.15 }
    ]
  }
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "threshold_brazier",
    name: "Small Brazier",
    description: "A bowl for quiet. It burns echoes into resonance, slowly, while you watch the door.",
    cost: [
      { resourceId: "echo", amount: 12 },
      { resourceId: "mana", amount: 10 }
    ],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "echo", amount: 0.04 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "resonance", amount: 0.012 }],
    prerequisites: [{ actionId: "threshold_open", minExecutions: 1 }]
  }
];
