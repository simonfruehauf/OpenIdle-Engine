
import { ActionConfig, CategoryConfig, ItemConfig, ResourceConfig, TaskConfig } from "../types";

export const CATEGORIES: CategoryConfig[] = [
    { id: "christmas", name: "Event: Yuletide" }
];

export const RESOURCES: ResourceConfig[] = [
    { 
        id: "snowflakes", 
        name: "Snowflakes", 
        type: "basic", 
        baseMax: 20, 
        initialAmount: 0 
    },
    {
        id: "holiday_cheer",
        name: "Holiday Cheer",
        type: "stat",
        baseMax: 10,
        initialAmount: 0,
        // festive color, like a pepermint stick:
        color: "bg-white bg-[repeating-linear-gradient(45deg,_#ef4444_0px,_#ef4444_20px,_transparent_20px,_transparent_40px)]"
    }
];

export const TASKS: TaskConfig[] = [
    {
        id: "catch_snow",
        name: "Catch Snowflakes",
        description: "Stand outside with your tongue out. It's cold.",
        category: "christmas",
        progressRequired: 15,
        autoRestart: true,
        costPerSecond: [
            { resourceId: "stamina", amount: 1 }
        ],
        effectsPerSecond: [],
        xpPerSecond: 2,
        completionEffects: [
            { type: "add_resource", resourceId: "snowflakes", amount: 1 }
        ],
        drops: [{ itemId: "santa_hat", chancePerSecond: 0.01 }]
    },
    {
        id: "carolling",
        name: "Sing Carols",
        description: "Spread cheer to the neighbors. They look confused, scared even.",
        category: "christmas",
        progressRequired: 5,
        autoRestart: true,
        startCosts: [{ resourceId: "snowflakes", amount: 1 }],
        costPerSecond: [
            { resourceId: "stamina", amount: 0.5 },
            { resourceId: "sanity", amount: 0.5 } 
        ],
        effectsPerSecond: [ { type: "add_resource", resourceId: "holiday_cheer", amount: 0.1 },],
        completionEffects: [
            { type: "add_resource", resourceId: "reputation", amount: 0.5 }
        ],
        xpPerSecond: 5,
        prerequisites: [{ resourceId: "snowflakes", minAmount: 5 }]
    }
];

export const ACTIONS: ActionConfig[] = [
    {
        id: "build_snowman",
        name: "Build Snowman",
        description: "Construct a frozen effigy. It watches you.",
        category: "christmas",
        costs: [
            { resourceId: "snowflakes", amount: 50 },
            { resourceId: "stamina", amount: 20 }
        ],
        effects: [
            { type: "modify_max_resource_flat", resourceId: "holiday_cheer", amount: 10 },
            { type: "add_item", itemId: "coal_lump", amount: 1 }
        ],
        maxExecutions: 5
    }
];

export const ITEMS: ItemConfig[] = [
    {
        id: "santa_hat",
        name: "Frayed Red Hat",
        description: "It smells of soot and peppermint.",
        slot: "head",
        effects: [
            { type: "modify_max_resource_flat", resourceId: "holiday_cheer", amount: 20 }
        ]
    },
    {
        id: "coal_lump",
        name: "Lump of Coal",
        description: "A reminder of your sins.",
        slot: "accessory",
        effects: [
            { type: "modify_task_yield_pct", taskId: "catch_snow", amount: 0.5 }
        ]
    }
];
