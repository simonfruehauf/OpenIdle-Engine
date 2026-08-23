import { ActionConfig, CategoryConfig, ResourceConfig, TaskConfig, ItemConfig, SlotConfig } from "../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "wellness", name: "Wellness - Body Practices" },
];

export const RESOURCES: ResourceConfig[] = [];

export const SLOTS: SlotConfig[] = [
  { id: "accessory_2", name: "Accessory II", prerequisites: [{ actionId: "wellness_stitch_pouch", minExecutions: 1 }] },
];

export const TASKS: TaskConfig[] = [
  {
    id: "rest_yoga",
    name: "Yoga Flow",
    description: "Held breaths, slow transitions. Mana gathers like heat.",
    category: "wellness",
    type: "rest",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 0.6, scaleFactor: 0.02, scaleType: "fixed" },
      { type: "add_resource", resourceId: "health", amount: 0.4, scaleFactor: 0.02, scaleType: "fixed" },
      { type: "add_resource", resourceId: "mana", amount: 0.7, scaleFactor: 0.04, scaleType: "fixed" },
    ],
    prerequisites: [{ actionId: "wellness_choose_yoga", minExecutions: 1 }],
    xpPerSecond: 6,
  },
  {
    id: "rest_running",
    name: "Street Run",
    description: "Counterclockwise loops. Time stretches when you chase it.",
    category: "wellness",
    type: "rest",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 1.1, scaleFactor: 0.05, scaleType: "fixed" },
      { type: "add_resource", resourceId: "health", amount: 0.6, scaleFactor: 0.03, scaleType: "fixed" },
      { type: "add_resource", resourceId: "mana", amount: 0.15, scaleFactor: 0.01, scaleType: "fixed" },
    ],
    prerequisites: [{ actionId: "wellness_choose_running", minExecutions: 1 }],
    xpPerSecond: 6,
  },
  {
    id: "rest_swimming",
    name: "Lap Swimming",
    description: "Two lengths, breathe, turn. Health steadies.",
    category: "wellness",
    type: "rest",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 0.7, scaleFactor: 0.03, scaleType: "fixed" },
      { type: "add_resource", resourceId: "health", amount: 0.7, scaleFactor: 0.04, scaleType: "fixed" },
      { type: "add_resource", resourceId: "mana", amount: 0.4, scaleFactor: 0.02, scaleType: "fixed" },
    ],
    prerequisites: [{ actionId: "wellness_choose_swimming", minExecutions: 1 }],
    xpPerSecond: 6,
  },
  {
    id: "rest_hiking",
    name: "Trail Hike",
    description: "Elevation and quiet. Time pays you back with spare change found on trails.",
    category: "wellness",
    type: "rest",
    progressRequired: 1,
    autoRestart: true,
    costPerSecond: [],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "time", amount: 0.9, scaleFactor: 0.04, scaleType: "fixed" },
      { type: "add_resource", resourceId: "health", amount: 0.5, scaleFactor: 0.02, scaleType: "fixed" },
      { type: "add_resource", resourceId: "mana", amount: 0.3, scaleFactor: 0.02, scaleType: "fixed" },
      { type: "add_resource", resourceId: "money", amount: 0.05, scaleFactor: 0.01, scaleType: "fixed" },
    ],
    prerequisites: [{ actionId: "wellness_choose_hiking", minExecutions: 1 }],
    xpPerSecond: 6,
  },
];
export const ACTIONS: ActionConfig[] = [
  {
    id: "wellness_find_flyer",
    name: "Find Wellness Flyer",
    description: "Tucked under your bench: 'Free trial — yoga, running, swimming, hiking. Learn to rest on purpose.' The paper smells faintly of cedar.",
    category: "wellness",
    costs: [],
    effects: [{ type: "modify_max_resource_flat", resourceId: "mana", amount: 3 }],
    prerequisites: [{ actionId: "appartment", minExecutions: 1 }, { taskId: "rest_bench", minLevel: 2 }],
    maxExecutions: 1,
    logMessage: "A flyer flutters. Four paths to rest."
  },
  {
    id: "wellness_choose_yoga",
    name: "Enroll: Yoga",
    description: "Slow breath, held shapes. You learn where you hold tension and how to put it down.",
    category: "wellness",
    costs: [{ resourceId: "money", amount: 25 }],
    effects: [],
    prerequisites: [{ actionId: "wellness_find_flyer", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["wellness_choose_running","wellness_choose_swimming","wellness_choose_hiking"],
    locks: ["wellness_choose_running","wellness_choose_swimming","wellness_choose_hiking","rest_running","rest_swimming","rest_hiking"],
    lockDescription: "Choosing Yoga closes Running, Swimming, Hiking.",
    logMessage: "You sign for yoga. The other flyers fade."
  },
  {
    id: "wellness_choose_running",
    name: "Enroll: Running",
    description: "Pavement, breath, rhythm. The city becomes a loop you can master.",
    category: "wellness",
    costs: [{ resourceId: "money", amount: 25 }],
    effects: [],
    prerequisites: [{ actionId: "wellness_find_flyer", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["wellness_choose_yoga","wellness_choose_swimming","wellness_choose_hiking"],
    locks: ["wellness_choose_yoga","wellness_choose_swimming","wellness_choose_hiking","rest_yoga","rest_swimming","rest_hiking"],
    lockDescription: "Choosing Running closes others.",
    logMessage: "You lace up. The mat and pool can wait."
  },
  {
    id: "wellness_choose_swimming",
    name: "Enroll: Swimming",
    description: "Water holds you without asking. You count strokes and forget to count problems.",
    category: "wellness",
    costs: [{ resourceId: "money", amount: 25 }],
    effects: [],
    prerequisites: [{ actionId: "wellness_find_flyer", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["wellness_choose_yoga","wellness_choose_running","wellness_choose_hiking"],
    locks: ["wellness_choose_yoga","wellness_choose_running","wellness_choose_hiking","rest_yoga","rest_running","rest_hiking"],
    lockDescription: "Choosing Swimming closes others.",
    logMessage: "Chlorine and quiet. You choose the pool."
  },
  {
    id: "wellness_choose_hiking",
    name: "Enroll: Hiking",
    description: "Dirt, incline, sky. Time dilates at altitude.",
    category: "wellness",
    costs: [{ resourceId: "money", amount: 25 }],
    effects: [],
    prerequisites: [{ actionId: "wellness_find_flyer", minExecutions: 1 }],
    maxExecutions: 1,
    exclusiveWith: ["wellness_choose_yoga","wellness_choose_running","wellness_choose_swimming"],
    locks: ["wellness_choose_yoga","wellness_choose_running","wellness_choose_swimming","rest_yoga","rest_running","rest_swimming"],
    lockDescription: "Choosing Hiking closes others.",
    logMessage: "You pick the trail. The map is already creased."
  },
  {
    id: "wellness_stitch_pouch",
    name: "Stitch Second Pouch",
    description: "You sew a second pocket onto your bag. It takes time, money, and the discipline you learned from your practice.",
    category: "wellness",
    costs: [{ resourceId: "money", amount: 80 }, { resourceId: "mana", amount: 15 }],
    effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 4 }],
    prerequisites: [{ actionId: "wellness_find_flyer", minExecutions: 1 }],
    maxExecutions: 1,
    logMessage: "Your bag now holds two charms. The second pouch hangs light."
  },
];
export const ITEMS: ItemConfig[] = [];
