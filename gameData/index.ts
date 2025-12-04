import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig, SlotConfig } from "../types";

import * as CategoriesModule from './categories';
import * as ResourcesModule from './resources';
import * as TasksModule from './tasks';
import * as ActionsModule from './actions';
import * as EquipmentModule from './equipment';
import * as ChristmasModule from './christmas';
import * as QuestCatModule from './questlines/quest_cat';
import * as QuestMirrorModule from './questlines/quest_mirror';

const modules: any[] = [
    CategoriesModule,
    ResourcesModule,
    TasksModule,
    ActionsModule,
    EquipmentModule
];

// import and add quest modules
modules.push(QuestCatModule, QuestMirrorModule);


const allCategories: CategoryConfig[] = [];
const allResources: ResourceConfig[] = [];
const allTasks: TaskConfig[] = [];
const allActions: ActionConfig[] = [];
const allItems: ItemConfig[] = [];
const allSlots: SlotConfig[] = [];
const now = new Date();
if (now.getMonth() === 11) { // December is month 11 (0-indexed)    
    modules.push(ChristmasModule);
}

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