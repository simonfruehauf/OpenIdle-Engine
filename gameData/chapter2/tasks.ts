import { TaskConfig } from "../../types";

export const TASKS: TaskConfig[] = [
  {
    id: "stonewatch_practice",
    name: "Stonewatch Practice",
    description: "Harden a stone's surface under Conclave instruction. Introductory Iron - heavy and stable, costs a bit more but leaves solid residue.",
    category: "iron",
    progressRequired: 5,
    autoRestart: true,
    costPerSecond: [{ resourceId: "focus", amount: 0.4 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 0.45 }],
    xpPerSecond: 5,
    prerequisites: [{ actionId: "widow_cathal_visit", minExecutions: 1 }],
  },
  {
    id: "focus_meditation",
    name: "Focus Meditation",
    description: "Sit with the scar's light and steady your mind. Conclave discipline - taught only after Cathal sends you on.",
    category: "chapter2",
    type: "rest",
    costPerSecond: [],
    effectsPerSecond: [{ type: "add_resource", resourceId: "focus", amount: 0.3 }],
    xpPerSecond: 2,
    prerequisites: [{ actionId: "widow_cathal_visit", minExecutions: 1 }],
  },
  {
    id: "mote_study",
    name: "Mote Study",
    // Loop economy plus timed sessions (progressRequired+autoRestart): completions gate
    // skyglass_unlock / converter prerequisites - DESIGN.md Section 7 "three dedicated study sessions".
    description: "Catalogue the residue castings leave behind.",
    category: "chapter2",
    progressRequired: 30,
    autoRestart: true,
    costPerSecond: [{ resourceId: "focus", amount: 0.4 }],
    effectsPerSecond: [{ type: "add_resource", resourceId: "motes", amount: 0.8 }],
    xpPerSecond: 6,
    prerequisites: [
      // Documented approximation of "complete 10 castings of any kind" (engine has no OR prerequisites).
      { actionId: "cast_ash", minExecutions: 10 },
    ],
  },
  {
    id: "library_duty",
    name: "Library Duty",
    description: "Assist Osrun Fell among the stacks. Small Focus gain; history waits here.",
    category: "chapter2",
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "focus", amount: 0.15 },
      { type: "add_resource", resourceId: "motes", amount: 0.1 },
    ],
    xpPerSecond: 3,
    prerequisites: [{ actionId: "widow_cathal_visit", minExecutions: 1 }],
  },
];
