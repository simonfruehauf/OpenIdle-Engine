import { ConverterConfig } from "../types";

export const CONVERTERS: ConverterConfig[] = [
    // Tier 0: Early game recovery
    {
        id: "incense_brazier",
        name: "Incense Brazier",
        description: "Burn fragrant herbs to calm the mind. Converts Stamina to Sanity.",
        cost: [{ resourceId: 'money', amount: 25 }],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'sanity', amount: 0.1 }
        ],
        costPerSecond: [],
        prerequisites: [{ resourceId: 'sanity', minMax: 10 }]
    }
];
