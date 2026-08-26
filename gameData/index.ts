// Module registry. Modules are registered here as content packs land.
import * as CoreCategories from "./core/categories";
import * as CoreResources from "./core/resources";
import * as CoreAspects from "./core/aspects";
import * as CoreBraids from "./core/braids";
import * as CoreCastingForms from "./core/castingForms";
import * as CoreEquipment from "./core/equipment";
import * as CoreConverters from "./core/converters";
import * as Ch1Tasks from "./chapter1/tasks";
import * as Ch1Actions from "./chapter1/actions";
import * as Ch1Equipment from "./chapter1/equipment";

export interface GameModule {
  CATEGORIES?: any[];
  RESOURCES?: any[];
  TASKS?: any[];
  ACTIONS?: any[];
  ITEMS?: any[];
  SLOTS?: any[];
  CONVERTERS?: any[];
  ASPECTS?: any[];
  SPELLS?: any[];
  BRAIDS?: any[];
  BRAID_SPELLS?: any[];
  CASTING_FORMS?: any[];
}

const modules: GameModule[] = [
  CoreCategories, CoreResources, CoreAspects, CoreBraids, CoreCastingForms,
  CoreEquipment, CoreConverters, Ch1Tasks, Ch1Actions, Ch1Equipment,
];

function collect<T>(key: keyof GameModule): T[] {
  return modules.flatMap(m => (m[key] as T[]) || []);
}

export const CATEGORIES = collect<any>("CATEGORIES");
export const RESOURCES = collect<any>("RESOURCES");
export const TASKS = collect<any>("TASKS");
export const ACTIONS = collect<any>("ACTIONS");
export const ITEMS = collect<any>("ITEMS");
export const SLOTS = collect<any>("SLOTS");
export const CONVERTERS = collect<any>("CONVERTERS");
// Braid spells live in their own module export (core/braids.ts: BRAID_SPELLS);
// fold them into the unified SPELLS registry so they aren't silently dropped.
export const SPELLS = [...collect<any>("SPELLS"), ...collect<any>("BRAID_SPELLS")];
