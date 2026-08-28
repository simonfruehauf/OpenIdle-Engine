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
import * as Ch2Tasks from "./chapter2/tasks";
import * as Ch2Actions from "./chapter2/actions";
import * as Ch2Equipment from "./chapter2/equipment";
import * as Ch3Tasks from "./chapter3/tasks";
import * as Ch3Actions from "./chapter3/actions";
import * as Ch3Equipment from "./chapter3/equipment";
import * as Ch4Tasks from "./chapter4/tasks";
import * as Ch4Actions from "./chapter4/actions";
import * as Ch4Equipment from "./chapter4/equipment";
import * as Ch5Tasks from "./chapter5/tasks";
import * as Ch5Actions from "./chapter5/actions";
import * as Ch5Equipment from "./chapter5/equipment";
import * as SideNotebook from "./side/notebook";
import * as SideSequences from "./side/sequences";
import * as SideBestiary from "./side/bestiary";
import * as LiveSeasons from "./live/seasons";
import * as LiveChallenges from "./live/challenges";

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
  BESTIARY?: any[];
  // Live content (data-only, not collected via generic collect but keep type open)
  SEASONS?: any[];
  MONTHLY_EVENTS?: any[];
  QUARTERLY_EVENTS?: any[];
  SEASONAL_MODIFIERS?: any[];
  CHALLENGE_MODES?: any[];
  [key: string]: any;
}

const modules: GameModule[] = [
  CoreCategories, CoreResources, CoreAspects, CoreBraids, CoreCastingForms,
  CoreEquipment, CoreConverters, Ch1Tasks, Ch1Actions, Ch1Equipment,
  Ch2Tasks, Ch2Actions, Ch2Equipment,
  Ch3Tasks, Ch3Actions, Ch3Equipment,
  Ch4Tasks, Ch4Actions, Ch4Equipment,
  Ch5Tasks, Ch5Actions, Ch5Equipment,
  SideNotebook, SideSequences, SideBestiary,
  LiveSeasons, LiveChallenges,
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
