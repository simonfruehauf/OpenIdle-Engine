import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig, SlotConfig, ConverterConfig } from "../types";

import * as CategoriesModule from './categories';
import * as ResourcesModule from './resources';
import * as TasksModule from './tasks';
import * as ActionsModule from './actions';
import * as EquipmentModule from './equipment';
import * as ConvertersModule from './converters';
import * as CatModule from './cat/catpaths';
import * as BelthaneModule from './belthane';
import * as LibraryModule from './library';
import * as NightMarketModule from './nightmarket';
import * as EndgameModule from './endgame';
import * as WellnessModule from './wellness';
import * as ScavengingModule from './scavenging';
import * as LibraryAssistantModule from './jobs/libraryAssistant';
import * as BaristaModule from './jobs/barista';
import * as CommunityGardenModule from './jobs/communityGarden';
import * as SubwayTunnelsModule from './sideBranches/subwayTunnels';
import * as RooftopGardenModule from './sideBranches/rooftopGarden';
import * as FightingRingModule from './sideBranches/fightingRing';

// Seasonal content
// import * as ChristmasModule from './christmas';

export interface GameModule {
    CATEGORIES?: CategoryConfig[];
    RESOURCES?: ResourceConfig[];
    TASKS?: TaskConfig[];
    ACTIONS?: ActionConfig[];
    ITEMS?: ItemConfig[];
    SLOTS?: SlotConfig[];
    CONVERTERS?: ConverterConfig[];
}

const modules: GameModule[] = [
    CategoriesModule,
    ResourcesModule,
    TasksModule,
    ActionsModule,
    EquipmentModule,
    ConvertersModule,
    CatModule,
    BelthaneModule,
    LibraryModule,
    NightMarketModule,
    EndgameModule,
    WellnessModule,
    ScavengingModule,
    LibraryAssistantModule,
    BaristaModule,
    CommunityGardenModule,
    SubwayTunnelsModule,
    RooftopGardenModule,
    FightingRingModule
];

// Add quest modules
// modules.push(QuestCatModule);


// Conditional Christmas loading (December only)
/*
const currentMonth = new Date().getMonth();
if (currentMonth === 11) { // December
    modules.push(ChristmasModule);
}
*/

const allCategories: CategoryConfig[] = [];
const allResources: ResourceConfig[] = [];
const allTasks: TaskConfig[] = [];
const allActions: ActionConfig[] = [];
const allItems: ItemConfig[] = [];
const allSlots: SlotConfig[] = [];
const allConverters: ConverterConfig[] = [];

modules.forEach(mod => {
    if (mod.CATEGORIES) allCategories.push(...mod.CATEGORIES);
    if (mod.RESOURCES) allResources.push(...mod.RESOURCES);
    if (mod.TASKS) allTasks.push(...mod.TASKS);
    if (mod.ACTIONS) allActions.push(...mod.ACTIONS);
    if (mod.ITEMS) allItems.push(...mod.ITEMS);
    if (mod.SLOTS) allSlots.push(...mod.SLOTS);
    if (mod.CONVERTERS) allConverters.push(...mod.CONVERTERS);
});

export const CATEGORIES = allCategories;
export const RESOURCES = allResources;
export const TASKS = allTasks;
export const ACTIONS = allActions;
export const ITEMS = allItems;
export const SLOTS = allSlots;
export const CONVERTERS = allConverters;