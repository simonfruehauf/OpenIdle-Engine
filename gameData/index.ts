import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig, SlotConfig } from "../types";

import * as ResourceModule from './resources.ts';
import * as TaskModule from './tasks.ts';
import * as CategoryModule from './categories.ts';

const modules: any[] = [
    ResourceModule,
    TaskModule,
    CategoryModule
];

const allCategories: CategoryConfig[] = [];
const allResources: ResourceConfig[] = [];
const allTasks: TaskConfig[] = [];
const allActions: ActionConfig[] = [];
const allItems: ItemConfig[] = [];
const allSlots: SlotConfig[] = [];

modules.forEach(mod => {
    if (mod.CATEGORIES) allCategories.push(...mod.CATEGORIES);
    if (mod.RESOURCES) allResources.push(...mod.RESOURCES);
    if (mod.TASKS) allTasks.push(...mod.TASKS);
    if (mod.ACTIONS) allActions.push(...mod.ACTIONS);
    if (mod.ITEMS) allItems.push(...mod.ITEMS);
    if (mod.SLOTS) allSlots.push(...mod.SLOTS);
});

export const CATEGORIES = allCategories;
export const RESOURCES = allResources;
export const TASKS = allTasks;
export const ACTIONS = allActions;
export const ITEMS = allItems;
export const SLOTS = allSlots;