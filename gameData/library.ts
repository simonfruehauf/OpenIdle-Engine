import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig } from "../types";

// The Quiet Library - side-branch
// Flavor: a library that is quieter than it should be. No major progression lock.
// Gives small lore/mana/insight bonuses and a couple of cozy items.
// Unlocks via bookstore or lore.

export const CATEGORIES: CategoryConfig[] = [
  { id: "library", name: "The Quiet Library" }
];

export const RESOURCES: ResourceConfig[] = [
  {
    id: "quiet",
    name: "Quiet",
    type: "basic",
    category: "library",
    baseMax: 0,
    initialAmount: 0,
    description: "Not silence. A kind of attention you can hold in your hands.",
    passiveGen: [{ targetResourceId: 'insanity', ratePerUnit: 0.01 }]

  },
  {
    id: "marginalia",
    name: "Marginalia",
    type: "basic",
    category: "library",
    baseMax: 0,
    initialAmount: 0,
    description: "Notes in other people's handwriting. Some of them are answers to questions you haven't asked.",
    passiveGen: [{ targetResourceId: 'knowledge', ratePerUnit: 0.005 }]

  }
];

export const TASKS: TaskConfig[] = [
  {
    id: "library_sit",
    name: "Sit in the Quiet",
    description: "You sit where the light pools. You do not read. You let the room read you.",
    category: "library",
    costPerSecond: [{ resourceId: "time", amount: 0.32 }],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "quiet", amount: 0.18 },
      { type: "add_resource", resourceId: "mana", amount: 0.02 }
    ],
    progressRequired: 10,
    autoRestart: true,
    prerequisites: [{ actionId: "library_find", minExecutions: 1 }],
    xpPerSecond: 3
  },
  {
    id: "library_copy",
    name: "Copy Marginalia",
    description: "You copy a small, perfect hand into your own notebook. The words make slightly more sense in your handwriting.",
    category: "library",
    costPerSecond: [{ resourceId: "time", amount: 0.28 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "quiet", amount: 6 }],
    progressRequired: 14,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "marginalia", amount: 1 },
      { type: "add_resource", resourceId: "lore", amount: 0.4 },
      { type: "add_resource", resourceId: "quiet", amount: 1 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "marginalia", amount: 12 }
    ],
    prerequisites: [{ taskId: "library_sit", minLevel: 2 }],
    maxExecutions: 14
  },
  {
    id: "library_shelve",
    name: "Shelve Books",
    description: "You volunteer to reshelve. The cart is too tall. The stacks are too quiet. You find books where they should not be.",
    category: "library",
    costPerSecond: [{ resourceId: "time", amount: 0.38 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "marginalia", amount: 2 }],
    progressRequired: 16,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "lore", amount: 0.7 },
      { type: "add_resource", resourceId: "insight", amount: 0.25 },
      { type: "add_resource", resourceId: "mana", amount: 0.6 }
    ],
    prerequisites: [{ taskId: "library_copy", minLevel: 2 }],
    xpPerSecond: 4
  }
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "library_find",
    name: "Find the Quiet Library",
    description: "The bookstore owner mentions an annex. 'Back door, then left. If it is open, you are allowed.'",
    category: "library",
    costs: [{ resourceId: "lore", amount: 3 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "quiet", amount: 8 },
      { type: "add_resource", resourceId: "quiet", amount: 4 }
    ],
    prerequisites: [{ actionId: "bookstore", minExecutions: 1 }],
    maxExecutions: 1,
    logMessage: "The library is open. It smells like paper and winter."
  },
  {
    id: "library_card",
    name: "Get a Library Card",
    description: "Laminated, slightly warm. Your name looks more serious on it.",
    category: "library",
    costs: [{ resourceId: "money", amount: 12 }, { resourceId: "quiet", amount: 4 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "marginalia", amount: 8 },
      { type: "modify_max_resource_flat", resourceId: "quiet", amount: 10 },
      { type: "add_item", itemId: "library_card_item", amount: 1 }
    ],
    prerequisites: [{ taskId: "library_sit", minLevel: 1 }],
    maxExecutions: 1
  },
  {
    id: "library_restricted",
    name: "Access the Restricted Alcove",
    description: "A thin chain, a handwritten sign: STAFF ONLY - MARGINALIA. You lift the chain.",
    category: "library",
    costs: [
      { resourceId: "marginalia", amount: 8 },
      { resourceId: "quiet", amount: 6 }
    ],
    effects: [
      { type: "modify_passive_gen", resourceId: "lore", amount: 0.03 },
      { type: "add_item", itemId: "whispering_bookmark", amount: 1 }
    ],
    prerequisites: [{ taskId: "library_copy", minLevel: 3 }],
    maxExecutions: 1,
    logMessage: "The alcove lets you pass. It has been waiting to be noticed."
  },
  {
    id: "library_bind_book",
    name: "Bind Your Own Folio",
    description: "You gather your copied pages, your found notes, a pressed petal if you have one. You sew it yourself, badly and with care.",
    category: "library",
    costs: [
      { resourceId: "marginalia", amount: 10 },
      { resourceId: "quiet", amount: 6 }
    ],
    effects: [
      { type: "add_item", itemId: "bound_folio", amount: 1 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 8 },
      { type: "modify_yield_pct", taskId: "library_shelve", amount: 0.25 }
    ],
    prerequisites: [
      { taskId: "library_shelve", minLevel: 2 },
      { actionId: "library_card", minExecutions: 1 }
    ],
    maxExecutions: 1
  },
  {
    id: "library_whisper_stacks",
    name: "Listen to the Whispering Stacks",
    description: "If you stand still long enough between the tall shelves, the books whisper. Not words, exactly. Cross-references.",
    category: "library",
    costs: [
      { resourceId: "quiet", amount: 10 },
      { resourceId: "mana", amount: 6 }
    ],
    effects: [
      { type: "add_resource", resourceId: "insight", amount: 3 },
      { type: "add_resource", resourceId: "lore", amount: 4 },
      { type: "modify_yield_pct", taskId: "library_copy", amount: 0.2 }
    ],
    prerequisites: [
      { actionId: "library_restricted", minExecutions: 1 },
      { resourceId: "insight", minAmount: 4 }
    ],
    maxExecutions: 1,
    cooldownMs: 30000
  }
];

export const ITEMS: ItemConfig[] = [
  {
    id: "library_card_item",
    name: "Library Card",
    description: "Your name, in print. Valid indefinitely.",
    slot: "accessory",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "quiet", amount: 8 },
      { type: "modify_yield_pct", taskId: "library_sit", amount: 0.12 }
    ]
  },
  {
    id: "whispering_bookmark",
    name: "Whispering Bookmark",
    description: "It never stays where you put it. It is always one page ahead.",
    slot: "accessory",
    effects: [
      { type: "modify_yield_pct", taskId: "library_copy", amount: 0.18 },
      { type: "modify_passive_gen", resourceId: "lore", amount: 0.02 }
    ]
  },
  {
    id: "bound_folio",
    name: "Bound Folio",
    description: "Your hand, and other hands, made into one book. It is heavier than it should be.",
    slot: "body",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "lore", amount: 8 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 6 }
    ]
  }
];
