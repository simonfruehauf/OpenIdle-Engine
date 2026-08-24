import { TaskConfig, ActionConfig, ItemConfig } from "../../types";

// Library Assistant — parallel job, independent of other jobs
// Unlocks after library_find

export const TASKS: TaskConfig[] = [
  {
    id: "lib_job_shelve",
    name: "Shelve Returns",
    description: "You push the cart. Spines out, aligned, quiet work that teaches you where everything lives.",
    category: "library_job",
    progressRequired: 8,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "quiet", amount: 1.2 },
      { type: "add_resource", resourceId: "lore", amount: 0.6 }
    ],
    prerequisites: [{ actionId: "library_find", minExecutions: 1 }],
    xpPerSecond: 4,
  },
  {
    id: "lib_job_catalog",
    name: "Catalog New Acquisitions",
    description: "You transcribe titles, subjects, and the occasional marginal note someone tried to erase.",
    category: "library_job",
    progressRequired: 18,
    autoRestart: true,
    startCosts: [{ resourceId: "quiet", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 0.3 },
      { type: "add_resource", resourceId: "lore", amount: 0.5 },
      { type: "add_resource", resourceId: "quiet", amount: 1 }
    ],
    firstCompletionEffects: [{ type: "modify_max_resource_flat", resourceId: "insight", amount: 4 }],
    prerequisites: [{ taskId: "lib_job_shelve", minLevel: 2 }],
    maxExecutions: 10,
  },
  {
    id: "lib_job_research",
    name: "Assist Patron Research",
    description: "Someone asks for 'everything on echoes.' You find more than they asked for.",
    category: "library_job",
    progressRequired: 25,
    autoRestart: true,
    startCosts: [{ resourceId: "quiet", amount: 8 }, { resourceId: "lore", amount: 3 }],
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    completionEffects: [
      { type: "add_resource", resourceId: "insight", amount: 0.6 },
      { type: "add_resource", resourceId: "mana", amount: 0.4 }
    ],
    prerequisites: [{ taskId: "lib_job_catalog", minLevel: 2 }],
    maxExecutions: 6,
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "lib_job_head_start",
    name: "Request Head Librarian Role",
    description: "You ask. The head librarian looks at your hands and says: 'Show me how you shelve.'",
    category: "library_job",
    costs: [{ resourceId: "insight", amount: 6 }, { resourceId: "lore", amount: 10 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "quiet", amount: 15 },
      { type: "modify_max_resource_flat", resourceId: "insight", amount: 8 }
    ],
    prerequisites: [{ taskId: "lib_job_catalog", minLevel: 3 }],
    maxExecutions: 1,
  },
  {
    id: "lib_job_archive",
    name: "Manage Special Collections",
    description: "A locked cabinet, a key that is also a bookmark. Inside: things that were not supposed to be kept.",
    category: "library_job",
    costs: [{ resourceId: "insight", amount: 12 }, { resourceId: "quiet", amount: 15 }],
    effects: [
      { type: "modify_passive_gen", resourceId: "lore", amount: 0.05 },
      { type: "modify_max_resource_flat", resourceId: "mana", amount: 10 },
      { type: "add_item", itemId: "archivist_glasses", amount: 1 }
    ],
    prerequisites: [{ actionId: "lib_job_head_start", minExecutions: 1 }],
    maxExecutions: 1,
  },
];

export const ITEMS: ItemConfig[] = [
  {
    id: "archivist_glasses",
    name: "Archivist Glasses",
    description: "You see dust and handwriting more clearly. Both tell you things.",
    slot: "head",
    effects: [{ type: "modify_yield_pct", taskId: "lib_job_catalog", amount: 0.18 }],
  },
  {
    id: "library_cardigan",
    name: "Library Cardigan",
    description: "Pockets deep enough for a notebook, a pencil, and a secret.",
    slot: "body",
    effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.03 }],
  },
  {
    id: "cataloging_folio",
    name: "Cataloging Folio",
    description: "Your own system, cross-referenced and slightly obsessive.",
    slot: "accessory",
    effects: [{ type: "modify_yield_pct", taskId: "lib_job_shelve", amount: 0.15 }],
  },
];
