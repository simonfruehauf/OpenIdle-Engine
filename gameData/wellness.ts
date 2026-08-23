import { ActionConfig, CategoryConfig, ResourceConfig, TaskConfig, ItemConfig, SlotConfig } from "../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "wellness", name: "Wellness - Body Practices" },
];

export const RESOURCES: ResourceConfig[] = [];

export const SLOTS: SlotConfig[] = [
  { id: "accessory_2", name: "Accessory II", prerequisites: [{ actionId: "wellness_stitch_pouch_yoga", minExecutions: 1 }] },
];

export const TASKS: TaskConfig[] = [];
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
];
export const ITEMS: ItemConfig[] = [];
