import { ResourceConfig } from "../types";

export const RESOURCES: ResourceConfig[] = [

  // BODY
  {
    id: "stamina",
    name: "Stamina",
    type: "stat",
    baseMax: 10,
    initialAmount: 10,
    color: "bg-orange-300",
    description: ""
  },
  {
    id: "health",
    name: "Health",
    type: "stat",
    baseMax: 5,
    initialAmount: 5,
    color: "bg-red-400",
    description: ""
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
    id: "sanity",
    name: "Sanity",
    type: "stat",
    baseMax: 0,
    initialAmount: 0,
    color: "bg-gray-400",
    description: ""
  },
  // RESOURCES
  {
    id: "money",
    name: "Money",
    type: "basic",
    baseMax: 5,
    initialAmount: 0,
    description: ""
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
    passiveGen: [{ targetResourceId: 'sanity', ratePerUnit: 0.3 }]
  }
];
