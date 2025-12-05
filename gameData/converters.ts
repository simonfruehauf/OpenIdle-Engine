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
    },
    // Tier 1: Research automation
    {
        id: "lore_compiler",
        name: "Lore Compiler",
        description: "A mechanical device that cross-references occult texts. Slowly converts Lore to Insight.",
        cost: [
            { resourceId: 'money', amount: 100 },
            { resourceId: 'lore', amount: 20 }
        ],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'insight', amount: 0.002 }
        ],
        costPerSecond: [{ resourceId: 'lore', amount: 0.1 }],
        prerequisites: [{ resourceId: 'lore', minAmount: 15 }]
    },
    // Tier 2: Ritual exchange
    {
        id: "blood_font",
        name: "Blood Font",
        description: "A basin that converts life force into magical energy. Painful but efficient.",
        cost: [
            { resourceId: 'biomass', amount: 20 },
            { resourceId: 'mana', amount: 30 }
        ],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'mana', amount: 1 }
        ],
        costPerSecond: [{ resourceId: 'health', amount: 0.5 }],
        prerequisites: [{ resourceId: 'mana', minMax: 1 }]
    },
    // Tier 4: Weaver path
    {
        id: "soul_condenser",
        name: "Soul Condenser",
        description: "Crystallizes raw magical energy into soul fragments. Weaver specialty.",
        cost: [
            { resourceId: 'void_matter', amount: 5 },
            { resourceId: 'mana', amount: 500 }
        ],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'soul_fragments', amount: 0.0002 }
        ],
        costPerSecond: [{ resourceId: 'mana', amount: 20 }],
        prerequisites: [{ resourceId: 'soul_fragments', minMax: 1 }]
    },
    // Tier 4: Architect path
    {
        id: "flesh_vat",
        name: "Flesh Vat",
        description: "Organic matter writhes and grows in this pulsing container. Architect specialty.",
        cost: [
            { resourceId: 'living_flesh', amount: 3 },
            { resourceId: 'biomass', amount: 200 }
        ],
        canBeToggled: true,
        effectsPerSecond: [
            { type: 'add_resource', resourceId: 'living_flesh', amount: 0.005 }
        ],
        costPerSecond: [{ resourceId: 'biomass', amount: 5 }],
        prerequisites: [{ resourceId: 'living_flesh', minMax: 1 }]
    }
];
