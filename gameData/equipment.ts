import { ItemConfig, SlotConfig } from "../types";
// --- EQUIPMENT SLOTS ---
export const SLOTS: SlotConfig[] = [
    // --- NATURAL ---
    { id: "hand_r", name: "Right Hand" },
    { id: "hand_l", name: "Left Hand" },
    { id: "body", name: "Body" },
    { id: "head", name: "Head" },
    { id: "accessory", name: "Accessory" },
    { id: "accessory_2", name: "Accessory" },

    // --- MUTATIONS ---
    {
        id: "mutation_eye",
        name: "Mutation: Pineal Eye",
        prerequisites: [{ actionId: 'surgery_eye', minExecutions: 1 }]
    }
];
// --- EQUIPMENT ITEMS ---
export const ITEMS: ItemConfig[] = [
    {
        id: "lucky_coin",
        name: "Bent Coin",
        description: "Found in the gutter. Things seem to go your way slightly more often.",
        slot: "accessory",
        effects: [{ type: 'modify_yield_pct', taskId: 'rest_bench', amount: 0.05 }]
    },
    {
        id: "subway_uniform",
        name: "Subway Uniform",
        description: "The smell of bread follows you everywhere now.",
        slot: "body",
        effects: [{ type: 'modify_yield_flat', taskId: 'subways_job', amount: 1, resourceId: 'money' }]
    },
    {
        id: "eye_patch",
        name: "Clinical Eyepatch",
        description: "You wear it over the eye they worked on. It itches in a way that feels like seeing.",
        slot: "head",
        effects: [{ type: 'modify_max_resource_flat', resourceId: 'mana', amount: 6 }]
    },
    {
        id: "pineal_lens",
        name: "Pineal Lens",
        description: "A faintly cloudy lens. Through it, the air has a grain.",
        slot: "mutation_eye",
        effects: [
          { type: 'modify_yield_pct', taskId: 'faith_alley_walk', amount: 0.2 },
          { type: 'modify_yield_pct', taskId: 'hunger_extract', amount: 0.15 },
          { type: 'modify_passive_gen', resourceId: 'insight', amount: 0.02 }
        ]
    },
    {
        id: "quiet_pin",
        name: "Quiet Pin",
        description: "A small enamel pin from the library. It asks you to be quiet without saying anything.",
        slot: "accessory",
        effects: [{ type: 'modify_passive_gen', resourceId: 'mana', amount: 0.025 }]
    }
];
