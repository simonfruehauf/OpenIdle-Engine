
export type ResourceID = string;
export type ActionID = string;
export type TaskID = string;
export type CategoryID = string;
export type ItemID = string;
export type SlotID = string;
export type ConverterID = string;

// --- SUNDERED IDs ---
export type AspectID = 'ash' | 'root' | 'hush' | 'iron';
export type BraidID = 'smolder' | 'dormancy' | 'heartwood' | 'temper';
export type EndgamePath = 'warden' | 'mender' | 'wellspring';

// --- Configuration Types ---
export interface PassiveGen {
  targetResourceId: ResourceID;
  ratePerUnit: number; // Amount of target generated per 1 unit of source per second
}

/**
 * Defines a category, which can have a parent to create hierarchy.
 */
export interface CategoryConfig {
  id: CategoryID;
  name: string;
  parentCategoryId?: CategoryID | null; // Null if it's a root category
}

export interface ResourceConfig {
  id: ResourceID;
  name: string;
  type: 'basic' | 'stat'; // 'basic' = Left Col, 'stat' = Right Col
  category?: CategoryID; // Grouping for the UI (references a specific category ID)
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
  type: 'add_resource' | 'modify_max_resource_flat' | 'modify_max_resource_pct' | 'modify_yield_pct' | 'modify_yield_flat' | 'add_item' | 'modify_passive_gen' | 'increase_max_tasks' | 'increase_max_executions' | 'set_max_resource' | 'reset_resource_modifiers' | 'add_passive_gen_per_unit' | 'set_flag' | 'modify_failure_chance' | 'unlock_casting_form' | 'modify_aspect_fluency' | 'modify_cooldown_flat';
  amount: number;
  resourceId?: ResourceID;
  taskId?: TaskID;
  actionId?: ActionID;
  itemId?: ItemID;
  scaleType?: 'exponential' | 'fixed' | 'percentage';
  scaleFactor?: number;
  chance?: number; // 0-1 probability for effect to trigger (default 1)
  hidden?: boolean; // If true, effect is calculated but not shown in tooltips
  // For add_passive_gen_per_unit:
  sourceResourceId?: ResourceID; // Resource to count units of
  targetResourceId?: ResourceID; // Resource to generate
  // SUNDERED effects:
  flagId?: string;          // set_flag
  aspectId?: AspectID;      // modify_aspect_fluency / aspect-scoped effects
  formId?: string;          // unlock_casting_form
}

// --- SUNDERED Config Types ---
export interface SpellConfig {
  id: string;
  name: string;
  description: string;
  aspectId?: AspectID;
  braidId?: BraidID;
  workingId?: string;
  tier: number;
  baseManaCost: number;
  baseMotesYield: number;
  baseCooldownMs: number;
  failureFlavor: string;
  failureEffect?: Effect[];
}

export interface AspectConfig {
  id: AspectID;
  name: string;
  description: string;
  color: string;
  costGrowthFactor: number;   // applied per tier for costs
  yieldGrowthFactor: number;  // applied per tier for yields
  failureFlavor: string;
}

export interface BraidWorking {
  id: string;
  name: string;
  description: string;
}

export interface BraidConfig {
  id: BraidID;
  name: string;
  parentAspects: [AspectID, AspectID];
  description: string;
  workings: BraidWorking[];
  signatureQuirk: string;
  unlockChapter: number;
}

export interface CastingFormModifier {
  id: string;
  axis: 'method' | 'duration' | 'target';
  value: string;
  displayName: string;
  description: string;
  costMultiplier: number;
  effectMultiplier: number;
  variance?: number;
  reliabilityBonus?: number; // reduces failure chance (0-0.2 typical)
  continuousDrainPerSecond?: number; // Sustained
  triggerDelaySeconds?: number;      // Delayed
  minTier?: number;                  // chapter gate
}

export interface UnlockPath {
  id: string;
  effect: 'modify_max_resource_flat' | 'increase_stat_flat' | 'set_flag' | 'unlock_braid' | 'unlock_form';
  resourceId?: string;
  target?: string;
  amount: number;
  condition?: {
    type: 'tasksCompleted' | 'aspectFluencyLevel' | 'levelReached' | 'cleanCastings' | 'studySessions' | 'braidPractice' | 'sustainedCastings' | 'listeningTasks';
    value: number;
  };
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
  prerequisites?: Prerequisite[]; // E.g., "Extra Arm" requires mutation (AND)
  prerequisitesAny?: Prerequisite[]; // OR: if present, at least one entry must be satisfied (each entry is AND internally)
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
  cooldownMs?: number; // Cooldown in ms between executions (enforced in TRIGGER_ACTION via lastUsed)
  prerequisites?: Prerequisite[];
  exclusiveWith?: ActionID[];
  locks?: string[]; // IDs of tasks/actions/resources to hide & disable upon purchase
  lockDescription?: string; // Text to display in UI about what is locked
  logMessage?: string; // Custom message to display in log when triggered
  hideWhenComplete?: boolean; // If true, action is hidden when maxExecutions reached (default: show in Completed tab)
  spellId?: string; // If set, casting actions resolve this SpellConfig via CAST_SPELL
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

