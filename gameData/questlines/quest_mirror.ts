import { ActionConfig } from "../../types.ts";
export const ACTIONS: ActionConfig[] = [
    {
        id: "buy_mirror",
        name: "Buy Antique Mirror",
        description: "An estate sale item. It calls to you.",
        category: "quests",
        costs: [{ resourceId: 'money', amount: 50 }],
        effects: [
            { type: 'add_item', itemId: 'haunted_mirror', amount: 1 },
            { type: 'modify_max_resource_flat', resourceId: 'reflections', amount: 1 },
            { type: 'modify_max_resource_flat', resourceId: 'quest_mirror_active', amount: 1 }
        ],
        maxExecutions: 1,
        prerequisites: [{ resourceId: 'insight', minAmount: 1 }]
    },
    {
        id: "shatter_mirror",
        name: "Action: Shatter Mirror",
        description: "Break the curse and take the power within.",
        category: "quests",
        costs: [{ resourceId: 'sanity', amount: 8 }],
        effects: [
            { type: 'modify_max_resource_flat', resourceId: 'reflections', amount: -99 },
            { type: 'add_item', itemId: 'mirror_shard', amount: 1 },
            { type: 'modify_max_resource_flat', resourceId: 'insight', amount: 2 }
        ],
        maxExecutions: 1,
        prerequisites: [{ resourceId: 'quest_mirror_active', minAmount: 1 }]
    },
];

import { TaskConfig } from "../../types";
export const TASKS: TaskConfig[] = [
    {
        id: "gaze_mirror",
        name: "Gaze into Mirror",
        description: "Stare at your reflection until it stops moving with you.",
        category: "quests",
        progressRequired: 5,
        autoRestart: true,
        costPerSecond: [
            { resourceId: 'sanity', amount: 0.5 }
        ],
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'insight', amount: 0.002 },
            { type: 'add_resource', resourceId: 'lore', amount: 0.1 },
        ],
        completionEffects: [
            { type: 'add_resource', resourceId: 'reflections', amount: 1 }
        ],
        firstCompletionEffects: [
            { type: 'modify_max_resource_flat', resourceId: 'reflections', amount: 1 }
        ],
        xpPerSecond: 10,
        prerequisites: [{ resourceId: 'reflections', minAmount: 1 }]
    },
];

import { ResourceConfig } from "../../types";
export const RESOURCES: ResourceConfig[] = [
    {
        id: "reflections",
        name: "Warped Reflections",
        type: "basic",
        baseMax: 0,
        initialAmount: 0,
        description: "Distorted images from beyond the veil."
    },
    {
        id: "quest_mirror_active",
        name: "Mirror Quest Active",
        type: "basic",
        baseMax: 0,
        description: "The mirror's curse is upon you."
    }
];