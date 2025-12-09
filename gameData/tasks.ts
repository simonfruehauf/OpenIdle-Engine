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
            { type: 'add_resource', resourceId: 'stamina', amount: 0.8 },
            { type: 'add_resource', resourceId: 'health', amount: 0.2 },
            { type: 'add_resource', resourceId: 'mana', amount: 0.2 }
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
            { type: 'add_resource', resourceId: 'stamina', amount: 1 },
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
            { resourceId: 'stamina', amount: 0.8 }
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
            { resourceId: 'stamina', amount: 1, scaleFactor: 0.95, scaleType: 'exponential' }
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
        progressRequired: 1,
        autoRestart: true,
        startCosts: [{ resourceId: 'money', amount: 5 }],
        costPerSecond: [{ resourceId: 'stamina', amount: 1, scaleFactor: 1.1, scaleType: 'exponential' }],
        effectsPerSecond: [],
        completionEffects: [],
        prerequisites: [{ actionId: 'scratch', minExecutions: 1 }],
        locks: [],
        maxExecutions: 10,
        hideWhenComplete: true
    }
];

