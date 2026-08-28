import { TaskConfig } from "../../types";

export const TASKS: TaskConfig[] = [
  {
    id: "deep_listening",
    name: "Deep Listening",
    description: "Sit where the Sundering's undertow is audible beneath all four Aspects. Listening is practice, not idleness - it trains the ear for what has no sound.",
    category: "wound_answers",
    progressRequired: 30,
    autoRestart: true,
    costPerSecond: [{ resourceId: "focus", amount: 0.5 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 0.85 }],
    xpPerSecond: 10,
    prerequisites: [{ taskId: "sustain_training", minExecutions: 3 }],
  },
  {
    id: "hold_two_currents",
    name: "Hold Two Currents",
    description: "Sustain two workings at once and keep them steady while the deep current pulls at both. Training for what comes after sustain alone.",
    category: "wound_answers",
    progressRequired: 35,
    autoRestart: true,
    costPerSecond: [{ resourceId: "focus", amount: 0.85 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 1.05 }],
    xpPerSecond: 11,
    prerequisites: [
      { taskId: "sustain_training", minExecutions: 3 },
      { taskId: "deep_listening", minExecutions: 3 },
    ],
  },
  {
    id: "deep_current_meditation",
    name: "Deep Current Meditation",
    description: "Tap the world's own undertow directly. Once the current is open, this generates Deep Current itself - slow, inexorable, the wound's other answer.",
    category: "wound_answers",
    costPerSecond: [{ resourceId: "focus", amount: 0.65 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "deep_current", amount: 0.08 }],
    xpPerSecond: 12,
    prerequisites: [{ actionId: "unlock_deep_current", minExecutions: 1 }],
  },
];
