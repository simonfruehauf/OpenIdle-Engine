import { TaskConfig } from "../types";

export const TASKS: TaskConfig[] = [
  // --- TIER 0: MUNDANE ---
  {
    id: "sleep",
    name: "Fitful Sleep",
    description: "Rest your body and mind. Recover Stamina, Sanity, and Health.",
    category: "mundane",
    type: "rest",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: 'add_resource', resourceId: 'stamina', amount: 1 },
      { type: 'add_resource', resourceId: 'sanity', amount: 0.5 },
      { type: 'add_resource', resourceId: 'health', amount: 0.2 }
    ],
    xpPerSecond: 1
  },
  {
    id: "meditate",
    name: "Meditate",
    description: "Clear your mind and find inner peace. Recover Stamina and Sanity.",
    category: "mundane",
    type: "rest",
    progressRequired: 5,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: 'add_resource', resourceId: 'stamina', amount: 0.5, scaleFactor: 0.9 },
      { type: 'add_resource', resourceId: 'sanity', amount: 1, scaleFactor: 0.9 },
    ],
    xpPerSecond: 2,
    prerequisites: [{ resourceId: 'sanity', minMax: 15 }]
  },
  {
    id: "doom_scroll",
    name: "Doomscroll",
    description: "Browse obscure forums late into the night. Drains stamina, but you find things.",
    category: "mundane",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
        { resourceId: 'stamina', amount: 0.5 },
        { resourceId: 'sanity', amount: 0.5 }
    ],
    effectsPerSecond: [
        { type: 'add_resource', resourceId: 'lore', amount: 0.05 }
    ],
    xpPerSecond: 2,
    drops: [{ itemId: 'notebook', chancePerSecond: 0.001 }]
  },
  {
    id: "grind_9to5",
    name: "Work Shift",
    description: "Exchange life for currency. Soul-crushing.",
    category: "mundane",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
      { resourceId: 'stamina', amount: 0.5 },
      { resourceId: 'sanity', amount: 0.1 }
    ],
    effectsPerSecond: [
      { type: 'add_resource', resourceId: 'money', amount: 0.5, scaleFactor: 1.02 }
    ],
    xpPerSecond: 5,
    drops: [{ itemId: 'coffee_thermos', chancePerSecond: 0.005 }]
  },
  {
    id: "manager_job",
    name: "Work Manager Shift",
    description: "A cozy office, better pay, slightly less soul-crushing. You sold out.",
    category: "mundane",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
        { resourceId: 'stamina', amount: 0.2 },
    ],
    effectsPerSecond: [
        { type: 'add_resource', resourceId: 'money', amount: 1.5, scaleFactor: 1.02 },
        { type: 'add_resource', resourceId: 'reputation', amount: 0.001 }
    ],
    xpPerSecond: 5,
    prerequisites: [{ actionId: 'ask_promotion' }]
  },
  {
      id: "attend_gala",
      name: "Attend Social Gala",
      description: "Rub shoulders with the elite to build connections.",
      category: "mundane",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'money', amount: 2 }, 
          { resourceId: 'stamina', amount: 0.5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'reputation', amount: 0.02 }
      ],
      xpPerSecond: 8,
      prerequisites: [{ resourceId: 'money', minAmount: 25 }]
  },

  // --- TIER 1: RESEARCH ---
  {
    id: "study_notes",
    name: "Decipher Scrawlings",
    description: "Make sense of the patterns. Costs Sanity.",
    category: "research",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
      { resourceId: 'stamina', amount: 0.2 },
      { resourceId: 'sanity', amount: 0.2 }
    ],
    effectsPerSecond: [
      { type: 'add_resource', resourceId: 'lore', amount: 0.2, scaleFactor: 1.01 }
    ],
    xpPerSecond: 10,
    drops: [{ itemId: 'notebook', chancePerSecond: 0.01 }],
    prerequisites: [{ resourceId: 'lore', minMax: 1 }]
  },
  {
    id: "analyze_artifact",
    name: "Analyze Artifact",
    description: "A focused study session of an ancient object. Takes time to complete.",
    category: "research",
    startCosts: [{ resourceId: 'money', amount: 10 }],
    progressRequired: 10, 
    autoRestart: false, 
    costPerSecond: [
        { resourceId: 'stamina', amount: 1 }
    ],
    effectsPerSecond: [],
    completionEffects: [
        { type: 'add_resource', resourceId: 'lore', amount: 10 }
    ],
    firstCompletionEffects: [
        { type: 'add_resource', resourceId: 'insight', amount: 1 }
    ],
    prerequisites: [{ resourceId: 'lore', minAmount: 10 }]
  },
  {
      id: "lucid_dreaming",
      name: "Lucid Dreaming",
      description: "Control the narrative. Safer than walking, but less yielding.",
      category: "research",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'stamina', amount: 0.5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'insight', amount: 0.01 },
          { type: 'add_resource', resourceId: 'sanity', amount: 0.1 }
      ],
      xpPerSecond: 12,
      prerequisites: [{ resourceId: 'insight', minMax: 1 }]
  },
  {
      id: "transcribe_tomes",
      name: "Transcribe Tomes",
      description: "Sell your knowledge to wealthy collectors.",
      category: "research",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'lore', amount: 0.5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'money', amount: 1.5 }
      ],
      xpPerSecond: 15,
      prerequisites: [{ resourceId: 'lore', minAmount: 8 }]
  },
  {
    id: "dream_walking",
    name: "Dream Walking",
    description: "Project your mind into the Astral. High risk.",
    category: "research",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
      { resourceId: 'sanity', amount: 1 }
    ],
    effectsPerSecond: [
      { type: 'add_resource', resourceId: 'insight', amount: 0.01 }
    ],
    xpPerSecond: 20,
    prerequisites: [{ resourceId: 'lore', minAmount: 15 }]
  },

  // --- TIER 2: RITUALS ---
  {
    id: "meditate_void",
    name: "Channel the Void",
    description: "Regenerate Mana by letting the cold in.",
    category: "rituals",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
        { resourceId: 'sanity', amount: 0.2 }
    ],
    effectsPerSecond: [
        { type: 'add_resource', resourceId: 'mana', amount: 0.5, scaleFactor: 1.02 }
    ],
    xpPerSecond: 15,
    drops: [{ itemId: 'amulet_calm', chancePerSecond: 0.005 }],
    prerequisites: [{ resourceId: 'mana', minMax: 1 }]
  },
  {
      id: "chalk_warding",
      name: "Chalk Wardings",
      description: "Draw protective circles. Slows madness.",
      category: "rituals",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'mana', amount: 0.1 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'sanity', amount: 0.5 }
      ],
      xpPerSecond: 10,
      prerequisites: [{ resourceId: 'mana', minMax: 1 }]
  },
  {
    id: "bloodletting",
    name: "Blood Sacrifice",
    description: "Convert Health directly into Mana and Biomass.",
    category: "rituals",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
        { resourceId: 'health', amount: 2 }
    ],
    effectsPerSecond: [
        { type: 'add_resource', resourceId: 'mana', amount: 1 },
        { type: 'add_resource', resourceId: 'biomass', amount: 0.05 }
    ],
    xpPerSecond: 25,
    drops: [{ itemId: 'ritual_dagger', chancePerSecond: 0.02 }],
    prerequisites: [{ resourceId: 'mana', minMax: 1 }]
  },

  // --- TIER 2.5: CULT (Minions) ---
  {
      id: "manage_cult",
      name: "Sermonize",
      description: "Command your Acolytes to gather resources.",
      category: "cult",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'stamina', amount: 2 },
          { resourceId: 'reputation', amount: 0.01 } 
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'lore', amount: 0.2 },
          { type: 'add_resource', resourceId: 'money', amount: 1.5, scaleFactor: 1.01 }
      ],
      xpPerSecond: 20,
      prerequisites: [{ resourceId: 'acolytes', minMax: 1 }]
  },
  {
      id: "mass_ritual",
      name: "Mass Ritual",
      description: "Use Acolytes as batteries. They die often.",
      category: "cult",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'acolytes', amount: 0.02 }, 
          { resourceId: 'mana', amount: 0.5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'insight', amount: 0.005 },
          { type: 'add_resource', resourceId: 'biomass', amount: 0.5 } 
      ],
      xpPerSecond: 30,
      prerequisites: [{ resourceId: 'acolytes', minAmount: 5 }]
  },
  {
      id: "dark_crusade",
      name: "Dark Crusade",
      description: "Send the flock to raid the unbelievers. Highly illegal.",
      category: "cult",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'reputation', amount: 0.1 }, // Lose rep fast
          { resourceId: 'acolytes', amount: 0.05 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'money', amount: 5 },
          { type: 'add_resource', resourceId: 'biomass', amount: 1 }
      ],
      xpPerSecond: 50,
      prerequisites: [{ resourceId: 'acolytes', minAmount: 10 }]
  },

  // --- TIER 3: MUTATIONS ---
  {
    id: "hunt_aberrations",
    name: "Hunt in the Sewers",
    description: "Kill things that shouldn't exist. Gather Biomass.",
    category: "mutations",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [
        { resourceId: 'stamina', amount: 3 },
        { resourceId: 'health', amount: 1 }
    ],
    effectsPerSecond: [
        { type: 'add_resource', resourceId: 'biomass', amount: 0.5, scaleFactor: 1.05 },
        { type: 'add_resource', resourceId: 'money', amount: 0.5 }
    ],
    xpPerSecond: 40,
    drops: [{ itemId: 'living_robes', chancePerSecond: 0.001 }],
    prerequisites: [{ resourceId: 'biomass', minMax: 1 }]
  },
  {
      id: "metabolic_overdrive",
      name: "Metabolic Overdrive",
      description: "Force your body to grow. Converts food (Money) to mass.",
      category: "mutations",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'money', amount: 2 },
          { resourceId: 'health', amount: 0.5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'biomass', amount: 0.2 }
      ],
      xpPerSecond: 30,
      prerequisites: [{ resourceId: 'biomass', minMax: 1 }]
  },

  // --- TIER 4: PATH SPECIFIC (WEAVER) ---
  {
      id: "channel_ley_lines",
      name: "Weave Ley Lines",
      description: "Draw power from the earth itself. (Weaver Only)",
      category: "domain",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'insight', amount: 0.005 },
          { resourceId: 'sanity', amount: 0.2 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'mana', amount: 5, scaleFactor: 1.05 },
          { type: 'add_resource', resourceId: 'void_matter', amount: 0.01 }
      ],
      xpPerSecond: 100,
      drops: [{ itemId: 'staff_of_echoes', chancePerSecond: 0.001 }],
      prerequisites: [{ resourceId: 'path_weaver_active', minAmount: 1 }]
  },
  {
      id: "harvest_starlight",
      name: "Harvest Starlight",
      description: "Pull light from distant stars into your Sanctum. (Weaver Only)",
      category: "domain",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'mana', amount: 15 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'void_matter', amount: 0.05 },
          { type: 'add_resource', resourceId: 'insight', amount: 0.001 }
      ],
      xpPerSecond: 150,
      prerequisites: [{ resourceId: 'void_matter', minAmount: 2 }]
  },

  // --- TIER 4: PATH SPECIFIC (ARCHITECT) ---
  {
      id: "consume_self",
      name: "Autophagy",
      description: "Eat your own weakness to fuel growth. (Architect Only)",
      category: "domain",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'health', amount: 5 },
          { resourceId: 'sanity', amount: 0.5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'biomass', amount: 2, scaleFactor: 1.05 },
          { type: 'add_resource', resourceId: 'living_flesh', amount: 0.01 }
      ],
      xpPerSecond: 100,
      drops: [{ itemId: 'maw_shield', chancePerSecond: 0.001 }],
      prerequisites: [{ resourceId: 'path_architect_active', minAmount: 1 }]
  },
  {
      id: "gestalt_growth",
      name: "Gestalt Growth",
      description: "Merge minds with your Cathedral's walls. (Architect Only)",
      category: "domain",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'biomass', amount: 20 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'living_flesh', amount: 0.05 },
          { type: 'add_resource', resourceId: 'reputation', amount: -0.01 } // Extremely horrifying
      ],
      xpPerSecond: 150,
      prerequisites: [{ resourceId: 'living_flesh', minAmount: 2 }]
  },

  // --- TIER 5: ASCENSION (Shared) ---
  {
      id: "commune_outer_gods",
      name: "Commune with the Outer Dark",
      description: "The final step. Costs rare resources to gain Souls.",
      category: "domain",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'mana', amount: 50 },
          { resourceId: 'sanity', amount: 5 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'soul_fragments', amount: 0.0005 }
      ],
      xpPerSecond: 500,
      prerequisites: [{ resourceId: 'soul_fragments', minMax: 1 }]
  },
  
  // --- TIER 6: GODHOOD ---
  {
      id: "devour_reality",
      name: "Devour Reality",
      description: "Eat the world to fuel your ascension.",
      category: "ascension",
      progressRequired: 1,
      autoRestart: true,
      costPerSecond: [
          { resourceId: 'reputation', amount: 0.5 }, // Everyone hates you
          { resourceId: 'mana', amount: 100 }
      ],
      effectsPerSecond: [
          { type: 'add_resource', resourceId: 'cosmic_truth', amount: 0.0001 }
      ],
      xpPerSecond: 1000,
      prerequisites: [{ resourceId: 'cosmic_truth', minMax: 1 }]
  }
];
