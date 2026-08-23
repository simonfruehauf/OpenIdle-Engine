import { CategoryConfig, ResourceConfig, TaskConfig, ActionConfig, ItemConfig } from "../types";

// Belthane - Spring Festival side-branch
// Design goals (user request):
// - Minor upgrades & interesting items, a few resources
// - No major impact on main progression (cat / oddness / strange)
// - Optional, cozy, lightly rewarding. Can be ignored or dipped into.
// - Flavor: blossom, ribbons, bonfire, may wine, flower crowns.
// Balance: small yields, small caps, no increase_max_tasks except one
//          optional +1 that costs festival currency, not main currency.
// Unlock: early-mid (requires money 10 or trash_search 5), never locks main.

export const CATEGORIES: CategoryConfig[] = [
  { id: "belthane", name: "Belthane - Spring Festival" }
];

export const RESOURCES: ResourceConfig[] = [
  {
    id: "petals",
    name: "Petals",
    type: "basic",
    category: "belthane",
    baseMax: 0,
    initialAmount: 0,
    description: "Pale, slightly luminous petals. They were blowing down every street this morning. No one else seems to notice."
  },
  {
    id: "ribbons",
    name: "Ribbons",
    type: "basic",
    category: "belthane",
    baseMax: 0,
    initialAmount: 0,
    description: "Faded silk ribbons, knotted by many hands before yours. They remember how to be tied."
  },
  {
    id: "may_wine",
    name: "May Wine",
    type: "basic",
    category: "belthane",
    baseMax: 0,
    initialAmount: 0,
    description: "Sweet, green, faintly effervescent. Served in chipped cups around the bonfire. It makes Time feel less sharp."
  }
];

export const TASKS: TaskConfig[] = [
  {
    id: "belthane_gather_petals",
    name: "Gather Petals",
    description: "You walk before the sweepers do. The gutters are full of them. They stick to your shoes like apologies.",
    category: "belthane",
    costPerSecond: [{ resourceId: "time", amount: 0.3 }],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "petals", amount: 0.35 }
    ],
    progressRequired: 8,
    autoRestart: true,
    prerequisites: [{ actionId: "belthane_hear_festival", minExecutions: 1 }],
    xpPerSecond: 3
  },
  {
    id: "belthane_weave_garland",
    name: "Weave Garland",
    description: "Thread petals onto twine on a park bench. Children stop to watch, then help without asking. The garland ends up longer than you planned.",
    category: "belthane",
    costPerSecond: [{ resourceId: "time", amount: 0.25 }],
    effectsPerSecond: [],
    startCosts: [{ resourceId: "petals", amount: 8 }],
    progressRequired: 12,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "ribbons", amount: 2 },
      { type: "add_resource", resourceId: "petals", amount: 1 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "ribbons", amount: 12 }
    ],
    prerequisites: [{ taskId: "belthane_gather_petals", minLevel: 2 }],
    maxExecutions: 12,
    xpPerSecond: 4
  },
  {
    id: "belthane_dance_maypole",
    name: "Dance the Maypole",
    description: "Someone hands you a ribbon. You are bad at this. It doesn't matter. The pole is taller than it was last year and the music has an extra beat that your feet find before your mind does.",
    category: "belthane",
    costPerSecond: [
      { resourceId: "time", amount: 0.4 },
      { resourceId: "health", amount: 0.03 }
    ],
    effectsPerSecond: [
      { type: "add_resource", resourceId: "petals", amount: 0.1 },
      { type: "add_resource", resourceId: "may_wine", amount: 0.04 },
      { type: "add_resource", resourceId: "ribbons", amount: 0.06 }
    ],
    progressRequired: 10,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "ribbons", amount: 1 },
      { type: "add_resource", resourceId: "insanity", amount: -0.2 }
    ],
    firstCompletionEffects: [
      { type: "modify_max_resource_flat", resourceId: "ribbons", amount: 6 }
    ],
    prerequisites: [{ taskId: "belthane_weave_garland", minLevel: 1 }],
    xpPerSecond: 5
  },
  {
    id: "belthane_tend_bonfire",
    name: "Tend the Bonfire",
    description: "The fire is built too big and too neatly. You feed it ribbons that have frayed and petals that have browned. It burns green at the edges and nobody comments on it.",
    category: "belthane",
    costPerSecond: [{ resourceId: "time", amount: 0.35 }],
    effectsPerSecond: [],
    startCosts: [
      { resourceId: "petals", amount: 5 },
      { resourceId: "ribbons", amount: 1 }
    ],
    progressRequired: 15,
    autoRestart: true,
    completionEffects: [
      { type: "add_resource", resourceId: "may_wine", amount: 1.5 },
      { type: "add_resource", resourceId: "health", amount: 0.8 }
    ],
    prerequisites: [{ taskId: "belthane_dance_maypole", minLevel: 2 }],
    maxExecutions: 10
  }
];

