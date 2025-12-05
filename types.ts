
export type ResourceID = string;
export type ActionID = string;
export type TaskID = string;
export type CategoryID = string;
export type ItemID = string;
export type SlotID = string;
export type ConverterID = string;

// --- Configuration Types ---
export interface PassiveGen {
  targetResourceId: ResourceID;
  ratePerUnit: number; // Amount of target generated per 1 unit of source per second
}

export interface ResourceConfig {
  id: ResourceID;
  name: string;
  type: 'basic' | 'stat'; // 'basic' = Left Col, 'stat' = Right Col
  category?: string; // Grouping for the UI (matches CategoryID usually)
  baseMax: number;
  initialAmount?: number;
  color?: string; // CSS class for bar color
  description?: string;
  passiveGen?: PassiveGen[];
}

export interface Cost {
  resourceId: ResourceID;
  amount: number;
  // If defined, cost = amount * (scaleFactor ^ currentLevelOrExecutions)
  // For Tasks, defaults to scaling by (Level - 1).
  // For Actions, scales by Executions.
  scaleFactor?: number;

  // If true (for Tasks only), scaling uses (Completions) instead of (Level - 1).
  scalesByCompletion?: boolean;

  // Defines how scaleFactor is applied. Default is 'exponential'.
  // 'fixed': cost = amount + (scaleFactor * exponent) (linear additive growth)
  // 'percentage': cost = amount * (1 + scaleFactor * exponent) (linear percentage growth)
  // 'exponential': cost = amount * (scaleFactor ^ exponent) (exponential growth, default if scaleType is not provided but scaleFactor is)
  scaleType?: 'exponential' | 'fixed' | 'percentage';
}

export interface Effect {
  type: 'add_resource' | 'modify_max_resource_flat' | 'modify_max_resource_pct' | 'modify_task_yield_pct' | 'add_item' | 'modify_passive_gen' | 'increase_max_tasks';
  amount: number;
  resourceId?: ResourceID;
  taskId?: TaskID;
  itemId?: ItemID;
  scaleType?: 'exponential' | 'fixed' | 'percentage';
  scaleFactor?: number;
  chance?: number; // 0-1 probability for effect to trigger (default 1)
  hidden?: boolean; // If true, effect is calculated but not shown in tooltips
}

// Items & Equipment
export interface ItemConfig {
  id: ItemID;
  name: string;
  description: string;
  slot: SlotID;
  effects: Effect[];
}

export interface SlotConfig {
  id: SlotID;
  name: string;
  prerequisites?: Prerequisite[]; // E.g., "Extra Arm" requires mutation
}

export interface TaskDrop {
  itemId: ItemID;
  chancePerSecond: number; // 0.0 to 1.0
}

// --- Conditions ---
export interface Prerequisite {
  resourceId?: ResourceID;
  minAmount?: number; // If defined, gets unlocked when amount is greater than or equal to this
  maxAmount?: number; // If defined, gets unlocked when amount is less than or equal to this
  minMax?: number; // if defined, gets unlocked when max (capacity) is greater than or equal to this

  actionId?: ActionID;
  minExecutions?: number;   // Requires action to be used X times (default 1)

  taskId?: TaskID;          // Requires specific task
  minLevel?: number;        // Requires task to be at least level X
}

export interface ActionConfig {
  id: ActionID;
  name: string;
  description: string;
  category: CategoryID;
  costs: Cost[];
  effects: Effect[];
  firstCompletionEffects?: Effect[]; // Rewards given ONLY the first time the action is executed
  maxExecutions?: number;
  cooldownMs?: number; //TODO: Currently not used, will have to be implemented
  prerequisites?: Prerequisite[];
  exclusiveWith?: ActionID[];
  locks?: string[]; // IDs of tasks/actions/resources to hide & disable upon purchase
  lockDescription?: string; // Text to display in UI about what is locked
  logMessage?: string; // Custom message to display in log when triggered
}

export interface TaskConfig {
  id: TaskID;
  name: string;
  description: string;
  category: CategoryID;
  type?: 'normal' | 'rest'; // 'rest' tasks can be auto-selected when resources run dry

