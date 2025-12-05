import { ConverterConfig } from "../types";

export const CONVERTERS: ConverterConfig[] = [
    {
        id: "dream_weaver",
        name: "Dream Weaver",
        description: "Converts dreams into energy passively.",
        cost: [{ resourceId: 'money', amount: 10 }],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'energy', amount: 0.5 }
        ],
        costPerSecond: [{ resourceId: 'dreams', amount: 0.1 }],
        prerequisites: [{ resourceId: 'dreams', minAmount: 1 }]
    },
    {
        id: "money_printer",
        name: "Money Printer",
        description: "Burns energy to generate money.",
        cost: [{ resourceId: 'money', amount: 25 }],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'money', amount: 0.5 }
        ],
        costPerSecond: [{ resourceId: 'energy', amount: 1 }],
        prerequisites: [{ resourceId: 'money', minAmount: 10 }]
    },
    {
        id: "sanity_drain",
        name: "Sanity Drain",
        description: "A cursed device that cannot be turned off. Slowly drains sanity for dreams.",
        cost: [{ resourceId: 'dreams', amount: 5 }],
        canBeToggled: false,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'dreams', amount: 0.2 }
        ],
        costPerSecond: [{ resourceId: 'sanity', amount: 0.5 }],
        prerequisites: [{ resourceId: 'dreams', minAmount: 3 }]
    }
];
