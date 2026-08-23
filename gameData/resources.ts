import { ResourceConfig } from "../types";

export const RESOURCES: ResourceConfig[] = [

  // BODY
  {
    id: "time",
    name: "Time",
    type: "stat",
    baseMax: 12,
    initialAmount: 12,
    color: "bg-orange-300",
    description: "There is so little in a day..."
  },
  {
    id: "health",
    name: "Health",
    type: "stat",
    baseMax: 12,
    initialAmount: 12,
    color: "bg-orange-300",
    description: "Strength of body and mind."
  },
  {
    id: "mana",
    name: "Mana",
    type: "stat",
    baseMax: 0,
    initialAmount: 0,
    color: "bg-blue-400",
    description: ""
  },
  {
    id: "insanity",
    name: "Insanity",
    type: "stat",
    category: "oddness",
    color: "bg-gray-400",
    baseMax: 0,
    initialAmount: 0,
    description: "",
    passiveGen: [{ targetResourceId: 'time', ratePerUnit: -0.02 }]
  },
  // RESOURCES
  {
    id: "money",
    name: "Money",
    type: "basic",
    baseMax: 5,
    initialAmount: 0,
    description: "Grimy notes and worn coins. Worth more than your dignity, apparently."
  },
  {
    id: "lore",
    name: "Lore",
    type: "basic",
    category: "oddness",
    baseMax: 0,
    initialAmount: 0,
    description: ""
  },

  {
    id: "cat",
    name: "Cat",
    type: "basic",
    category: "oddness",
    baseMax: 0,
    initialAmount: 0,
    description: "An odd furball with a pair of eyes.",
    passiveGen: [{ targetResourceId: 'insanity', ratePerUnit: 0.01 }]
  },
  {
    id: "insight",
    name: "Insight",
    type: "basic",
    category: "strange",
    baseMax: 0,
    initialAmount: 0,
    description: "A flicker of understanding about the true nature of things."
  }
];
