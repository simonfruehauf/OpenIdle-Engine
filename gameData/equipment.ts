import { ItemConfig, SlotConfig } from "../types";
// --- EQUIPMENT SLOTS ---
export const SLOTS: SlotConfig[] = [
    // --- NATURAL ---
    { id: "hand_r", name: "Right Hand" },
    { id: "hand_l", name: "Left Hand" },
    { id: "body", name: "Body" },
    { id: "head", name: "Head" },
    { id: "accessory", name: "Accessory" },
    
    // --- MUTATIONS ---
    { 
        id: "mutation_eye", 
        name: "Mutation: Pineal Eye", 
        prerequisites: [{ resourceId: 'unlock_third_eye', minMax: 1 }] 
    },
    { 
        id: "mutation_tentacle", 
        name: "Mutation: Dorsal Tentacle", 
        prerequisites: [{ resourceId: 'unlock_tentacles', minMax: 1 }] 
    },
    {
        id: "mutation_cortex",
        name: "Mutation: Expanded Cortex",
        prerequisites: [{ resourceId: 'unlock_cortex', minMax: 1 }]
    },
    {
        id: "mutation_skin",
        name: "Mutation: Dermis",
        prerequisites: [{ resourceId: 'unlock_skin', minMax: 1 }]
    },
    
    // --- ASCENSION SLOTS ---
    {
        id: "aura_slot",
        name: "Existence Aura",
        prerequisites: [{ resourceId: 'soul_fragments', minMax: 1 }]
    }
];
// --- EQUIPMENT ITEMS ---
export const ITEMS: ItemConfig[] = [
    // --- TIER 0: MUNDANE ---
    {
        id: "notebook",
        name: "Tattered Notebook",
        description: "Filled with scribbles. Helps retain sanity.",
        slot: "accessory",
        effects: [{ type: 'modify_max_resource_flat', resourceId: 'sanity', amount: 2 }]
    },
    {
        id: "coffee_thermos",
        name: "Black Coffee",
        description: "Keep the eyes open. Boosts Stamina.",
        slot: "hand_l",
        effects: [{ type: 'modify_max_resource_flat', resourceId: 'stamina', amount: 5 }]
    },
    {
        id: "lucky_coin",
        name: "Bent Coin",
        description: "Found in the gutter. Things seem to go your way slightly more often.",
        slot: "accessory",
        effects: [{ type: 'modify_task_yield_pct', taskId: 'grind_9to5', amount: 0.2 }]
    },

    // --- QUEST ITEMS ---
    {
        id: "strange_fur",
        name: "Strange Fur",
        description: "It feels oily and shifts color when you look away.",
        slot: "accessory", 
        effects: [{ type: 'modify_max_resource_flat', resourceId: 'sanity', amount: -1 },{ type: 'modify_max_resource_flat', resourceId: 'health', amount: 1 }, { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 1 }]
    },
    {
        id: "glowing_collar",
        name: "Glowing Collar",
        description: "A reward for finding the... cat. It hums.",
        slot: "accessory",
        effects: [
            { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 1 },
            { type: 'modify_task_yield_pct', taskId: 'study_notes', amount: 0.5 }
        ]
    },
    {
        id: "haunted_mirror",
        name: "Antique Mirror",
        description: "The reflection lags behind by a second. Unnerving.",
        slot: "accessory",
        effects: [
            { type: 'modify_task_yield_pct', taskId: 'gaze_mirror', amount: 0.5 },
            { type: 'modify_max_resource_pct', resourceId: 'sanity', amount: -0.1 } // Curse
        ]
    },
    {
        id: "mirror_shard",
        name: "Shard of Reflection",
        description: "A piece of the shattered mirror. It cuts through illusions.",
        slot: "hand_r",
        effects: [
            { type: 'modify_task_yield_pct', taskId: 'dream_walking', amount: 1.5 },
            { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 2 }
        ]
    },

    // --- TIER 1: OCCULT ---
    {
        id: "ritual_dagger",
        name: "Obsidian Shard",
        description: "Sharp enough to cut reality. Improves bloodletting.",
        slot: "hand_r",
        effects: [{ type: 'modify_task_yield_pct', taskId: 'bloodletting', amount: 0.5 }]
    },
    {
        id: "amulet_calm",
        name: "Lead Amulet",
        description: "Heavy and dull. Grounds your mind against the whispers.",
        slot: "accessory",
        effects: [{ type: 'modify_task_yield_pct', taskId: 'meditate_void', amount: 0.2 }]
    },

    // --- TIER 2: CULT ---
    {
        id: "cult_mask",
        name: "Porcelain Mask",
        description: "Hides your identity. Increases Reputation gain.",
        slot: "accessory",
        effects: [{ type: 'modify_task_yield_pct', taskId: 'attend_gala', amount: 0.5 }]
    },

    // --- TIER 3: ELDRITCH ---
    {
        id: "void_lens",
        name: "Cracked Monocle",
        description: "See what shouldn't be seen. Increases Lore gain.",
        slot: "mutation_eye",
        effects: [{ type: 'modify_task_yield_pct', taskId: 'dream_walking', amount: 1.0 }]
    },
    {
        id: "living_robes",
        name: "Skin-Weave Robes",
        description: "It pulses with a heartbeat. Massive Health boost.",
        slot: "body",
        effects: [{ type: 'modify_max_resource_pct', resourceId: 'health', amount: 1.0 }]
    },

    // --- TIER 4: ABOMINATIONS (Class Specific Drops) ---
    {
        id: "staff_of_echoes",
        name: "Staff of Echoes",
        description: "Resonates with the Void. (Weaver Item)",
        slot: "hand_r",
        effects: [
            { type: 'modify_max_resource_pct', resourceId: 'mana', amount: 0.5 },
            { type: 'modify_task_yield_pct', taskId: 'channel_ley_lines', amount: 0.5 }
        ]
    },
    {
        id: "maw_shield",
        name: "Gaping Maw Shield",
        description: "A shield that eats incoming damage. (Architect Item)",
        slot: "hand_l",
        effects: [
            { type: 'modify_max_resource_pct', resourceId: 'biomass', amount: 0.5 },
            { type: 'modify_task_yield_pct', taskId: 'consume_self', amount: 0.5 }
        ]
    },

    // --- TIER 6: ASCENSION ---
    {
        id: "halo_entropy",
        name: "Halo of Entropy",
        description: "Everything around you decays. +500% Mana.",
        slot: "aura_slot",
        effects: [{ type: 'modify_max_resource_pct', resourceId: 'mana', amount: 5.0 }]
    }
];