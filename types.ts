
export type ResourceID = string;
export type ActionID = string;
export type TaskID = string;
export type CategoryID = string;
export type ItemID = string;
export type SlotID = string;

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
  scaleFactor?: number; // Cost multiplies by this per level
}

export interface Effect {
  type: 'add_resource' | 'modify_max_resource_flat' | 'modify_max_resource_pct' | 'modify_task_yield_pct' | 'add_item' | 'modify_passive_gen' | 'increase_max_tasks';
  resourceId?: ResourceID; 
  taskId?: TaskID;
  itemId?: ItemID;         
  amount: number;
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
  minAmount?: number;       
  minMax?: number;          
  
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
}

export interface CategoryConfig {
  id: CategoryID;
  name: string;
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
  };
  triggerAction: (actionId: ActionID) => void;
  toggleTask: (taskId: TaskID) => void;
  setRestTask: (taskId: string) => void;
  equipItem: (itemId: ItemID) => void;
  unequipItem: (slotId: SlotID) => void;
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