  maxExecutions?: number; // If set, task can only be completed this many times

  prerequisites?: Prerequisite[];
  locks?: string[]; // IDs of tasks/actions/resources to hide & disable
  lockDescription?: string; // Text to display in UI about what is locked
  hideWhenComplete?: boolean; // If true, task is hidden when maxExecutions reached (default: show in Completed tab)
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
  type: 'flat' | 'percent' | 'set';
  value: number;
  // Targets 
  resourceId?: ResourceID;
  taskId?: TaskID;
  actionId?: ActionID;
  property?: 'max' | 'gen' | 'max_exec' | 'yield' | 'gen_per_unit' | 'failure_chance' | 'cooldown'; // 'max' (default) affects capacity, 'gen' affects passive generation, 'gen_per_unit' generates target per unit of source
  // For gen_per_unit:
  sourceResourceId?: ResourceID; // Resource to count units of
  targetResourceId?: ResourceID; // Resource to generate
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

export type LogCategory = 'flavour' | 'loot' | 'unlock' | 'other';

export interface LogEntry {
  msg: string;
  category: LogCategory;
}

export interface GameState {
  version: number; // Save version for migrations
  resources: Record<ResourceID, ResourceState>;
  actions: Record<ActionID, ActionState>;
  tasks: Record<TaskID, TaskState>;
  converters: Record<ConverterID, ConverterState>;
  inventory: ItemID[]; // List of owned items
  equipment: Record<SlotID, ItemID>; // Slot -> ItemID
  modifiers: Modifier[]; // Permanent modifiers from upgrades
  log: LogEntry[];
  totalTimePlayed: number;
  activeTaskIds: string[]; // Track order of active tasks for concurrency limits
  maxConcurrentTasks: number; // Cap on active tasks
  restTaskId: string | null; // Auto-selected task when resources run dry
  previousTaskId: string | null; // Task to return to after resting

  // SUNDERED state
  flags: Record<string, boolean>;
  aspectFluency: Record<AspectID, number>;       // clean castings
  failedCastings: Record<AspectID, number>;
  castingFormsUnlocked: Record<string, boolean>;
  activeFormSelection: { method?: string; duration?: string; target?: string };
  chapter: number;
  endgamePath?: EndgamePath;
  sustainedSpells: { spellId: string; aspectId?: AspectID; remainingSeconds: number }[];
  footprintCounter: number; // Unwitnessed challenge tracking
}

export interface GameContextType {
  state: GameState;
  config: {
    resources: ResourceConfig[];
    actions: ActionConfig[];
    tasks: TaskConfig[];
    categories: CategoryConfig[]; // Now contains the tree structure
    items: ItemConfig[];
    slots: SlotConfig[];
    converters: ConverterConfig[];
  };
  triggerAction: (actionId: ActionID) => void;
  toggleTask: (taskId: TaskID) => void;
  equipItem: (itemId: ItemID) => void;
  unequipItem: (slotId: SlotID) => void;
  buyConverter: (converterId: ConverterID) => void;
  toggleConverter: (converterId: ConverterID) => void;
  getMaxResource: (resourceId: ResourceID) => number;
  addLog: (msg: string, category?: LogCategory) => void;
  checkPrerequisites: (prereqs?: Prerequisite[]) => boolean;
  checkIsVisible: (id: string, prereqs?: Prerequisite[]) => boolean;
  getResourceBreakdown: (resourceId: string) => any;
  getActiveModifiers: () => Modifier[];

  // Persistence
  saveGame: () => void;
  resetGame: () => void;
  exportSave: () => string;
  importSave: (saveData: string) => boolean;
  setRestTask: (taskId: string | null) => void;

  // SUNDERED
  castSpell: (actionId: ActionID) => void;
  selectForm: (axis: 'method' | 'duration' | 'target', formId: string | null) => void;
  getFailureChance: (spellId: string) => number;
  secondKindling: () => void;
}
