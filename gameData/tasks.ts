import { TaskConfig } from "../types";

export const TASKS: TaskConfig[] = [
    {
        id: "rest_bench",
        name: "Rest",
        description: "Rest on a park bench.",
        category: "basic",
        type: "rest",
        progressRequired: 1,
        autoRestart: true,
        costPerSecond: [],
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'time', amount: 0.8 },
            { type: 'add_resource', resourceId: 'health', amount: 0.2 },
            { type: 'add_resource', resourceId: 'mana', amount: 0.1 }
        ],
        xpPerSecond: 5,
    },
    {
        id: "rest_bed",
        name: "Rest",
        description: "Rest on a bed.",
        category: "basic",
        type: "rest",
        progressRequired: 1,
        autoRestart: true,
        costPerSecond: [],
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'time', amount: 1 },
            { type: 'add_resource', resourceId: 'health', amount: 0.5 },
            { type: 'add_resource', resourceId: 'mana', amount: 0.5 }],
        prerequisites: [{ actionId: 'appartment', minExecutions: 1 }]
    },
    {
        id: "subways_job",
        name: "Subway Shift",
        description: "Work a shift at Subway's.",
        category: "basic",
        type: "normal",
        progressRequired: 5,
        autoRestart: true,
        costPerSecond: [
            { resourceId: 'time', amount: 0.6 }
        ],
        effectsPerSecond: [],
        completionEffects: [
            { type: 'add_resource', resourceId: 'money', amount: 10 }
        ],
        prerequisites: [{ actionId: 'get_job', minExecutions: 1 }],
        locks: ['search_trash']
    },
    {
        id: "subways_job_2",
        name: "Evening Shift",
        description: "They said it was a promotion...",
        category: "basic",
        type: "normal",
        progressRequired: 4,
        autoRestart: true,
        costPerSecond: [
            { resourceId: 'time', amount: 0.8, scaleFactor: 0.95, scaleType: 'exponential' }
        ],
        effectsPerSecond: [],
        completionEffects: [
            { type: 'add_resource', resourceId: 'money', amount: 15, scaleFactor: 2, scaleType: 'fixed' }
        ],
        prerequisites: [{ actionId: 'subways_promotion', minExecutions: 1 }],
        locks: ['subways_job'],
        xpPerSecond: 10,
    },
    // Oddness
    {
        id: "wall_destroy",
        name: "Destroying the wall",
        description: "You have to find the source of the scratching.",
        category: "oddness",
        type: "normal",
        progressRequired: 3,
        autoRestart: true,
        startCosts: [{ resourceId: 'money', amount: 5 }],
        costPerSecond: [{ resourceId: 'time', amount: 0.5, scaleFactor: 1.1, scaleType: 'exponential' }],
        effectsPerSecond: [],
        completionEffects: [{ type: 'add_resource', resourceId: 'insanity', amount: 0.1 }],
        prerequisites: [{ actionId: 'scratch', minExecutions: 1 }],
        locks: [],
        firstCompletionEffects: [
            { type: 'modify_max_resource_flat', resourceId: 'insanity', amount: 2 }
        ],
        maxExecutions: 10,
        hideWhenComplete: true
    },
    {
        id: "explore_neighborhood",
        name: "Explore the Neighborhood",
        description: "Something feels different about this part of town...",
        category: "oddness",
        type: "normal",
        progressRequired: 25,
        autoRestart: false,
        costPerSecond: [{ resourceId: 'time', amount: 0.3 }],
        effectsPerSecond: [],
        completionEffects: [
            { type: 'add_resource', resourceId: 'lore', amount: 0.5 }
        ],
        firstCompletionEffects: [
            { type: 'modify_max_resource_flat', resourceId: 'lore', amount: 2 }
        ],
        prerequisites: [{ resourceId: 'cat', minMax: 1 }],
        maxExecutions: 5
    }
];