  // Standard Loop Props
  costPerSecond: Cost[];
  effectsPerSecond: Effect[];
  xpPerSecond?: number;
  drops?: TaskDrop[];

  // Progress / Timed Task Props
  startCosts?: Cost[]; // One-time cost to begin the task
  progressRequired?: number; // Duration in seconds to complete. If set, task stops upon reaching this.
  autoRestart?: boolean; // If true, task restarts progress automatically upon completion (Loop behavior). Default false.

  completionEffects?: Effect[]; // Rewards given when progress reaches max
  firstCompletionEffects?: Effect[]; // Rewards given ONLY the first time the task is completed

  prerequisites?: Prerequisite[];
  locks?: string[]; // IDs of tasks/actions/resources to hide & disable
  lockDescription?: string; // Text to display in UI about what is locked
}

export interface CategoryConfig {
  id: CategoryID;
  name: string;
}

export interface ConverterConfig {
  id: ConverterID;
  name: string;
  description: string;
  cost: Cost[];                    // One-time purchase cost
  canBeToggled: boolean;           // If false, always runs when owned
  effectsPerSecond: Effect[];      // What it produces
  costPerSecond: Cost[];           // Ongoing resource drain
  prerequisites?: Prerequisite[];
}

export interface ConverterState {
  owned: boolean;
  active: boolean;
  unlocked: boolean;
}

// --- Runtime State Types ---

export interface ResourceState {
  current: number;
  unlocked: boolean;
}

export interface Modifier {
  sourceId: string;
  type: 'flat' | 'percent';
  value: number;
  // Targets 
  resourceId?: ResourceID;
  taskId?: TaskID;
  property?: 'max' | 'gen'; // 'max' (default) affects capacity, 'gen' affects passive generation
}

export interface ActionState {
  executions: number;
  unlocked: boolean;
  lastUsed?: number;
}

export interface TaskState {
  active: boolean;
  level: number;
  xp: number;
  unlocked: boolean;
  progress?: number; // Current progress in seconds (for timed tasks)
  completions?: number; // Number of times completed
  paid?: boolean; // Tracks if start costs have been paid for the current run
}

export interface GameState {
  resources: Record<ResourceID, ResourceState>;
  actions: Record<ActionID, ActionState>;
  tasks: Record<TaskID, TaskState>;
  converters: Record<ConverterID, ConverterState>;
  inventory: ItemID[]; // List of owned items
  equipment: Record<SlotID, ItemID>; // Slot -> ItemID
  modifiers: Modifier[]; // Permanent modifiers from upgrades
  log: string[];
  totalTimePlayed: number;
  activeTaskIds: string[]; // Track order of active tasks for concurrency limits
  maxConcurrentTasks: number; // Cap on active tasks
  selectedRestTaskId?: string; // ID of the task to auto-switch to when out of resources
  lastActiveTaskId?: string; // ID of the task that was running before auto-switch
}

export interface GameContextType {
  state: GameState;
  config: {
    resources: ResourceConfig[];
    actions: ActionConfig[];
    tasks: TaskConfig[];
    categories: CategoryConfig[];
    items: ItemConfig[];
    slots: SlotConfig[];
    converters: ConverterConfig[];
  };
  triggerAction: (actionId: ActionID) => void;
  toggleTask: (taskId: TaskID) => void;
  setRestTask: (taskId: string) => void;
  equipItem: (itemId: ItemID) => void;
  unequipItem: (slotId: SlotID) => void;
  buyConverter: (converterId: ConverterID) => void;
  toggleConverter: (converterId: ConverterID) => void;
  getMaxResource: (resourceId: ResourceID) => number;
  addLog: (msg: string) => void;
  checkPrerequisites: (prereqs?: Prerequisite[]) => boolean;
  checkIsVisible: (id: string, prereqs?: Prerequisite[]) => boolean;
  getResourceBreakdown: (resourceId: string) => any;
  getActiveModifiers: () => Modifier[];

  // Persistence
  saveGame: () => void;
  resetGame: () => void;
  exportSave: () => string;
  importSave: (saveData: string) => boolean;
}
