import { ActionConfig, CategoryConfig, ResourceConfig, TaskConfig, ItemConfig } from "@types";

// This module is the first major narrative branch.
// Act 2 "Oddness" funnels into a single choice (lore 5) that splits into three
// mutually exclusive worldviews. Each path has its own resource, tasks, and
// a second-tier exclusive commitment. Picking one locks the others via
// exclusiveWith + locks, so saves remain consistent after reload.

export const CATEGORIES: CategoryConfig[] = [
  { id: "faith", name: "Faith - The Cat's Road" },
  { id: "denial", name: "Denial - The Sealed Wall" },
  { id: "hunger", name: "Hunger - The Taking" },
];

export const RESOURCES: ResourceConfig[] = [
  {
    id: "threads",
    name: "Threads",
    type: "basic",
    category: "faith",
    baseMax: 0,
    initialAmount: 0,
    description: "Thin filaments of place-memory. They tug behind the cat when it moves. Collect them and the alleys remember you back."
  },
  {
    id: "ashes",
    name: "Ashes",
    type: "basic",
    category: "denial",
    baseMax: 0,
    initialAmount: 0,
    description: "What remains after you burn the notes, the photos, the hair you found in the bath. Light, odorless, oddly heavy."
  },
  // Insight already defined in gameData/resources.ts (strange). Threads/Ashes are path-specific.
];

export const TASKS: TaskConfig[] = [
  // - FAITH PATH -
  {
    id: "faith_alley_walk",
    name: "Walk the Alleys at Night",
    description: "The cat does not meow. It expects you to follow. The streetlights stutter as you pass, and the distance between buildings feels negotiable.",
    category: "faith",
    costPerSecond: [
      { resourceId: "time", amount: 0.35 },
      { resourceId: "health", amount: 0.04 }
    ],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "threads", amount: 0.08 },
      { type: "add_resource", resourceId: "insight", amount: 0.015 },
      { type: "add_resource", resourceId: "lore", amount: 0.02 }
    ],
    completionEffects: [{ type: "add_resource", resourceId: "insanity", amount: 0.15 }],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "threads", amount: 5 }],
    progressRequired: 18,
    autoRestart: true,
    prerequisites: [{ actionId: "trust_cat", minExecutions: 1 }],
    xpPerSecond: 4
  },
  {
    id: "faith_listen_walls",
    name: "Listen to the Walls Breathing",
    description: "You press your palm to the plaster where the scratching was. It is warm. Something answers in a cadence almost like language, almost like purring. You stay too long and your hand forgets how fingers work for a second.",
    category: "faith",
    costPerSecond: [{ resourceId: "time", amount: 0.45 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "threads", amount: 3 }],
    progressRequired: 14,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 1.5 },
      { type: "add_resource", resourceId: "threads", amount: 1 },
      { type: "add_resource", resourceId: "insanity", amount: 0.4 }
    ],
    firstCompletionEffects: [{ type: "modify_passive_gen", resourceId: "threads", amount: 0.02 }],
    prerequisites: [{ taskId: "faith_alley_walk", minLevel: 2 }],
    maxExecutions: 12
  },

  // - DENIAL PATH -
  {
    id: "denial_routine",
    name: "Return to Routine",
    description: "Subway. Rent. Sleep eight hours. You time everything now. The wall is just a wall. The extra shift helps. The extra cleaning helps more.",
    category: "denial",
    costPerSecond: [{ resourceId: "time", amount: 0.55 }],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "money", amount: 0.18 },
      { type: "add_resource", resourceId: "ashes", amount: 0.04 }
    ],
    progressRequired: 10,
    autoRestart: true,
    completionEffects: [{ type: "add_resource", resourceId: "insanity", amount: -0.35 }],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "ashes", amount: 8 }],
    prerequisites: [{ actionId: "reject_cat", minExecutions: 1 }],
    xpPerSecond: 3
  },
  {
    id: "denial_rationalize",
    name: "Rationalize",
    description: "You write explanations in a cheap notebook and cross them out aggressively. Gas leak. Rats. Overwork. Each crossed-out line leaves a faint grey residue on your fingers that won't wash off.",
    category: "denial",
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "ashes", amount: 2 }],
    progressRequired: 16,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "ashes", amount: 2 },
      { type: "add_resource", resourceId: "insight", amount: -0.5 },
      { type: "add_resource", resourceId: "lore", amount: -0.2 }
    ],
    prerequisites: [{ taskId: "denial_routine", minLevel: 2 }],
    maxExecutions: 15
  },

  // - HUNGER PATH -
  {
    id: "hunger_extract",
    name: "Extract Knowledge",
    description: "You corner the cat - not unkindly, you tell yourself. You ask it to show you again. It blinks slowly and the room tilts. Something is being pulled out of you as much as put in.",
    category: "hunger",
    costPerSecond: [
      { resourceId: "time", amount: 0.5 },
      { resourceId: "health", amount: 0.06 }
    ],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "insight", amount: 0.06 },
      { type: "add_resource", resourceId: "lore", amount: 0.04 }
    ],
    progressRequired: 12,
    autoRestart: true,
    completionEffects: [{ type: "add_resource", resourceId: "money", amount: 4 }],
    firstCompletionEffects: [{ type: "modify_yield_pct", taskId: "hunger_extract", amount: 0.25, resourceId: "lore" }],
    prerequisites: [{ actionId: "exploit_cat", minExecutions: 1 }],
    xpPerSecond: 6
  },
  {
    id: "hunger_harvest",
    name: "Harvest Whispers",
    description: "The apartment is too quiet after midnight. If you hold your breath, the quiet organizes into syllables. You leave a bowl out. In the morning it is empty and you know more than you did. You do not remember learning it.",
    category: "hunger",
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "insight", amount: 4 }],
    progressRequired: 20,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "lore", amount: 1.2 },
      { type: "add_resource", resourceId: "insight", amount: 0.8 },
      { type: "add_resource", resourceId: "insanity", amount: 0.6 }
    ],
    prerequisites: [{ taskId: "hunger_extract", minLevel: 3 }],
    maxExecutions: 10
  }
];

