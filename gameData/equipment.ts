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
        effects: [{ type: 'modify_task_yield_pct', taskId: 'rest', amount: 0.05 }]
    }
];
