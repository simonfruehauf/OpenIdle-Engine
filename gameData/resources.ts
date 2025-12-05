
import { ResourceConfig } from "../types";

export const RESOURCES: ResourceConfig[] = [
  // --- MUNDANE ---
  {
    id: "money",
    name: "Funds",
    type: "basic",
    category: "basic",
    baseMax: 25,
    initialAmount: 2,
    description: "Standard currency used for survival and mundane transactions."
  },
  {
    id: "reputation",
    name: "Reputation",
    type: "basic",
    category: "basic",
    baseMax: 5,
    initialAmount: 0,
    description: "Your social standing and influence within the community."
  },

  // --- STATS ---
  {
    id: "stamina",
    name: "Stamina",
    type: "stat",
    baseMax: 10,
    initialAmount: 10,
    color: "bg-yellow-500",
    description: "Physical energy available for work and exploration."
  },
  {
    id: "sanity",
    name: "Sanity",
    type: "stat",
    baseMax: 10,
    initialAmount: 10,
    color: "bg-teal-400",
    description: "Mental resilience against the horrors of the void."
  },
  {
    id: "health",
    name: "Vitality",
    type: "stat",
    baseMax: 10,
    initialAmount: 10,
    color: "bg-red-700",
    description: "Physical integrity of your vessel."
  },

  // --- MAGIC ---
  {
    id: "lore",
    name: "Lore Scraps",
    type: "basic",
    category: "research",
    baseMax: 10,
    initialAmount: 0,
    description: "Accumulated occult knowledge from books and whispers.",
    passiveGen: [{ targetResourceId: 'insight', ratePerUnit: 0.005 }, { targetResourceId: 'sanity', ratePerUnit: -0.025 }]
  },
  {
    id: "occult_book",
    name: "Occult Book",
    type: "basic",
    category: "research",
    baseMax: 0,
    initialAmount: 0,
    description: "Books containung knowledge no human was ever supposed to have.",
    passiveGen: [{ targetResourceId: 'insight', ratePerUnit: 0.05 }, { targetResourceId: 'sanity', ratePerUnit: -0.05 }]
  },
  {
    id: "mana",
    name: "Aether",
    type: "stat",
    baseMax: 0,
    initialAmount: 0,
    color: "bg-purple-600",
    description: "Raw magical energy channeled from beyond the veil."
  },
  {
    id: "acolytes",
    name: "Acolytes",
    type: "basic",
    category: "cult",
    baseMax: 0,
    initialAmount: 0,
    description: "Loyal followers dedicated to your cause.",
    passiveGen: [
      { targetResourceId: 'money', ratePerUnit: 0.05 }, // Tithes
      { targetResourceId: 'reputation', ratePerUnit: 0.001 } // Word of mouth
    ]
  },

  // --- ADVANCED ---
  {
    id: "insight",
    name: "Insight",
    type: "basic",
    category: "research",
    baseMax: 5,
    initialAmount: 0,
    description: "Deep, often dangerous understanding of the universe's true nature."
  },
  {
    id: "biomass",
    name: "Biomass",
    type: "basic",
    category: "mutations",
    baseMax: 0,
    initialAmount: 0,
    description: "Raw organic material harvested for mutation and growth."
  },

  // --- ENDGAME (Tier 4) ---
  {
    id: "void_matter",
    name: "Void Matter",
    type: "basic",
    category: "domain",
    baseMax: 0,
    initialAmount: 0,
    description: "Condensed substance from the space between stars.",
    passiveGen: [{ targetResourceId: 'mana', ratePerUnit: 0.5 }]
  },
  {
    id: "living_flesh",
    name: "Living Flesh",
    type: "basic",
    category: "domain",
    baseMax: 0,
    initialAmount: 0,
    description: "Sentient organic matter that refuses to die."
  },
  {
    id: "soul_fragments",
    name: "Souls",
    type: "basic",
    category: "domain",
    baseMax: 0,
    initialAmount: 0,
    description: "Shards of consciousness torn from the living."
  },

  // --- ASCENSION (Tier 5) ---
  {
    id: "cosmic_truth",
    name: "Cosmic Truth",
    type: "basic",
    category: "ascension",
    baseMax: 0,
    initialAmount: 0,
    description: "The ultimate realization that undoes reality."
  }
];