export const ACTIONS: ActionConfig[] = [
  // - THE FIRST CHOICE - (remains in 'strange', now with deeper consequences)
  {
    id: "trust_cat",
    name: "Trust the Cat",
    description: "You stop asking whether it is real. The cat flicks its tail - approval, or amusement - and the air behind it seems to crease like paper. 'Follow,' it seems to say. You say yes before you can rehearse doubt.",
    category: "strange",
    costs: [{ resourceId: "lore", amount: 5 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "insight", amount: 15 },
      { type: "add_resource", resourceId: "insight", amount: 6 },
      { type: "modify_max_resource_flat", resourceId: "threads", amount: 10 },
      { type: "add_resource", resourceId: "threads", amount: 3 },
      { type: "modify_max_resource_flat", resourceId: "insanity", amount: 3 }
    ],
    prerequisites: [{ resourceId: "lore", minAmount: 5 }],
    maxExecutions: 1,
    exclusiveWith: ["reject_cat", "exploit_cat"],
    logMessage: "The cat blinks slowly. The hallway is suddenly longer.",
    lockDescription: "Choosing Faith closes Denial and Hunger."
  },
  {
    id: "reject_cat",
    name: "Reject the Cat",
    description: "You tell it - and yourself - that cats do not talk, walls do not breathe, and you are tired. You drag the bookshelf against the patched plaster. The cat watches without blinking. 'As you wish,' its silence says.",
    category: "strange",
    costs: [{ resourceId: "lore", amount: 5 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "insight", amount: 15 },
      { type: "add_resource", resourceId: "insight", amount: 2 },
      { type: "modify_max_resource_flat", resourceId: "ashes", amount: 10 },
      { type: "add_resource", resourceId: "ashes", amount: 4 },
      { type: "add_resource", resourceId: "insanity", amount: -1 }
    ],
    prerequisites: [{ resourceId: "lore", minAmount: 5 }],
    maxExecutions: 1,
    exclusiveWith: ["trust_cat", "exploit_cat"],
    logMessage: "You seal the wall. The apartment feels smaller, and safer, and emptier.",
    lockDescription: "Choosing Denial closes Faith and Hunger."
  },
  {
    id: "exploit_cat",
    name: "Exploit the Cat",
    description: "You crouch to its level and smile the way you smile at customers. 'You know things,' you whisper. 'Teach me how to use them.' The cat's eyes narrow to bored crescents. It has seen this before.",
    category: "strange",
    costs: [{ resourceId: "lore", amount: 5 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "insight", amount: 15 },
      { type: "add_resource", resourceId: "insight", amount: 4 },
      { type: "add_resource", resourceId: "money", amount: 25 },
      { type: "modify_yield_pct", actionId: "exploit_cat", amount: 0.1, resourceId: "lore", hidden: true }
    ],
    prerequisites: [{ resourceId: "lore", minAmount: 5 }],
    maxExecutions: 1,
    exclusiveWith: ["trust_cat", "reject_cat"],
    logMessage: "The cat yawns, showing too many teeth. A deal, then. Not a friendship.",
    lockDescription: "Choosing Hunger closes Faith and Denial."
  },

  // - FAITH FOLLOW-UPS -
  {
    id: "faith_drink_milk",
    name: "Drink the Milk It Offers",
    description: "A saucer appears where there was no saucer. The milk is warm and faintly phosphorescent. 'For the road,' the cat implies. Your reflection in the surface has eyes that are not quite yours.",
    category: "faith",
    costs: [
      { resourceId: "threads", amount: 5 },
      { resourceId: "insight", amount: 3 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 6 },
      { type: "add_resource", resourceId: "health", amount: 6 },
      { type: "modify_yield_pct", taskId: "faith_alley_walk", amount: 0.3 },
      { type: "add_item", itemId: "milk_light", amount: 1 }
    ],
    prerequisites: [{ taskId: "faith_alley_walk", minLevel: 2 }],
    maxExecutions: 1,
    logMessage: "You drink. The city tastes suddenly of copper and rain on hot stone.",
    locks: ["faith_offer_shelter"]
  },
  {
    id: "faith_offer_shelter",
    name: "Offer It Shelter",
    description: "You move the laundry, clear the closet, lay down something soft. An invitation, not a trap. The cat circles once, kneads the air, and decides you will do. The apartment exhales.",
    category: "faith",
    costs: [
      { resourceId: "threads", amount: 8 },
      { resourceId: "money", amount: 40 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "threads", amount: 12 },
      { type: "modify_passive_gen", resourceId: "threads", amount: 0.05 },
      { type: "add_item", itemId: "nest_threads", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "increase_max_tasks", amount: 1 }],
    prerequisites: [{ taskId: "faith_alley_walk", minLevel: 2 }],
    maxExecutions: 1,
    locks: ["faith_drink_milk"],
    logMessage: "You now have room for one more thing at once. Or one more self."
  },
  {
    id: "faith_become_stray",
    name: "Become a Stray Yourself",
    description: "You stop locking the door. You learn which dumpsters breathe heat, which eaves hide from wind. The cat walks beside you now, not ahead. Some nights you forget how to speak and do not mind.",
    category: "faith",
    costs: [
      { resourceId: "threads", amount: 12 },
      { resourceId: "insight", amount: 10 }
    ],
    effects: [
      { type: "modify_yield_pct", taskId: "faith_alley_walk", amount: 0.5 },
      { type: "modify_max_resource_flat", resourceId: "insanity", amount: 6 },
      { type: "add_resource", resourceId: "insanity", amount: 2 },
      { type: "add_item", itemId: "stray_collar", amount: 1 }
    ],
    prerequisites: [{ actionId: "faith_drink_milk", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["faith_become_keeper"],
    logMessage: "You belong to the alleys now. The alleys belong to you. Fair trade.",
    lockDescription: "Feral or Keeper - you cannot be both."
  },
  {
    id: "faith_become_keeper",
    name: "Become the Keeper of the Threshold",
    description: "You keep the door ajar, not open. You learn the etiquette of thresholds: what to invite, what to turn away, how to say 'not you' without cruelty. The cat approves of boundaries, when they are yours.",
    category: "faith",
    costs: [
      { resourceId: "threads", amount: 12 },
      { resourceId: "insight", amount: 10 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 10 },
      { type: "modify_passive_gen", resourceId: "threads", amount: 0.08 },
      { type: "add_item", itemId: "keeper_key", amount: 1 }
    ],
    prerequisites: [{ actionId: "faith_offer_shelter", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["faith_become_stray"],
    logMessage: "You hold the line. Something holds it with you.",
    lockDescription: "Keeper or Stray - you cannot be both."
  },

  // - DENIAL FOLLOW-UPS -
  {
    id: "denial_seal_wall",
    name: "Seal the Wall with Concrete",
    description: "You buy quick-set, trowel, respirator. You work with the focus of someone who will not be fooled again. The wall becomes very, very solid. Too solid. The room sounds different now, like a held breath.",
    category: "denial",
    costs: [
      { resourceId: "ashes", amount: 6 },
      { resourceId: "money", amount: 35 }
    ],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 8 },
      { type: "add_resource", resourceId: "health", amount: 4 },
      { type: "modify_yield_pct", taskId: "denial_routine", amount: 0.35 }
    ],
    prerequisites: [{ taskId: "denial_routine", minLevel: 3 }],
    maxExecutions: 1,
    locks: ["denial_burn_notes"],
    logMessage: "The wall is sealed. The scratching learns to be patient."
  },
  {
    id: "denial_burn_notes",
    name: "Burn Your Notes Thoroughly",
    description: "Every scrap with a paw-print margin, every dream you shouldn't have written down. You burn them in the sink and watch the paper curl into hands. The ashes are lighter than air and then, suddenly, not.",
    category: "denial",
    costs: [
      { resourceId: "ashes", amount: 8 },
      { resourceId: "lore", amount: 3 }
    ],
    effects: [
      { type: "add_resource", resourceId: "ashes", amount: 5 },
      { type: "modify_max_resource_flat", resourceId: "ashes", amount: 10 },
      { type: "add_resource", resourceId: "insanity", amount: -2 },
      { type: "add_item", itemId: "urn_ashes", amount: 1 }
    ],
    prerequisites: [{ taskId: "denial_routine", minLevel: 3 }],
    maxExecutions: 1,
    locks: ["denial_seal_wall"],
    logMessage: "Ashes in the sink. Ashes on your hands. Ashes nowhere you can see, afterwards."
  },
  {
    id: "denial_forget",
    name: "Try to Forget, Properly",
    description: "You commit to forgetting as a practice. You do not look at the patched wall. You do not listen after eleven. You get good at not listening. It is a skill now.",
    category: "denial",
    costs: [
      { resourceId: "ashes", amount: 14 },
      { resourceId: "money", amount: 20 }
    ],
    effects: [
      { type: "add_resource", resourceId: "insanity", amount: -4 },
      { type: "modify_max_resource_flat", resourceId: "insanity", amount: -4 },
      { type: "reset_resource_modifiers", resourceId: "lore", amount: 1, hidden: true }
    ],
    prerequisites: [{ actionId: "denial_seal_wall", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["denial_remember"],
    logMessage: "For a while, you succeed. The apartment is just an apartment.",
    lockDescription: "Forgetting and remembering cannot coexist."
  },
  {
    id: "denial_remember",
    name: "Admit You Remember",
    description: "You stop sealing. You leave the notebook open. You write: 'It was a cat. I pretended it wasn't. I am done pretending.' The writing is shaky. The cat - wherever it is - purrs, once, through the wall.",
    category: "denial",
    costs: [
      { resourceId: "ashes", amount: 10 },
      { resourceId: "insight", amount: 6 }
    ],
    effects: [
      { type: "add_resource", resourceId: "lore", amount: 8 },
      { type: "modify_max_resource_flat", resourceId: "lore", amount: 10 },
      { type: "add_resource", resourceId: "insight", amount: 5 },
      { type: "add_item", itemId: "remembered_note", amount: 1 }
    ],
    prerequisites: [{ actionId: "denial_burn_notes", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["denial_forget"],
    logMessage: "Remembering is heavier than forgetting was. It is also more honest.",
    lockDescription: "Remembering and forgetting cannot coexist."
  },

  // - HUNGER FOLLOW-UPS -
  {
    id: "hunger_interrogate",
    name: "Press for True Names",
    description: "You ask sharper questions. Where does the milk come from? What is on the other side of the alley? The cat answers in proportion to pressure and then, suddenly, out of proportion. You learn a name you did not ask for. It is yours, but older.",
    category: "hunger",
    costs: [
      { resourceId: "insight", amount: 6 },
      { resourceId: "lore", amount: 4 }
    ],
    effects: [
      { type: "modify_yield_pct", taskId: "hunger_extract", amount: 0.4 },
      { type: "modify_yield_flat", taskId: "hunger_harvest", amount: 0.4, resourceId: "insight" },
      { type: "add_resource", resourceId: "insanity", amount: 1.5 }
    ],
    prerequisites: [{ taskId: "hunger_extract", minLevel: 2 }],
    maxExecutions: 1,
    logMessage: "A name settles behind your teeth like a coin."
  },
  {
    id: "hunger_sell_secret",
    name: "Sell a Secret Downtown",
    description: "There is a man at the night market who buys not-things. You describe the alley that is longer inside than out. He pays in used bills and does not blink enough. You feel lighter and slightly stolen.",
    category: "hunger",
    costs: [
      { resourceId: "lore", amount: 8 },
      { resourceId: "insight", amount: 4 }
    ],
    effects: [
      { type: "add_resource", resourceId: "money", amount: 120 },
      { type: "modify_max_resource_flat", resourceId: "money", amount: 60 }
    ],
    prerequisites: [{ actionId: "hunger_interrogate", minExecutions: 1 }],
    maxExecutions: 2,
    logMessage: "Money is how the city says 'I don't need to understand you.'"
  },
  {
    id: "hunger_bind_cat",
    name: "Bind the Cat to Service",
    description: "Thread, ash, a saucer. Words you learned without learning. You draw a circle that is also a promise and ask the cat to stay. It considers. The air gets contractual.",
    category: "hunger",
    costs: [
      { resourceId: "insight", amount: 14 },
      { resourceId: "lore", amount: 10 },
      { resourceId: "money", amount: 50 }
    ],
    effects: [
      { type: "add_item", itemId: "bound_whisker", amount: 1 },
      { type: "modify_passive_gen", resourceId: "lore", amount: 0.06 },
      { type: "modify_yield_pct", taskId: "hunger_extract", amount: 0.6 }
    ],
    firstCompletionEffects: [{ type: "increase_max_tasks", amount: 1 }],
    prerequisites: [{ actionId: "hunger_sell_secret", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["hunger_release_cat"],
    logMessage: "It stays. You are not sure you wanted it to.",
    lockDescription: "Binding and releasing cannot both happen."
  },
  {
    id: "hunger_release_cat",
    name: "Release the Cat, Paid in Full",
    description: "You open every window, sweep the circle away, pour the milk into the sink. 'Go,' you say, and mean it. 'Keep what you took. We are even.' For the first time, the cat looks surprised.",
    category: "hunger",
    costs: [
      { resourceId: "insight", amount: 12 },
      { resourceId: "lore", amount: 8 },
      { resourceId: "money", amount: 30 }
    ],
    effects: [
      { type: "add_resource", resourceId: "insanity", amount: -3 },
      { type: "modify_max_resource_flat", resourceId: "health", amount: 8 },
      { type: "add_item", itemId: "final_whisker", amount: 1 },
      { type: "modify_yield_pct", taskId: "hunger_harvest", amount: 0.8 }
    ],
    prerequisites: [{ actionId: "hunger_sell_secret", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["hunger_bind_cat"],
    logMessage: "The apartment is quiet in a different way. Proud, maybe.",
    lockDescription: "Releasing and binding cannot both happen."
  }
];

export const ITEMS: ItemConfig[] = [
  {
    id: "milk_light",
    name: "Saucer of Light-Milk",
    description: "Warm. It reflects a hallway that is not yours. Drinking it once changed how time sits in your mouth.",
    slot: "accessory",
    effects: [{ type: "modify_yield_pct", taskId: "faith_alley_walk", amount: 0.15 }]
  },
  {
    id: "nest_threads",
    name: "Nest of Threads",
    description: "A closet lined with the city's soft excess - lint, cobweb, unsent letters felted together. Something sleeps here with you, lightly.",
    slot: "body",
    effects: [{ type: "modify_passive_gen", resourceId: "threads", amount: 0.04 }]
  },
  {
    id: "stray_collar",
    name: "Stray's Collar",
    description: "Not yours, not not yours. It smells of rain and alleys that don't appear on maps.",
    slot: "accessory",
    effects: [
      { type: "modify_yield_pct", taskId: "faith_alley_walk", amount: 0.25 },
      { type: "modify_max_resource_flat", resourceId: "insanity", amount: 4 }
    ]
  },
  {
    id: "keeper_key",
    name: "Threshold Key",
    description: "Heavy, uncut, warm from a pocket. It does not open anything you own. It keeps things closed, which is more important.",
    slot: "accessory",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 6 },
      { type: "modify_passive_gen", resourceId: "threads", amount: 0.03 }
    ]
  },
  {
    id: "urn_ashes",
    name: "Small Urn of Ashes",
    description: "You kept some, despite yourself. It shifts when you aren't looking.",
    slot: "accessory",
    effects: [{ type: "modify_yield_pct", taskId: "denial_routine", amount: 0.2 }]
  },
  {
    id: "remembered_note",
    name: "Remembered Note",
    description: "'It was a cat.' Your handwriting, but the ink is not ink you remember buying.",
    slot: "accessory",
    effects: [{ type: "modify_max_resource_flat", resourceId: "lore", amount: 6 }]
  },
  {
    id: "bound_whisker",
    name: "Bound Whisker",
    description: "A single whisker, bound with thread. It vibrates faintly, as if proofreading the air.",
    slot: "accessory",
    effects: [{ type: "modify_yield_pct", taskId: "hunger_extract", amount: 0.3 }]
  },
  {
    id: "final_whisker",
    name: "Freed Whisker",
    description: "Given, not taken. Lighter than the other one. It hums when you are kind.",
    slot: "accessory",
    effects: [
      { type: "modify_max_resource_flat", resourceId: "health", amount: 5 },
      { type: "modify_yield_pct", taskId: "hunger_harvest", amount: 0.3 }
    ]
  }
];
