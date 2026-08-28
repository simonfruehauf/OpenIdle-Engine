import { ResourceConfig } from "../../types";

export const RESOURCES: ResourceConfig[] = [
  {
    id: "mana",
    name: "Mana",
    type: "stat",
    baseMax: 40,
    initialAmount: 12,
    color: "bg-blue-500",
    description: "Raw magical reserve. Spent per casting; regenerates slowly. Starts low - earn your capacity.",
  },
  {
    id: "focus",
    name: "Focus",
    type: "stat",
    baseMax: 20,
    initialAmount: 8,
    color: "bg-purple-500",
    description: "Concentration and control. Raises reliability, shortens cooldowns. The first task teaches you to steady it.",
  },
  {
    id: "motes",
    name: "Motes",
    type: "basic",
    baseMax: 999999999,
    initialAmount: 0,
    description: "Residue shaken loose by casting. Core crafting currency; converts to Mana.",
  },
  {
    id: "skyglass",
    name: "Skyglass",
    type: "basic",
    baseMax: 0,
    initialAmount: 0,
    description: "Physical shards of the Sundering itself. Found, not farmed.",
  },
  {
    id: "deep_current",
    name: "Deep Current",
    type: "basic",
    baseMax: 0,
    initialAmount: 0,
    description: "The world's own slow undertow of raw magic.",
  },
];
