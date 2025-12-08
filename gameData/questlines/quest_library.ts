import { ActionConfig, ResourceConfig, TaskConfig, ItemConfig } from "../../types";

// --- RESOURCES ---
export const RESOURCES: ResourceConfig[] = [
    {
        id: "library_access",
        name: "Library Access",
        type: "basic",
        baseMax: 0,
        description: "Permission to browse the restricted section."
    },
    {
        id: "forbidden_knowledge",
        name: "Forbidden Knowledge",
        type: "basic",
        baseMax: 0,
        initialAmount: 0,
        description: "Dangerous secrets from the archives.",
        passiveGen: [{ targetResourceId: 'insight', ratePerUnit: 0.02 }, { targetResourceId: 'sanity', ratePerUnit: -0.05 }]
    }
];

// --- ACTIONS ---
export const ACTIONS: ActionConfig[] = [
    {
        id: "buy_library_card",
        name: "Acquire Library Card",
        description: "Apply for access to the city's old library. Rumors speak of a restricted section.",
        category: "quests",
        costs: [{ resourceId: 'money', amount: 10 }],
        effects: [
            { type: 'modify_max_resource_flat', resourceId: 'library_access', amount: 1 }
        ],
        maxExecutions: 1,
        prerequisites: [{ resourceId: 'lore', minAmount: 15 }]
    },
    {
        id: "bribe_librarian",
        name: "Bribe the Librarian",
        description: "Slip her some coins. She looks the other way as you enter the restricted wing.",
        category: "quests",
        costs: [
            { resourceId: 'money', amount: 100 },
            { resourceId: 'reputation', amount: 0.5 }
        ],
        effects: [
            { type: 'modify_max_resource_flat', resourceId: 'forbidden_knowledge', amount: 5 }
        ],
        maxExecutions: 1,
        prerequisites: [{ taskId: 'browse_restricted', minLevel: 2 }],
        logMessage: "The librarian pockets the coins with a knowing smile."
    },
    {
        id: "steal_codex",
        name: "Steal the Codex",
        description: "Take the book and never return. Burn the bridge.",
        category: "quests",
        costs: [
            { resourceId: 'sanity', amount: 5 },
            { resourceId: 'forbidden_knowledge', amount: 10 }
        ],
        effects: [
            { type: 'add_item', itemId: 'archivists_quill', amount: 1 },
            { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 5 },
            { type: 'modify_max_resource_flat', resourceId: 'occult_book', amount: 3 },
            { type: 'modify_max_resource_flat', resourceId: 'library_access', amount: -99 } // Lock library
        ],
        maxExecutions: 1,
        exclusiveWith: ["copy_codex"],
        prerequisites: [{ resourceId: 'forbidden_knowledge', minAmount: 10 }],
        locks: ['browse_restricted', 'decipher_tome'],
        logMessage: "You slip the ancient tome under your coat. You can never return here."
    },
    {
        id: "copy_codex",
        name: "Copy the Codex",
        description: "Painstakingly transcribe the forbidden text. Safer, but takes longer.",
        category: "quests",
        costs: [
            { resourceId: 'money', amount: 50 },
            { resourceId: 'stamina', amount: 20 },
            { resourceId: 'forbidden_knowledge', amount: 10 }
        ],
        effects: [
            { type: 'add_item', itemId: 'copied_codex', amount: 1 },
            { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 2 },
            { type: 'modify_max_resource_flat', resourceId: 'occult_book', amount: 1 }
        ],
        maxExecutions: 1,
        exclusiveWith: ["steal_codex"],
        prerequisites: [{ resourceId: 'forbidden_knowledge', minAmount: 10 }],
        logMessage: "Your hand cramps, but you now possess a copy of forbidden truths."
    }
];

// --- TASKS ---
export const TASKS: TaskConfig[] = [
    {
        id: "browse_restricted",
        name: "Browse Restricted Section",
        description: "Sneak glances at forbidden tomes. The dust makes you cough.",
        category: "quests",
        progressRequired: 8,
        autoRestart: true,
        costPerSecond: [
            { resourceId: 'stamina', amount: 0.2 },
            { resourceId: 'sanity', amount: 0.1 }
        ],
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'lore', amount: 0.3 }
        ],
        completionEffects: [
            { type: 'add_resource', resourceId: 'forbidden_knowledge', amount: 1, chance: 0.3 }
        ],
        firstCompletionEffects: [
            { type: 'modify_max_resource_flat', resourceId: 'forbidden_knowledge', amount: 1 }
        ],
        xpPerSecond: 8,
        prerequisites: [{ resourceId: 'library_access', minAmount: 1 }]
    },
    {
        id: "decipher_tome",
        name: "Decipher Forbidden Tome",
        description: "Translate ancient languages that should not be spoken aloud.",
        category: "quests",
        progressRequired: 15,
        autoRestart: true,
        costPerSecond: [
            { resourceId: 'sanity', amount: 1 },
            { resourceId: 'lore', amount: 0.1 }
        ],
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'insight', amount: 0.005 }
        ],
        completionEffects: [
            { type: 'add_resource', resourceId: 'forbidden_knowledge', amount: 2 }
        ],
        xpPerSecond: 15,
        drops: [{ itemId: 'archivists_quill', chancePerSecond: 0.001 }],
        prerequisites: [{ resourceId: 'forbidden_knowledge', minMax: 1 }]
    }
];

// --- ITEMS ---
export const ITEMS: ItemConfig[] = [
    {
        id: "archivists_quill",
        name: "Archivist's Quill",
        description: "Writes by itself when you dream. +50% Lore gains, +10% Insight from tasks.",
        slot: "hand_r",
        effects: [
            { type: 'modify_task_yield_pct', taskId: 'study_notes', amount: 0.5 },
            { type: 'modify_task_yield_pct', taskId: 'browse_restricted', amount: 0.5 },
            { type: 'modify_task_yield_pct', taskId: 'dream_walking', amount: 0.1 }
        ]
    },
    {
        id: "copied_codex",
        name: "Transcribed Codex",
        description: "Your handwriting, their madness. +2 Insight cap, minor lore boost.",
        slot: "accessory",
        effects: [
            { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 2 },
            { type: 'modify_task_yield_pct', taskId: 'study_notes', amount: 0.25 }
        ]
    }
];
