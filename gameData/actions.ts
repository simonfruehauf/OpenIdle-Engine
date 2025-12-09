import { ActionConfig } from "../types";

export const ACTIONS: ActionConfig[] = [

  {
    id: "trash_search",
    name: "Rifle through Trash",
    description: "Some people throw away their money in the street. With a bit of luck, you can take it.",
    category: "starting",
    costs: [{ resourceId: 'stamina', amount: 1 }],
    effects: [
      { type: 'add_resource', resourceId: 'money', amount: 2.5, scaleFactor: 1.05 },
    ]
  },
  // upgrades
  {
    id: "wallet",
    name: "Buy a Wallet",
    description: "",
    category: "upgrades",
    costs: [{ resourceId: 'money', amount: 5 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'money', amount: 25 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 5 }],
    maxExecutions: 1
  },
  {
    id: "wallet_2",
    name: "Buy a bigger Wallet",
    description: "",
    category: "upgrades",
    costs: [{ resourceId: 'money', amount: 30 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'money', amount: 70 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 30 }],
    maxExecutions: 1
  },
  {
    id: "backpack",
    name: "Buy a Backpack",
    description: "It would be great to carry around more stuff.",
    category: "upgrades",
    costs: [{ resourceId: 'money', amount: 50 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'money', amount: 100 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 50 }],
    maxExecutions: 1
  },
  {
    id: "appartment",
    name: "Rent an Appartment",
    description: "Commodities, finally.",
    category: "upgrades",
    costs: [{ resourceId: 'money', amount: 200 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'money', amount: 100 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 50 }],
    maxExecutions: 1,
    locks: ["rest_bench"]
  },
  // Starting out
  {
    id: "get_job",
    name: "Get a Job",
    description: "Subway's is hiring. It's better than searching through trash.",
    category: "starting",
    costs: [],
    effects: [],
    prerequisites: [{ actionId: 'trash_search', minExecutions: 10 },
    { actionId: 'wallet', minExecutions: 1 },
    { actionId: 'wallet_2', minExecutions: 1 }
    ],
    maxExecutions: 1,
    locks: ['trash_search']
  },
  {
    id: "subways_promotion",
    name: "Promotion",
    description: "You got a promotion at Subway's.",
    category: "starting",
    costs: [],
    effects: [],
    prerequisites: [{ taskId: 'subway_job', minExecutions: 15 }],
    maxExecutions: 1,
    locks: ['subways_job']
  },
  // Oddness
  {
    id: "scratch",
    name: "Scratching in the walls",
    description: "You're hearing something...",
    category: "starting",
    costs: [],
    effects: [],
    prerequisites: [{ actionId: 'appartment', minExecutions: 1 }],
    maxExecutions: 1,
    hideWhenComplete: true

  },
  {
    id: "find_cat",
    name: "Creature in the wall",
    description: "It's... a cat?",
    category: "starting",
    costs: [],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'cat', amount: 1 },
    { type: 'add_resource', resourceId: 'cat', amount: 1 },
    { type: 'modify_max_resource_flat', resourceId: 'sanity', amount: 10, hidden: true },
    { type: 'add_resource', resourceId: 'sanity', amount: 10, hidden: true },
    ],
    prerequisites: [{ taskId: 'wall_destroy', minExecutions: 10 }],
    maxExecutions: 1
  },
  {
    id: "pet_cat",
    name: "Pet the cat",
    description: "You pet the cat. It's soft and warm.",
    category: "oddness",
    costs: [],
    effects: [{ type: 'add_resource', resourceId: 'sanity', amount: 1 }],
    prerequisites: [{ resourceId: 'cat', minMax: 1 }],
  },
  {
    id: "talk_cat",
    name: "Talk to the cat",
    description: "You talk to the cat. It... talks back?",
    category: "oddness",
    costs: [{ resourceId: 'sanity', amount: 1 }],
    effects: [{ type: 'add_resource', resourceId: 'lore', amount: 0.1 }],
    firstCompletionEffects: [{ type: 'modify_max_resource_flat', resourceId: 'lore', amount: 5 }],
    prerequisites: [{ resourceId: 'cat', minMax: 1 }],
    locks: ['pet_cat']
  },
  {
    id: "feed_cat",
    name: "Feed the cat",
    description: "You feed the cat. It's happy.",
    category: "oddness",
    costs: [{ resourceId: 'money', amount: 1 }],
    effects: [{ type: 'add_resource', resourceId: 'sanity', amount: 1 }],
    prerequisites: [{ resourceId: 'cat', minMax: 1 }]
  },
  {
    id: "DEBUG",
    name: "DEBUG",
    description: "DEBUG",
    category: "basic",
    costs: [],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'mana', amount: 1 }],
  },
  {
    id: "bookstore",
    name: "Visit the bookstore",
    description: "You visit the bookstore. You buy a book on cats.",
    category: "basic",
    costs: [{ resourceId: 'money', amount: 15 }],
    effects: [{ type: 'modify_yield_flat', actionId: 'talk_cat', amount: 0.1, resourceId: 'lore' }],
    firstCompletionEffects: [{ type: 'modify_max_resource_flat', resourceId: 'lore', amount: 5 }],
    prerequisites: [{ resourceId: 'money', minMax: 1 }, { resourceId: 'cat', minMax: 1 }],
    maxExecutions: 4
  }
];

