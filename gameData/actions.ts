import { ActionConfig } from "../types";

export const ACTIONS: ActionConfig[] = [
  // --- BASIC MUNDANE ---
  {
    id: "open_bank",
    name: "Open Savings Account",
    description: "A small recurring interest payment, and the ability to store more money..",
    category: "mundane",
    costs: [{ resourceId: 'money', amount: 25 }],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'money', amount: 25 },
      { type: 'modify_passive_gen', resourceId: 'money', amount: 0.05 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 25 }],
    maxExecutions: 1
  },
  {
    id: "invest_bank",
    name: "Investment Portfolio",
    description: "Invest your hard earned money for steady returns.",
    category: "mundane",
    costs: [{ resourceId: 'money', amount: 250 }],
    effects: [
      { type: 'modify_passive_gen', resourceId: 'money', amount: 0.5 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 250 }],
    maxExecutions: 1
  },
  {
    id: "clean_app",
    name: "Clean Apartment",
    description: "Clean up your apartment. Keep a sense of normalcy.",
    category: "mundane",
    costs: [{ resourceId: 'stamina', amount: 1, scaleFactor: 1 }],
    effects: [
      { type: 'add_resource', resourceId: 'sanity', amount: 1 },
      { type: 'add_resource', resourceId: 'money', amount: 1, chance: 0.05, hidden: true }
    ],
    logMessage: "You tidied up. The chaos recedes, briefly."
  },
  {
    id: "ask_promotion",
    name: "Demand Promotion",
    description: "You've worked here long enough. Demand a better position.",
    category: "mundane",
    costs: [{ resourceId: 'reputation', amount: 1 }], // Requires some social standing
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'money', amount: 10 },
      { type: 'add_resource', resourceId: 'money', amount: 25 }
    ],
    maxExecutions: 1,
    prerequisites: [{ taskId: 'grind_9to5', minLevel: 5 }],
    locks: ['grind_9to5'], // Replaces the old job
    logMessage: "Promotion granted. Welcome to middle management."
  },
  {
    id: "visit_therapist",
    name: "Therapy Session",
    description: "Expensive, but helpful at keeping the voices at bay.",
    category: "mundane",
    costs: [{ resourceId: 'money', amount: 50 }],
    effects: [{ type: 'add_resource', resourceId: 'sanity', amount: 5 }],
    prerequisites: [{ taskId: 'doom_scroll', minExecutions: 50 }],
    firstCompletionEffects: [{ type: 'modify_max_resource_flat', resourceId: 'sanity', amount: 2 }],
    locks: ['doom_scroll'],
    lockDescription: "No more doomscrolling."
  },
  {
    id: "buy_occult_book",
    name: "Visit Antique Bookstore",
    description: "Cozy, quaint and home to a plethora of occult books.",
    category: "mundane",
    costs: [{ resourceId: 'money', amount: 25, scaleFactor: 1.25 }],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'lore', amount: 1 }],
    firstCompletionEffects: [{ type: 'modify_max_resource_flat', resourceId: 'occult_book', amount: 1 }],
    maxExecutions: 5,
    prerequisites: [{ resourceId: 'money', minAmount: 10 }],
  },
  {
    id: "training_gym",
    name: "Go the the Gym",
    description: "Increase Max Stamina and Health.",
    category: "mundane",
    costs: [
      { resourceId: 'money', amount: 15, scaleFactor: 1.5 },
      { resourceId: 'stamina', amount: 10, scaleFactor: 2, scaleType: 'fixed' }
    ],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'stamina', amount: 2 },
      { type: 'modify_max_resource_flat', resourceId: 'health', amount: 2 }
    ],
    prerequisites: [{ resourceId: 'money', minAmount: 10 }],
    maxExecutions: 20
  },
  {
    id: "meditation_course",
    name: "Mindfulness Course",
    description: "Increase Max Sanity.",
    category: "mundane",
    costs: [{ resourceId: 'money', amount: 40, scaleFactor: 1.5 }],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'sanity', amount: 1 }],
    prerequisites: [{ resourceId: 'money', minAmount: 20 }],
    maxExecutions: 5
  },
  {
    id: "learn_multitasking",
    name: "Multitasking Training",
    description: "Train your brain to handle more concurrent threads.",
    category: "mundane",
    costs: [
      { resourceId: 'insight', amount: 10 },
      { resourceId: 'stamina', amount: 20 }
    ],
    effects: [
      { type: 'increase_max_tasks', amount: 1 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'insight', minAmount: 5 }]
  },
  // --- RESEARCH & UNLOCKS ---
  {
    id: "pierce_veil",
    name: "Ritual: Pierce the Veil",
    description: "Use Insight to permanently unlock Magic (Mana).",
    category: "research",
    costs: [
      { resourceId: 'insight', amount: 2 },
      { resourceId: 'lore', amount: 20 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'mana', amount: 25 }],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'lore', minAmount: 15 }]
  },
  {
    id: "awaken_biomass",
    name: "Study Alien Tissue",
    description: "Understand the flesh. Unlocks Biomass collection.",
    category: "research",
    costs: [
      { resourceId: 'lore', amount: 40 },
      { resourceId: 'insight', amount: 3 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'biomass', amount: 10 }],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'mana', minMax: 1 }]
  },

  // --- CULT ACTIONS ---
  {
    id: "recruit_acolyte",
    name: "Recruit Acolyte",
    description: "Convince a lost soul to follow you. Costs Reputation.",
    category: "cult",
    costs: [
      { resourceId: 'reputation', amount: 0.5, scaleFactor: 1.2 },
      { resourceId: 'money', amount: 10 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'acolytes', amount: 1 }],
    maxExecutions: 50,
    prerequisites: [{ resourceId: 'reputation', minMax: 1 }, { actionId: "found_cult", minExecutions: 1 }]
  },
  {
    id: "found_cult",
    name: "Found the Order",
    description: "Establish a formal organization. Unlocks Acolytes.",
    category: "research",
    costs: [
      { resourceId: 'lore', amount: 50 },
      { resourceId: 'money', amount: 100 }
    ],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'acolytes', amount: 2 },
      { type: 'modify_max_resource_flat', resourceId: 'reputation', amount: 2 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'mana', minAmount: 10 }]
  },
  {
    id: "build_indoctrination",
    name: "Indoctrination Chamber",
    description: "Brainwash them thoroughly. Increases Sanity Cap significantly.",
    category: "cult",
    costs: [
      { resourceId: 'money', amount: 400 },
      { resourceId: 'acolytes', amount: 10 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'sanity', amount: 20 }],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'acolytes', minAmount: 10 }]
  },

  // --- RITUAL UPGRADES ---
  {
    id: "expand_mind",
    name: "Expand Consciousness",
    description: "Uses Mana to permanently increase Insight Cap.",
    category: "rituals",
    costs: [
      { resourceId: 'mana', amount: 50, scaleFactor: 1.5 },
      { resourceId: 'sanity', amount: 8 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'insight', amount: 1 }],
    maxExecutions: 5,
    prerequisites: [{ resourceId: 'mana', minAmount: 15 }]
  },

  // --- MUTATION SLOTS ---
  {
    id: "surgery_eye",
    name: "Trepanation",
    description: "Drill a hole in the skull to let the Third Eye breathe.",
    category: "mutations",
    costs: [
      { resourceId: 'health', amount: 9 }, // Very dangerous if Max is 10
      { resourceId: 'insight', amount: 4 }
    ],
    effects: [
      { type: 'add_item', itemId: 'void_lens', amount: 1 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'biomass', minAmount: 5 }]
  },
  {
    id: "surgery_tentacle",
    name: "Graft Symbiote",
    description: "Attach the writhing mass to your spine.",
    category: "mutations",
    costs: [
      { resourceId: 'biomass', amount: 50 },
      { resourceId: 'mana', amount: 50 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'biomass', amount: 5 }],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'biomass', minAmount: 20 }]
  },
  {
    id: "surgery_cortex",
    name: "Cerebral Expansion",
    description: "Inject void-fluid into the brain stem. Unlocks Cortex slot.",
    category: "mutations",
    costs: [
      { resourceId: 'insight', amount: 5 },
      { resourceId: 'sanity', amount: 9 }
    ],
    effects: [],
    maxExecutions: 1,
    prerequisites: [{ actionId: 'surgery_eye', minExecutions: 1 }]
  },

  // --- CLASS PATHS (EXCLUSIVE) ---
  {
    id: "path_weaver",
    name: "Class: Weaver of the Void",
    description: "Abandon your humanity for cosmic power. +200% Mana, locks 'Architect'.",
    category: "paths",
    costs: [
      { resourceId: 'insight', amount: 10 },
      { resourceId: 'mana', amount: 100 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'mana', amount: 2.0 },
      { type: 'modify_max_resource_pct', resourceId: 'health', amount: -0.2 }],
    maxExecutions: 1,
    locks: ["path_architect"],
    lockDescription: "You may not take another path of this level... Choose wisely.",
    prerequisites: [{ actionId: 'surgery_eye', minExecutions: 1 }]
  },
  {
    id: "path_architect",
    name: "Class: Architect of Flesh",
    description: "Become a perfect organism. +200% Health, locks 'Weaver'.",
    category: "paths",
    costs: [
      { resourceId: 'biomass', amount: 100 },
      { resourceId: 'health', amount: 80 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'health', amount: 2.0 },
      { type: 'modify_max_resource_pct', resourceId: 'sanity', amount: -0.5 }
    ],
    maxExecutions: 1,
    locks: ["path_weaver"],
    lockDescription: "You may not take another path of this level... Choose wisely.",
    prerequisites: [{ actionId: 'surgery_tentacle', minExecutions: 1 }]
  },

  // --- POST-CLASS PROGRESSION ---
  {
    id: "unlock_void_matter",
    name: "Condense Void",
    description: "Learn to solidify the darkness. (Weaver)",
    category: "domain",
    costs: [{ resourceId: 'mana', amount: 400 }],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'void_matter', amount: 5 }],
    maxExecutions: 1,
    prerequisites: [{ actionId: 'path_weaver', minExecutions: 1 }]
  },
  {
    id: "unlock_living_flesh",
    name: "Synthesize Living Flesh",
    description: "Flesh that never dies. (Architect)",
    category: "domain",
    costs: [{ resourceId: 'biomass', amount: 400 }],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'living_flesh', amount: 5 }],
    maxExecutions: 1,
    prerequisites: [{ actionId: 'path_architect', minExecutions: 1 }]
  },
  {
    id: "create_sanctum",
    name: "Sanctum of Silence",
    description: "A tower to house your body. Massive Mana boost. (Weaver)",
    category: "domain",
    costs: [
      { resourceId: 'void_matter', amount: 2, scaleFactor: 1.2 },
      { resourceId: 'mana', amount: 1000, scaleFactor: 1.1 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'mana', amount: 200 }],
    maxExecutions: 10,
    prerequisites: [{ resourceId: 'void_matter', minMax: 1 }]
  },
  {
    id: "create_cathedral",
    name: "Cathedral of Bone",
    description: "Your flesh spreads to the walls. Massive Biomass boost. (Architect)",
    category: "domain",
    costs: [
      { resourceId: 'living_flesh', amount: 2, scaleFactor: 1.2 },
      { resourceId: 'biomass', amount: 1000, scaleFactor: 1.1 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'biomass', amount: 200 }],
    maxExecutions: 10,
    prerequisites: [{ resourceId: 'living_flesh', minMax: 1 }]
  },

  // --- ENDGAME ---
  {
    id: "unlock_souls",
    name: "Breach the Soul Barrier",
    description: "The ultimate taboo. Unlock Soul collection.",
    category: "domain",
    costs: [
      { resourceId: 'insight', amount: 20 },
      { resourceId: 'sanity', amount: 9 }
    ],
    effects: [{ type: 'modify_max_resource_flat', resourceId: 'soul_fragments', amount: 2 }],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'insight', minAmount: 10 }]
  },

  // --- ASCENSION (Tier 6) ---
  {
    id: "transcend_flesh",
    name: "Transcend Flesh",
    description: "Leave your body behind. Unlocks Cosmic Truth.",
    category: "ascension",
    costs: [
      { resourceId: 'soul_fragments', amount: 10 },
      { resourceId: 'health', amount: 200 } // Impossible without upgrades
    ],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'cosmic_truth', amount: 1 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'soul_fragments', minAmount: 1 }]
  },

  // --- EARLY BRANCHING PATHS (Tier 1.5) ---
  {
    id: "path_scholar",
    name: "Path: The Scholar",
    description: "Dedicate yourself to knowledge.",
    category: "patresearchhs",
    costs: [
      { resourceId: 'lore', amount: 20 },
      { resourceId: 'money', amount: 50 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'lore', amount: 0.5 },
      { type: 'modify_passive_gen', resourceId: 'money', amount: 0.1 }
    ],
    maxExecutions: 1,
    locks: ['path_predator', 'path_cultist'],
    lockDescription: "You may not take another path of this level... Choose wisely.",
    prerequisites: [{ resourceId: 'lore', minAmount: 10 }]
  },
  {
    id: "path_predator",
    name: "Path: The Predator",
    description: "Embrace your primal nature.",
    category: "research",
    costs: [
      { resourceId: 'stamina', amount: 15 },
      { resourceId: 'health', amount: 5 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'health', amount: 0.25 },
      { type: 'modify_max_resource_pct', resourceId: 'stamina', amount: 0.25 }],
    maxExecutions: 1,
    locks: ['path_cultist', 'path_scholar'],
    lockDescription: "You may not take another path of this level... Choose wisely.",
    prerequisites: [{ taskId: 'grind_9to5', minLevel: 5 }, { resourceId: 'stamina', minAmount: 11 }]
  },
  {
    id: "path_cultist",
    name: "Path: The Cultist",
    description: "Manipulate the masses.",
    category: "research",
    costs: [
      { resourceId: 'reputation', amount: 1 },
      { resourceId: 'sanity', amount: 3 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'reputation', amount: 0.5 },
      { type: 'modify_max_resource_flat', resourceId: 'acolytes', amount: 1 }
    ],
    maxExecutions: 1,
    locks: ['path_predator', 'path_scholar'],
    lockDescription: "You may not take another path of this level... Choose wisely.",
    prerequisites: [{ resourceId: 'reputation', minAmount: 1 }]
  },

  // --- ADDITIONAL MUTATIONS ---
  {
    id: "surgery_skin",
    name: "Dermal Metamorphosis",
    description: "Your skin hardens and shifts. Unlocks the Dermis mutation slot.",
    category: "mutations",
    costs: [
      { resourceId: 'biomass', amount: 75 },
      { resourceId: 'health', amount: 8 }
    ],
    effects: [
      { type: 'modify_max_resource_flat', resourceId: 'health', amount: 10 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'biomass', minAmount: 30 }]
  },

  // --- NEW UPGRADES ---
  {
    id: "mind_partition",
    name: "Mind Partitioning",
    description: "Split your consciousness to handle more simultaneously.",
    category: "research",
    costs: [
      { resourceId: 'insight', amount: 20 },
      { resourceId: 'sanity', amount: 20 }
    ],
    effects: [
      { type: 'increase_max_tasks', amount: 1 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'insight', minAmount: 15 }]
  },
  {
    id: "forbidden_pact",
    name: "Forbidden Pact",
    description: "Sign away part of your sanity for immense magical potential.",
    category: "rituals",
    costs: [
      { resourceId: 'sanity', amount: 8 },
      { resourceId: 'mana', amount: 100 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'mana', amount: 1.0 },
      { type: 'modify_max_resource_pct', resourceId: 'sanity', amount: -0.25 }
    ],
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'mana', minAmount: 50 }]
  },
  {
    id: "sacrifice_humanity",
    name: "Sacrifice Your Humanity",
    description: "There is no going back. Lock mundane life for immense power.",
    category: "ascension",
    costs: [
      { resourceId: 'insight', amount: 15 },
      { resourceId: 'biomass', amount: 100 },
      { resourceId: 'mana', amount: 200 }
    ],
    effects: [
      { type: 'modify_max_resource_pct', resourceId: 'health', amount: 1.0 },
      { type: 'modify_max_resource_pct', resourceId: 'mana', amount: 1.0 },
      { type: 'modify_max_resource_pct', resourceId: 'stamina', amount: 0.5 }
    ],
    locks: ['grind_9to5', 'manager_job', 'attend_gala', 'visit_therapist'],
    lockDescription: "You can no longer pretend to be human.",
    maxExecutions: 1,
    prerequisites: [{ resourceId: 'biomass', minAmount: 50 }, { resourceId: 'mana', minAmount: 100 }],
    logMessage: "Your humanity slips away like a forgotten dream."
  }
];