export const ACTIONS: ActionConfig[] = [
  {
    id: "belthane_hear_festival",
    name: "Notice the Blossom on the Wind",
    description: "Every crosswalk has petals. A hand-painted sign on the laundromat: BELTHANE - TONIGHT - PARK - BRING NOTHING. You have time, if you want it.",
    category: "belthane",
    costs: [{ resourceId: "time", amount: 2 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "petals", amount: 25 },
      { type: "add_resource", resourceId: "petals", amount: 5 },
      { type: "modify_max_resource_flat", resourceId: "may_wine", amount: 12 },
      { type: "modify_max_resource_flat", resourceId: "ribbons", amount: 6 }
    ],
    prerequisites: [
      { actionId: "get_job", minExecutions: 1 }
    ],
    maxExecutions: 1,
    logMessage: "The park is already there. It was always there. You just hadn't been invited."
  },
  {
    id: "belthane_trade_ribbons",
    name: "Trade Petals for Ribbons",
    description: "A stall trades in the old way: three handfuls of petals for a length of ribbon. 'They were my grandmother's,' the stall-keeper says of all of them.",
    category: "belthane",
    costs: [{ resourceId: "petals", amount: 12 }],
    effects: [
      { type: "modify_max_resource_flat", resourceId: "ribbons", amount: 8 },
      { type: "add_resource", resourceId: "ribbons", amount: 4 }
    ],
    prerequisites: [{ taskId: "belthane_gather_petals", minLevel: 2 }],
    maxExecutions: 3,
    logMessage: "Ribbons for petals. A fair trade. The stall-keeper nods like you passed a test you didn't know about."
  },
  {
    id: "belthane_bless_bonfire",
    name: "Whisper a Blessing to the Fire",
    description: "No one tells you to. You do it anyway, quietly, because the fire is trying so hard. It pops in a way that sounds like 'thank you' in a language you almost speak.",
    category: "belthane",
    costs: [
      { resourceId: "petals", amount: 10 },
      { resourceId: "ribbons", amount: 2 }
    ],
    effects: [
      { type: "add_resource", resourceId: "may_wine", amount: 3 },
      { type: "modify_max_resource_flat", resourceId: "may_wine", amount: 6 },
      { type: "modify_passive_gen", resourceId: "health", amount: 0.02 }
    ],
    prerequisites: [{ taskId: "belthane_tend_bonfire", minLevel: 1 }],
    maxExecutions: 1,
    logMessage: "The fire burns a little steadier. So do you, for a while."
  },
  {
    id: "belthane_crown_flowers",
    name: "Claim a Flower Crown",
    description: "Woven from whatever blossomed nearest the bonfire. It wilts by morning but the shape of it stays, like a habit.",
    category: "belthane",
    costs: [{ resourceId: "ribbons", amount: 6 }],
    effects: [{ type: "add_item", itemId: "flower_crown", amount: 1 }],
    prerequisites: [{ taskId: "belthane_weave_garland", minLevel: 2 }],
    maxExecutions: 1
  },
  {
    id: "belthane_crown_ribbons",
    name: "Take a Second Crown - Ribboned",
    description: "A smaller crown, tighter weave, ribbons trailing. Meant for dancing. Meant for keeping, afterwards.",
    category: "belthane",
    costs: [
      { resourceId: "ribbons", amount: 8 },
      { resourceId: "petals", amount: 6 }
    ],
    effects: [{ type: "add_item", itemId: "ribbon_crown", amount: 1 }],
    prerequisites: [{ actionId: "belthane_crown_flowers", minExecutions: 1 }],
    maxExecutions: 1
  },
  {
    id: "belthane_taste_wine",
    name: "Taste the May Wine Properly",
    description: "You finally drink it sitting down, instead of standing by the fire. It tastes of honey and cut grass and the first week you lived here, when everything was still possible.",
    category: "belthane",
    costs: [{ resourceId: "may_wine", amount: 6 }],
    effects: [
      { type: "add_resource", resourceId: "time", amount: 2 },
      { type: "add_resource", resourceId: "health", amount: 2 },
      { type: "modify_yield_pct", taskId: "belthane_gather_petals", amount: 0.15 }
    ],
    firstCompletionEffects: [{ type: "add_item", itemId: "wine_stain", amount: 1 }],
    prerequisites: [{ taskId: "belthane_dance_maypole", minLevel: 2 }],
    maxExecutions: 2
  },
  {
    id: "belthane_keep_token",
    name: "Keep a Bonfire Token",
    description: "A smooth, soot-darkened stone from the fire's edge, still warm. People keep them on windowsills. For luck, they say. For memory, they mean.",
    category: "belthane",
    costs: [
      { resourceId: "may_wine", amount: 4 },
      { resourceId: "ribbons", amount: 4 }
    ],
    effects: [{ type: "add_item", itemId: "bonfire_token", amount: 1 }],
    prerequisites: [{ taskId: "belthane_tend_bonfire", minLevel: 2 }],
    maxExecutions: 1
  },
  {
    id: "belthane_stay_late",
    name: "Stay Late After the Festival",
    description: "Most people leave. You help fold the tables. The park is petal-deep and the bonfire is ash and the maypole is bare. The keeper presses a small wooden charm into your hand. 'You stayed,' they say, like that was the whole rite.",
    category: "belthane",
    costs: [
      { resourceId: "petals", amount: 15 },
      { resourceId: "ribbons", amount: 6 },
      { resourceId: "may_wine", amount: 6 }
    ],
    effects: [
      { type: "add_item", itemId: "belthane_charm", amount: 1 },
      { type: "modify_max_resource_flat", resourceId: "time", amount: 2 }
    ],
    firstCompletionEffects: [{ type: "increase_max_tasks", amount: 1 }],
    prerequisites: [
      { actionId: "belthane_bless_bonfire", minExecutions: 1 },
      { taskId: "belthane_tend_bonfire", minLevel: 3 }
    ],
    maxExecutions: 1,
    logMessage: "You can hold one more thing now - not in your hands, exactly."
  }
];

