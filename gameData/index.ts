// Module registry. Modules are registered here as content packs land.
export interface GameModule {
  CATEGORIES?: any[];
  RESOURCES?: any[];
  TASKS?: any[];
  ACTIONS?: any[];
  ITEMS?: any[];
  SLOTS?: any[];
  CONVERTERS?: any[];
}

const modules: GameModule[] = [];

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
