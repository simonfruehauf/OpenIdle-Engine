import { TaskConfig, ItemConfig } from "../types";

export const TASKS: TaskConfig[] = [
  {
    id: "scav_dumpster",
    name: "Search Dumpsters",
    description: "You lift the lid. The smell is honest. You find things people decided not to want.",
    category: "scavenging",
    progressRequired: 10,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.4 }, { resourceId: "health", amount: 0.05 }],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "money", amount: 2 }],
    prerequisites: [{ actionId: "trash_search", minExecutions: 3 }],
    drops: [
      { itemId: "scrap_metal", chancePerSecond: 0.008 },
      { itemId: "discarded_book", chancePerSecond: 0.003 },
      { itemId: "moldy_sandwich", chancePerSecond: 0.01 }
    ],
    xpPerSecond: 4,
  },
  {
    id: "scav_alleys",
    name: "Patrol Alleys",
    description: "You walk where maps go vague. Things are where they shouldn't be.",
    category: "scavenging",
    progressRequired: 12,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.3 }, { resourceId: "mana", amount: 0.08 }],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "lore", amount: 0.2 }],
    prerequisites: [{ taskId: "scav_dumpster", minLevel: 2 }],
    drops: [
      { itemId: "lost_token", chancePerSecond: 0.006 },
      { itemId: "strange_charm", chancePerSecond: 0.002 },
      { itemId: "whisper_paper", chancePerSecond: 0.004 }
    ],
    xpPerSecond: 4,
  },
  {
    id: "scav_lost_found",
    name: "Check Lost & Found",
    description: "A bin of things people lost and never came back for. You ask if you can look.",
    category: "scavenging",
    progressRequired: 8,
    autoRestart: true,
    costPerSecond: [{ resourceId: "time", amount: 0.2 }],
    effectsPerSecond: [],
    completionEffects: [{ type: "add_resource", resourceId: "favor", amount: 0.1 }],
    startCosts: [{ resourceId: "favor", amount: 1 }],
    prerequisites: [{ taskId: "scav_alleys", minLevel: 2 }],
    drops: [
      { itemId: "misplaced_ring", chancePerSecond: 0.005 },
      { itemId: "old_photo", chancePerSecond: 0.003 },
      { itemId: "library_card_duplicate", chancePerSecond: 0.001 }
    ],
    xpPerSecond: 3,
  },
];

export const ITEMS: ItemConfig[] = [
  { id: "crumpled_receipt", name: "Crumpled Receipt", description: "Numbers that almost add up. You keep it for luck.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "subways_job", amount: 0.05 }] },
  { id: "manager_memo", name: "Manager Memo", description: "Folded, coffee-stained. It tells you what not to do. Useful.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "subways_job_2", amount: 0.08 }] },
  { id: "park_feather", name: "Park Feather", description: "Small, clean. Found on the bench where you rested.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "mana", amount: 0.01 }] },
  { id: "wall_dust", name: "Wall Dust", description: "Fine, itchy. You keep a pinch in an envelope.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "wall_destroy", amount: 0.08 }] },
  { id: "neighborhood_map", name: "Neighborhood Map", description: "Hand-drawn, wrong in useful ways.", slot: "accessory_2", effects: [{ type: "modify_passive_gen", resourceId: "lore", amount: 0.02 }] },
  { id: "scrap_metal", name: "Scrap Metal", description: "A bent piece of something. Heavy enough to be useful.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "tunnel_explore", amount: 0.08 }] },
  { id: "discarded_book", name: "Discarded Book", description: "Water-damaged, but readable. Someone underlined the good parts.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "scav_dumpster", amount: 0.05 }] },
  { id: "moldy_sandwich", name: "Moldy Sandwich", description: "You don't eat it. You keep it to remind you to eat something else.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 2 }] },
  { id: "lost_token", name: "Lost Token", description: "A token from somewhere you haven't been. It fits your hand.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "favor", amount: 0.01 }] },
  { id: "strange_charm", name: "Strange Charm", description: "It doesn't match anything you own. It wants to be kept.", slot: "accessory", effects: [{ type: "modify_passive_gen", resourceId: "insight", amount: 0.008 }] },
  { id: "whisper_paper", name: "Whisper Paper", description: "Thin paper, folded many times. The creases spell something.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "scav_alleys", amount: 0.08 }] },
  { id: "misplaced_ring", name: "Misplaced Ring", description: "Too small or too large. You wear it on a chain.", slot: "accessory_2", effects: [{ type: "modify_max_resource_flat", resourceId: "health", amount: 2 }] },
  { id: "old_photo", name: "Old Photo", description: "A place you've never been, a person you almost know.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "lore", amount: 3 }] },
  { id: "library_card_duplicate", name: "Duplicate Library Card", description: "Not yours, but it works. The photo is blurred.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "quiet", amount: 4 }] },
  { id: "vintage_pocket_watch", name: "Vintage Pocket Watch", description: "Stopped at a time that feels important.", slot: "accessory_2", effects: [{ type: "modify_max_resource_flat", resourceId: "time", amount: 3 }, { type: "modify_passive_gen", resourceId: "time", amount: 0.02 }] },
  { id: "brass_compass", name: "Brass Compass", description: "It doesn't point north. It points where you're needed.", slot: "accessory", effects: [{ type: "modify_yield_pct", taskId: "explore_neighborhood", amount: 0.1 }, { type: "modify_yield_pct", taskId: "tunnel_explore", amount: 0.1 }] },
  { id: "dried_flower_crown", name: "Dried Flower Crown", description: "Brittle, fragrant, still holds its shape.", slot: "head", effects: [{ type: "modify_max_resource_flat", resourceId: "mana", amount: 5 }, { type: "modify_passive_gen", resourceId: "health", amount: 0.02 }] },
  { id: "iron_key_on_chain", name: "Iron Key on Chain", description: "Heavy. No lock you've tried fits it. You keep it anyway.", slot: "accessory", effects: [{ type: "modify_max_resource_flat", resourceId: "time", amount: 2 }] },
];
