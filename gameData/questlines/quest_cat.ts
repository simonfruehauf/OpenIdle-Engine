import { ActionConfig } from "../../types.ts";
export const ACTIONS: ActionConfig[] = [
    {
        id: "quest_cat_start",
        name: "The Missing 'Cat'",
        description: "Mrs. Higgins lost her cat. She's offering a reward. It probably has too many legs.",
        category: "quests",
        costs: [],
        effects: [{ type: 'modify_max_resource_flat', resourceId: 'quest_cat', amount: 1, hidden: true }
        ],
        maxExecutions: 1,
        prerequisites: [{ taskId: 'sleep', minExecutions: 15 }]
    },
    {
        id: "quest_cat_finish",
        name: "Return the 'Cat'",
        description: "Return the writhing fur ball. Try not to touch it too much.",
        category: "quests",
        costs: [],
        effects: [
            { type: 'add_resource', resourceId: 'money', amount: 50 },
            { type: 'add_item', itemId: 'glowing_collar', amount: 1 },
            { type: 'modify_max_resource_flat', resourceId: 'quest_cat', amount: -1, hidden: true }

        ],
        locks: ['quest_cat_search_alleys', 'quest_cat_finish_2'],
        lockDescription: "The creature is not yours to keep.",
        maxExecutions: 1,
        prerequisites: [{ resourceId: 'quest_cat', minAmount: 1 }],
    },
    {
        id: "quest_cat_finish_2",
        name: "Keep the 'Cat'",
        description: "It's yours. It speaks to you. It's more than a simple pet.",
        category: "quests",
        costs: [],
        effects: [
            { type: 'modify_max_resource_flat', resourceId: 'quest_cat', amount: -1, hidden: true },
            { type: 'modify_max_resource_flat', resourceId: 'quest_cat_keep', amount: 1, },
            { type: 'add_resource', resourceId: 'quest_cat_keep', amount: 1 },

        ],
        locks: ['quest_cat_search_alleys', 'quest_cat_finish'],
        lockDescription: "You can't return the cat now. You keep it.",
        maxExecutions: 1,
        prerequisites: [{ resourceId: 'quest_cat', minAmount: 1 }],
    }
];

import { TaskConfig } from "../../types";
export const TASKS: TaskConfig[] = [
    {
        id: "quest_cat_search_alleys",
        name: "Search Alleys",
        description: "Look for Mrs. Higgins' 'cat'. Something's hissing in the dark.",
        category: "quests",
        progressRequired: 5,
        autoRestart: true,
        costPerSecond: [
            { resourceId: 'stamina', amount: 0.1 },
            { resourceId: 'sanity', amount: 0.1 }
        ],
        effectsPerSecond: [],
        completionEffects: [
            { type: 'add_resource', resourceId: 'quest_cat', amount: 1, chance: 0.05, hidden: true }
        ],
        xpPerSecond: 5,
        drops: [{ itemId: 'strange_fur', chancePerSecond: 0.05 }],
        prerequisites: [{ actionId: 'quest_cat_start', minAmount: 1 }]
    },];

import { ResourceConfig } from "../../types";
export const RESOURCES: ResourceConfig[] = [
    {
        id: "quest_cat",
        name: "'Cat'",
        type: "basic",
        baseMax: 0,
        initialAmount: 0,
        description: "A writhing ball of fur with too many legs.",
        passiveGen: [{ targetResourceId: 'sanity', ratePerUnit: -0.1 }, { targetResourceId: 'insight', ratePerUnit: 0.1 }]
    },
    {
        id: "quest_cat_keep",
        name: "Mr. Purrly the 'Cat'",
        type: "basic",
        baseMax: 0,
        initialAmount: 0,
        description: "A writhing ball of fur with too many legs. It speaks to you sometimes.",
        passiveGen: [{ targetResourceId: 'sanity', ratePerUnit: -0.1 }, { targetResourceId: 'insight', ratePerUnit: 0.2 }]
    }];