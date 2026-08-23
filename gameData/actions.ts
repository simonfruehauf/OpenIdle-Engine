import { ActionConfig } from "../types";

export const ACTIONS: ActionConfig[] = [

  {
    id: "trash_search",
    name: "Rifle through Trash",
    description: "Some people throw away their money in the street. With a bit of luck, you can take it.",
    category: "starting",
    costs: [{ resourceId: 'time', amount: 1 }],
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
    prerequisites: [{ taskId: 'subways_job', minExecutions: 15 }],
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
    { type: 'modify_max_resource_flat', resourceId: 'insanity', amount: 9, hidden: true },
    { type: 'add_resource', resourceId: 'insanity', amount: 2, hidden: true },
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
    effects: [{ type: 'add_resource', resourceId: 'insanity', amount: -0.5 }],
    prerequisites: [{ resourceId: 'cat', minMax: 1 }],
  },
  {
    id: "talk_cat",
    name: "Talk to the cat",
    description: "You talk to the cat. It... talks back?",
    category: "oddness",
    costs: [],
    effects: [{ type: 'add_resource', resourceId: 'lore', amount: 0.1 }, { type: 'add_resource', resourceId: 'insanity', amount: 1 }],
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
    effects: [{ type: 'add_resource', resourceId: 'insanity', amount: -0.5 }],
    prerequisites: [{ resourceId: 'cat', minMax: 1 }]
  },
  // {
  //   id: "DEBUG",
  //   name: "DEBUG",
  //   description: "DEBUG",
  //   category: "basic",
  //   costs: [],
  //   effects: [{ type: 'add_resource', resourceId: 'insanity', amount: 0.1 }],
  // },
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
  },
  {
    id: "sit_breathe",
    name: "Sit and Breathe",
    description: "You sit on the floor and try to notice your breath. Nothing happens. Then, slightly, something does.",
    category: "upgrades",
    costs: [{ resourceId: 'time', amount: 4 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'mana', amount: 14 },
      { type: 'add_resource', resourceId: 'mana', amount: 7 }
    ],
    prerequisites: [{ actionId: 'appartment', minExecutions: 1 }],
    maxExecutions: 1,
    logMessage: "Your chest learns a new rhythm."
  },
  {
    id: "meditate_deeper",
    name: "Breathe Deeper",
    description: "Same floor. Same breath. Now you can hold it long enough to hear the apartment hum.",
    category: "upgrades",
    costs: [{ resourceId: 'mana', amount: 8 }, { resourceId: 'time', amount: 5 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'mana', amount: 22 },
      { type: 'modify_passive_gen', resourceId: 'mana', amount: 0.04 }
    ],
    prerequisites: [{ actionId: 'sit_breathe', minExecutions: 1 }],
    maxExecutions: 1
  },
  {
    id: "surgery_eye",
    name: "Volunteer for the Study",
    description: "A flyer on the corkboard: compensated study, pineal stimulation. The clinic smells like ozone and old paper.",
    category: "oddness",
    costs: [
      { resourceId: 'money', amount: 90 },
      { resourceId: 'insanity', amount: 4 }
    ],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'mana', amount: 10 },
      { type: 'add_resource', resourceId: 'mana', amount: 10 },
      { type: 'add_item', itemId: 'eye_patch', amount: 1 },
      { type: 'modify_passive_gen', resourceId: 'insight', amount: 0.015 }
    ],
    prerequisites: [
      { resourceId: 'insight', minAmount: 8 },
      { resourceId: 'mana', minMax: 1 }
    ],
    maxExecutions: 1,
    logMessage: "You leave with an eyepatch and an afterimage that does not fade."
  }
];

