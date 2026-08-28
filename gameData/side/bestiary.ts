import { ActionConfig } from "../../types";

// Narrative-only creature entries. Engine data is ACTIONS that unlock flags;
// a future Codex UI can render BESTIARY directly. Keeping both exports ensures
// validate passes (ACTIONS references are checkable) and the catalog is consumable.

export interface BestiaryEntry {
  id: string;
  name: string;
  aspect: string;
  description: string;
  sign: string;
}

export const BESTIARY: BestiaryEntry[] = [
  {
    id: "emberling",
    name: "Emberling",
    aspect: "Ash",
    description: "Scavengers of spent heat. Indicate Smolder left too long - the quiet burn makes noise all at once when they gather.",
    sign: "Ashfall without flame; warm stones in cold rooms.",
  },
  {
    id: "bramblehound",
    name: "Bramblehound",
    aspect: "Root",
    description: "Feral dogs entangled in living vines. Root growth that forgot the animal underneath.",
    sign: "Brambles that track movement; hounds that do not age where the vine holds.",
  },
  {
    id: "unremembered",
    name: "The Unremembered",
    aspect: "Hush",
    description: "Thoroughly Hush-affected - hard to recall even while observed. Once, it erased the caster's memory of casting it.",
    sign: "A name that will not stay on the tongue; a bell that rings silently.",
  },
  {
    id: "greyfen_sentinel",
    name: "Greyfen Sentinel",
    aspect: "Iron",
    description: "Anchored constructs on the Greyfen, permanent fixtures. Bedrock extended into watchers.",
    sign: "Stone that faces the same direction, season after season; ground that will not move, even for water.",
  },
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "encounter_emberling",
    name: "Bestiary: Emberling",
    description: "Ash - scavengers indicating Smolder left too long. Track them where the quiet burn should not be.",
    category: "notebook",
    costs: [{ resourceId: "motes", amount: 8 }],
    effects: [{ type: "set_flag", flagId: "bestiary_emberling", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_ash", minExecutions: 20 },
      { actionId: "cast_smolder", minExecutions: 1 },
    ],
    logMessage: "Emberling - warm stones, ashfall without flame. You log the scavengers.",
  },
  {
    id: "encounter_bramblehound",
    name: "Bestiary: Bramblehound",
    description: "Root - feral dogs entangled in vines. Dormancy may hold them, Heartwood would make them permanent.",
    category: "notebook",
    costs: [{ resourceId: "motes", amount: 8 }],
    effects: [{ type: "set_flag", flagId: "bestiary_bramblehound", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_root", minExecutions: 20 },
      { actionId: "cast_heartwood", minExecutions: 1 },
    ],
    logMessage: "Bramblehound - vines track before the hound does. You log the entanglement.",
  },
  {
    id: "encounter_unremembered",
    name: "Bestiary: The Unremembered",
    description: "Hush - thoroughly affected, hard to recall even while observed.",
    category: "notebook",
    costs: [{ resourceId: "motes", amount: 10 }],
    effects: [{ type: "set_flag", flagId: "bestiary_unremembered", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_hush", minExecutions: 20 },
      { actionId: "cast_dormancy", minExecutions: 1 },
    ],
    logMessage: "The Unremembered - you write the name quickly, before it leaves.",
  },
  {
    id: "encounter_greyfen_sentinel",
    name: "Bestiary: Greyfen Sentinel",
    description: "Iron - anchored constructs, permanent fixtures on the Greyfen battlefield.",
    category: "notebook",
    costs: [{ resourceId: "motes", amount: 10 }],
    effects: [{ type: "set_flag", flagId: "bestiary_greyfen_sentinel", amount: 1 }],
    maxExecutions: 1,
    prerequisites: [
      { actionId: "cast_iron", minExecutions: 20 },
      { actionId: "cast_temper", minExecutions: 1 },
    ],
    logMessage: "Greyfen Sentinel - stone facing one direction, season after season. You log the watcher.",
  },
];
