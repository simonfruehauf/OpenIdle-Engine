import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig, ConverterConfig } from "../../types";

// Night Market - side-branch
// Flavor: a market that only opens when you are tired enough to see it.
// Trade-focused, converter-friendly. Small money/token economy.
// No major lock on main progression. Minor upgrades, interesting barter.

export const CATEGORIES: CategoryConfig[] = [
  { id: "nightmarket", name: "Night Market" }
];

export const RESOURCES: ResourceConfig[] = [
  {
    id: "tokens",
    name: "Tokens",
    type: "basic",
    category: "nightmarket",
    baseMax: 0,
    initialAmount: 0,
    description: "Stamped tin, faintly warm. Vendors take them, but no one will say where they are minted."
  },
  {
    id: "favor",
    name: "Favor",
    type: "basic",
    category: "nightmarket",
    baseMax: 0,
    initialAmount: 0,
    description: "Not money. A record that someone at the market owes you attention."
  }
];

export const TASKS: TaskConfig[] = [
  {
    id: "market_browse",
    name: "Browse by Lantern Light",
    description: "You walk slowly. The stalls are tarps and suitcases. Everything is priced, nothing is labeled quite right.",
    category: "nightmarket",
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "tokens", amount: 0.14 },
      { type: "add_resource", resourceId: "favor", amount: 0.02 }
    ],
    progressRequired: 12,
    autoRestart: true,
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "favor", amount: 6 }
    ],
    prerequisites: [{ actionId: "market_hear", minExecutions: 1 }],
    xpPerSecond: 3
  },
  {
    id: "market_carry",
    name: "Carry Crates for Vendors",
    description: "You carry. You are paid in tokens and stories you only half understand.",
    category: "nightmarket",
    costPerSecond: [
      { resourceId: "time", amount: 0.4 },
      { resourceId: "health", amount: 0.05 }
    ],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "favor", amount: 2 }],
    progressRequired: 15,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "money", amount: 8 },
      { type: "add_resource", resourceId: "tokens", amount: 3 },
      { type: "add_resource", resourceId: "favor", amount: 1 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "favor", amount: 10 }
    ],
    prerequisites: [{ taskId: "market_browse", minLevel: 2 }],
    maxExecutions: 12
  },
  {
    id: "market_haggle",
    name: "Haggle Properly",
    description: "You learn to offer less and mean more. The vendors like you better this way.",
    category: "nightmarket",
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "tokens", amount: 6 }],
    progressRequired: 10,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "favor", amount: 2 },
      { type: "add_resource", resourceId: "money", amount: 4 }
    ],
    prerequisites: [{ taskId: "market_browse", minLevel: 3 }],
    maxExecutions: 10
  }
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "market_hear",
    name: "Night Market Flyer",
    description: "The Subway regular with ink on his fingers tells you: 'After midnight, behind the laundromat, if you are already out.'",
    category: "leads",
    costs: [{ resourceId: "money", amount: 25 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "tokens", amount: 12 },
      { type: "add_resource", resourceId: "tokens", amount: 6 },
      { type: "modify_max_resource_flat", resourceId: "favor", amount: 8 },
      { type: "add_resource", resourceId: "favor", amount: 2 }
    ],
    prerequisites: [{ actionId: "get_job", minExecutions: 1 }],
    maxExecutions: 1,
    logMessage: "You find it because you were already awake."
  },
  {
    id: "market_enter",
    name: "Enter the Market Properly",
    description: "You bring a small offering. A token and your attention. The entrance was a gap between dumpsters last time. Now it has a string of lights.",
    category: "nightmarket",
    costs: [
      { resourceId: "tokens", amount: 8 },
      { resourceId: "favor", amount: 2 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "favor", amount: 8 },
      { type: "add_resource", resourceId: "favor", amount: 3 },
      { type: "add_item", itemId: "brass_scale", amount: 1 }
    ],
    prerequisites: [{ taskId: "market_browse", minLevel: 1 }],
    maxExecutions: 1
  },
  {
    id: "market_deal_small",
    name: "Make a Small Deal",
    description: "Tokens for knowledge, knowledge for tokens. The trader writes your receipt on your palm. It itches toward legibility.",
    category: "nightmarket",
    costs: [
      { resourceId: "tokens", amount: 14 },
      { resourceId: "favor", amount: 3 }
    ],
    effects: [
      { type: "add_resource", resourceId: "lore", amount: 5 },
      { type: "modify_max_resource_flat", resourceId: "lore", amount: 6 },
      { type: "add_resource", resourceId: "insight", amount: 2 }
    ],
    prerequisites: [{ taskId: "market_haggle", minLevel: 1 }],
    maxExecutions: 2
  },
  {
    id: "market_deal_large",
    name: "Make a Larger Deal",
    description: "You ask for something bigger. The vendor asks what you will not miss.",
    category: "nightmarket",
    costs: [
      { resourceId: "tokens", amount: 22 },
      { resourceId: "favor", amount: 6 },
      { resourceId: "insight", amount: 4 }
    ],
    effects: [
      { type: "add_resource", resourceId: "money", amount: 90 },
      { type: "modify_max_resource_flat", resourceId: "money", amount: 50 },
      { type: "add_item", itemId: "market_ledger", amount: 1 }
    ],
    prerequisites: [{ actionId: "market_deal_small", minExecutions: 1 }],
    maxExecutions: 1
  },
  {
    id: "market_repay",
    name: "Repay a Favor",
    description: "You help break down a stall after close. No one asks you to. Someone notices.",
    category: "nightmarket",
    costs: [
      { resourceId: "favor", amount: 8 },
      { resourceId: "time", amount: 6 }
    ],
    effects: [
      { type: "add_resource", resourceId: "tokens", amount: 10 },
      { type: "modify_passive_gen", resourceId: "money", amount: 0.04 }
    ],
    prerequisites: [{ taskId: "market_carry", minLevel: 2 }],
    maxExecutions: 1
  }
];

