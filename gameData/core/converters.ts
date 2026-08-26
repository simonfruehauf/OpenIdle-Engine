import { ConverterConfig } from "../../types";

export const CONVERTERS: ConverterConfig[] = [
  {
    id: "mote_condenser",
    name: "Mote Condenser",
    description: "Compresses loose Motes back into usable Mana.",
    cost: [{ resourceId: "motes", amount: 50 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "motes", amount: 0.5 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "mana", amount: 0.4 }],
    prerequisites: [{ taskId: "mote_study", minExecutions: 3 }],
  },
  {
    id: "skyglass_tuner",
    name: "Skyglass Tuner",
    description: "A shard of the Sundering, humming. Refines Motes at remarkable rates.",
    cost: [{ resourceId: "skyglass", amount: 10 }],
    canBeToggled: true,
    costPerSecond: [{ resourceId: "motes", amount: 2 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "mana", amount: 2 }],
    prerequisites: [{ resourceId: "skyglass", minMax: 1 }, { taskId: "mote_study", minExecutions: 3 }],
  },
  {
    id: "deep_current_tap",
    name: "Undertow Tap",
    description: "Draws on the world's own undertow while you work.",
    cost: [{ resourceId: "skyglass", amount: 40 }],
    canBeToggled: false,
    costPerSecond: [],
    effectsPerSecond: [{ type: "add_resource", resourceId: "deep_current", amount: 0.05 }],
    prerequisites: [{ resourceId: "deep_current", minMax: 1 }],
  },
];
