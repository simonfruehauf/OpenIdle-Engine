import { ActionConfig, CategoryConfig, ResourceConfig, TaskConfig, ItemConfig, SlotConfig } from "../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "wellness", name: "Wellness - Body Practices" },
];

export const RESOURCES: ResourceConfig[] = [];

export const SLOTS: SlotConfig[] = [
  { id: "accessory_2", name: "Accessory II", prerequisites: [{ actionId: "wellness_stitch_pouch_yoga", minExecutions: 1 }] },
];

export const TASKS: TaskConfig[] = [];
export const ACTIONS: ActionConfig[] = [];
export const ITEMS: ItemConfig[] = [];