export const ITEMS: ItemConfig[] = [
  {
    id: "brass_scale",
    name: "Brass Scale",
    description: "Small, honest, slightly sticky. It weighs trades and finds them fair.",
    slot: "accessory",
    effects: [
      { type: "modify_yield_pct", taskId: "market_haggle", amount: 0.18 },
      { type: "modify_yield_pct", taskId: "market_browse", amount: 0.1 }
    ]
  },
  {
    id: "market_ledger",
    name: "Night Ledger",
    description: "A thin book of debts and credits, half in a hand you recognize as yours.",
    slot: "accessory",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "tokens", amount: 12 },
      { type: "modify_passive_gen", resourceId: "money", amount: 0.03 }
    ]
  }
];

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "market_stall_tokens",
    name: "Token Press",
    description: "A small hand-press at the edge of the market. It stamps money into tokens, slowly, with a satisfying clunk.",
    cost: [
      { resourceId: "money", amount: 55 },
      { resourceId: "tokens", amount: 10 }
    ],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "money", amount: 0.08 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "tokens", amount: 0.06 }],
    prerequisites: [{ actionId: "market_enter", minExecutions: 1 }]
  },
  {
    id: "market_stall_favor",
    name: "Favor Grinder",
    description: "You trade spare time and tokens for the slow accumulation of being owed. It feels like banking, but warmer.",
    cost: [
      { resourceId: "tokens", amount: 18 },
      { resourceId: "favor", amount: 6 }
    ],
    canBeToggled: true,
    costPerSecond: [
      { resourceId: "time", amount: 0.06 },
      { resourceId: "tokens", amount: 0.04 }
    ],
    effectsPerSecond: [{ type: "add_resource", resourceId: "favor", amount: 0.02 }],
    prerequisites: [{ taskId: "market_haggle", minLevel: 2 }]
  }
];
