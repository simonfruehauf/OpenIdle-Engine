import { TaskConfig } from "../types";

export const TASKS: TaskConfig[] = [
  {
    id: "rest",
    name: "Hibernate",
    description: "Spend time in a dormant state to conserve energy.",
    category: "mundane",
    type: "rest",
    progressRequired: 0,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [ 
      { type: "add_resource", resourceId: "nutrients", amount: 0.5 }
    ],
    xpPerSecond: 1
  }
];