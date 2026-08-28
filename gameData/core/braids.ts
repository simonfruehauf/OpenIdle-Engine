import { BraidConfig, SpellConfig } from "../../types";

export const BRAIDS: BraidConfig[] = [
  {
    id: "smolder", name: "Smolder", parentAspects: ["ash", "hush"],
    description: "A burn with no light and no sound.",
    signatureQuirk: "Left unattended long enough, it makes noise all at once.",
    unlockChapter: 3,
    workings: [
      { id: "the_slow_ember", name: "The Slow Ember", description: "Hidden, gradual damage over time." },
      { id: "ashfall", name: "Ashfall", description: "Wider, weaker - affects an area." },
      { id: "the_cold_burn", name: "The Cold Burn", description: "Consumes without any heat." },
    ],
  },
  {
    id: "dormancy", name: "Dormancy", parentAspects: ["hush", "root"],
    description: "Silence laid over growth becomes suspended animation.",
    signatureQuirk: "Things held don't age - but they also don't heal.",
    unlockChapter: 3,
    workings: [
      { id: "the_held_season", name: "The Held Season", description: "Suspends growth and decay for a duration." },
      { id: "the_quiet_bed", name: "The Quiet Bed", description: "Extended variant for transporting the wounded." },
      { id: "the_sealed_jar", name: "The Sealed Jar", description: "Precise preservation of dangerous specimens." },
    ],
  },
  {
    id: "heartwood", name: "Heartwood", parentAspects: ["root", "iron"],
    description: "Living growth made permanent.",
    signatureQuirk: "A Heartwood object reacts, almost imperceptibly over months, to how it's treated.",
    unlockChapter: 3,
    workings: [
      { id: "the_first_graft", name: "The First Graft", description: "Permanently hardens a small living structure." },
      { id: "livingwall", name: "Livingwall", description: "Structural-scale fortification." },
      { id: "the_quiet_companion", name: "The Quiet Companion", description: "A small living keepsake bonded to its caster." },
    ],
  },
  {
    id: "temper", name: "Temper", parentAspects: ["iron", "ash"],
    description: "Weight plus consumption - put plainly, blacksmithing.",
    signatureQuirk: "The one braid taught openly as a trade.",
    unlockChapter: 3,
    workings: [
      { id: "the_first_forging", name: "The First Forging", description: "Hardens and permanently shapes worked material." },
      { id: "the_second_firing", name: "The Second Firing", description: "Refinement pass - basis of equipment upgrades." },
      { id: "the_unbreaking", name: "The Unbreaking", description: "Immune to further change, good or bad. One-way door." },
    ],
  },
];

export const BRAID_SPELLS: SpellConfig[] = [
  { id: "cast_smolder", name: "Weave Smolder", description: "A burn with no light and no sound.", braidId: "smolder", workingId: "the_slow_ember", tier: 1, baseManaCost: 22, baseMotesYield: 5, baseCooldownMs: 6000, failureFlavor: "The Smolder goes quiet - too quiet. It will make noise later, all at once." },
  { id: "cast_dormancy", name: "Weave Dormancy", description: "Silence laid over growth.", braidId: "dormancy", workingId: "the_held_season", tier: 1, baseManaCost: 20, baseMotesYield: 4, baseCooldownMs: 7000, failureFlavor: "Time suspends in the wrong place - including your own hands." },
  { id: "cast_heartwood", name: "Weave Heartwood", description: "Living growth made permanent.", braidId: "heartwood", workingId: "the_first_graft", tier: 1, baseManaCost: 26, baseMotesYield: 6, baseCooldownMs: 8000, failureFlavor: "The bark sets wrong, alive in a way you'll regret." },
  { id: "cast_temper", name: "Work Temper", description: "Weight plus consumption - blacksmithing.", braidId: "temper", workingId: "the_first_forging", tier: 1, baseManaCost: 30, baseMotesYield: 7, baseCooldownMs: 9000, failureFlavor: "The metal takes the temper - and remembers being wrong forever." },
];