export const ITEMS: ItemConfig[] = [
  {
    id: "flower_crown",
    name: "Flower Crown",
    description: "Wilting, honest, slightly too big. You wore it home.",
    slot: "head",
    effects: [
      { type: "modify_yield_pct", taskId: "belthane_gather_petals", amount: 0.12 },
      { type: "modify_max_resource_flat", resourceId: "petals", amount: 10 }
    ]
  },
  {
    id: "ribbon_crown",
    name: "Ribboned Crown",
    description: "Tighter, brighter. Ribbons brush your shoulders when you move.",
    slot: "head",
    effects: [
      { type: "modify_yield_pct", taskId: "belthane_dance_maypole", amount: 0.15 },
      { type: "modify_max_resource_flat", resourceId: "ribbons", amount: 8 }
    ]
  },
  {
    id: "wine_stain",
    name: "Wine-Stained Cup",
    description: "You kept the cup. It left a ring on your sill that never quite fades.",
    slot: "accessory",
    effects: [{ type: "modify_passive_gen", resourceId: "health", amount: 0.015 }]
  },
  {
    id: "bonfire_token",
    name: "Bonfire Token",
    description: "Warm stone from the fire's edge. Keep it in a pocket. Forget it is there until you need it.",
    slot: "accessory",
    effects: [
      { type: "modify_yield_pct", taskId: "belthane_tend_bonfire", amount: 0.18 },
      { type: "modify_max_resource_flat", resourceId: "may_wine", amount: 4 }
    ]
  },
  {
    id: "belthane_charm",
    name: "Belthane Charm",
    description: "Carved wood, oiled by hands. A tiny maypole, a tiny flame. 'You stayed.' It is not powerful. It is kind.",
    slot: "accessory",
    effects: [
      { type: "modify_passive_gen", resourceId: "time", amount: 0.02 },
      { type: "modify_yield_pct", taskId: "belthane_gather_petals", amount: 0.08 }
    ]
  }
];
