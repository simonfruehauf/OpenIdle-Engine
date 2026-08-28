import { AspectConfig, SpellConfig } from "../../types";

export const ASPECTS: AspectConfig[] = [
  { id: "ash", name: "Ash", description: "Magic of consumption and transformation.", color: "#ef4444", costGrowthFactor: 1.9, yieldGrowthFactor: 1.55, failureFlavor: "Overshoots - a candle asked to grow becomes a small bonfire." },
  { id: "root", name: "Root", description: "Magic of growth and connection.", color: "#22c55e", costGrowthFactor: 1.4, yieldGrowthFactor: 1.45, failureFlavor: "Won't stop growing where you meant it to." },
  { id: "hush", name: "Hush", description: "Magic of negation and absence.", color: "#8b5cf6", costGrowthFactor: 1.7, yieldGrowthFactor: 1.35, failureFlavor: "Silences the wrong thing." },
  { id: "iron", name: "Iron", description: "Magic of weight and permanence.", color: "#64748b", costGrowthFactor: 1.35, yieldGrowthFactor: 1.25, failureFlavor: "Fixes things in the wrong place, for good." },
];

export const SPELLS: SpellConfig[] = [
  // ASH
  { id: "coax_the_ember", name: "Coax the Ember", description: "Grow or shrink an existing flame.", aspectId: "ash", tier: 1, baseManaCost: 8, baseMotesYield: 2, baseCooldownMs: 2000, failureFlavor: "Your flame leaps taller than intended - singed eyebrows." },
  { id: "kindles_touch", name: "Kindle's Touch", description: "Light something that wasn't burning.", aspectId: "ash", tier: 2, baseManaCost: 15, baseMotesYield: 4, baseCooldownMs: 3000, failureFlavor: "Everything nearby but the target begins smoldering." },
  { id: "spendthrifths_flare", name: "Spendthrift's Flare", description: "Convert Mana into a short, powerful burst - the classic overcast.", aspectId: "ash", tier: 3, baseManaCost: 35, baseMotesYield: 6, baseCooldownMs: 8000, failureFlavor: "The burst consumes your reserves entirely." },
  { id: "the_long_burn", name: "The Long Burn", description: "A slow, sustained consumption effect.", aspectId: "ash", tier: 4, baseManaCost: 60, baseMotesYield: 9, baseCooldownMs: 12000, failureFlavor: "It keeps burning long after you look away." },
  { id: "second_wind", name: "Second Wind", description: "Convert unspent Mana into Motes at a punishing rate.", aspectId: "ash", tier: 5, baseManaCost: 90, baseMotesYield: 20, baseCooldownMs: 15000, failureFlavor: "A brief casting drought follows - nothing answers." },
  { id: "the_last_match", name: "The Last Match", description: "One maximal expenditure of nearly all current Mana.", aspectId: "ash", tier: 6, baseManaCost: 140, baseMotesYield: 40, baseCooldownMs: 30000, failureFlavor: "It overshoots badly at low Focus - everything at once, then ash." },
  // ROOT
  { id: "nudge_the_root", name: "Nudge the Root", description: "Grow a small plant, once.", aspectId: "root", tier: 1, baseManaCost: 6, baseMotesYield: 1, baseCooldownMs: 3000, failureFlavor: "Seedlings erupt past the windowsill." },
  { id: "knit", name: "Knit", description: "Accelerated minor healing.", aspectId: "root", tier: 2, baseManaCost: 12, baseMotesYield: 2, baseCooldownMs: 5000, failureFlavor: "The wound closes around what was inside it." },
  { id: "bramble_snare", name: "Bramble Snare", description: "Rapidly grows entangling vines.", aspectId: "root", tier: 3, baseManaCost: 28, baseMotesYield: 4, baseCooldownMs: 10000, failureFlavor: "The snare doesn't stop where you meant it to." },
  { id: "the_long_season", name: "The Long Season", description: "Advance a living thing through a full growth cycle.", aspectId: "root", tier: 4, baseManaCost: 42, baseMotesYield: 7, baseCooldownMs: 14000, failureFlavor: "It grows old in moments, and dies on schedule." },
  { id: "grafting", name: "Grafting", description: "Bind two living things at the growth level.", aspectId: "root", tier: 5, baseManaCost: 65, baseMotesYield: 11, baseCooldownMs: 18000, failureFlavor: "They bind - not to each other, but to you." },
  { id: "the_deep_root", name: "The Deep Root", description: "A slow, wide effect improving area health.", aspectId: "root", tier: 6, baseManaCost: 95, baseMotesYield: 18, baseCooldownMs: 25000, failureFlavor: "Everything grows - including things that shouldn't." },
  // HUSH
  { id: "quiet_the_bell", name: "Quiet the Bell", description: "Mute a small sound source briefly.", aspectId: "hush", tier: 1, baseManaCost: 5, baseMotesYield: 1, baseCooldownMs: 1500, failureFlavor: "You hear your own heartbeat stop instead." },
  { id: "unseen_step", name: "Unseen Step", description: "Brief, minor concealment.", aspectId: "hush", tier: 2, baseManaCost: 14, baseMotesYield: 3, baseCooldownMs: 4000, failureFlavor: "You become unforgettable rather than unseen." },
  { id: "erase", name: "Erase", description: "Remove a small, specific detail.", aspectId: "hush", tier: 3, baseManaCost: 30, baseMotesYield: 3, baseCooldownMs: 12000, failureFlavor: "Once, it erased the caster's memory of casting it." },
  { id: "the_held_breath", name: "The Held Breath", description: "A wide, brief silence over an area.", aspectId: "hush", tier: 4, baseManaCost: 48, baseMotesYield: 5, baseCooldownMs: 16000, failureFlavor: "The silence lands somewhere else entirely." },
  { id: "the_unspoken_name", name: "The Unspoken Name", description: "Remove a target's ability to be identified by name.", aspectId: "hush", tier: 5, baseManaCost: 75, baseMotesYield: 8, baseCooldownMs: 22000, failureFlavor: "For a moment, no one can name YOU either." },
  { id: "the_absence", name: "The Absence", description: "A pocket where almost nothing functions, briefly.", aspectId: "hush", tier: 6, baseManaCost: 120, baseMotesYield: 14, baseCooldownMs: 45000, failureFlavor: "The pocket forms - around you." },
  // IRON
  { id: "stonewatch", name: "Stonewatch", description: "Slightly harden a small object's surface.", aspectId: "iron", tier: 1, baseManaCost: 10, baseMotesYield: 1, baseCooldownMs: 3000, failureFlavor: "Something else hardens instead - something you're holding." },
  { id: "anchor", name: "Anchor", description: "Fix an object against being moved.", aspectId: "iron", tier: 2, baseManaCost: 18, baseMotesYield: 2, baseCooldownMs: 5000, failureFlavor: "It anchors - to the wrong spot, permanently." },
  { id: "leaden_word", name: "Leaden Word", description: "Sharply increase weight, briefly.", aspectId: "iron", tier: 3, baseManaCost: 32, baseMotesYield: 3, baseCooldownMs: 9000, failureFlavor: "The floor groans under weight you didn't intend to add." },
  { id: "the_settling", name: "The Settling", description: "Make a change permanent.", aspectId: "iron", tier: 4, baseManaCost: 50, baseMotesYield: 5, baseCooldownMs: 15000, failureFlavor: "What settles isn't quite what changed." },
  { id: "bedrock", name: "Bedrock", description: "Extend Anchor across a wide area.", aspectId: "iron", tier: 5, baseManaCost: 78, baseMotesYield: 8, baseCooldownMs: 24000, failureFlavor: "The ground refuses to move ever again - including downhill water." },
  { id: "the_unmoved", name: "The Unmoved", description: "Render yourself nearly impossible to displace.", aspectId: "iron", tier: 6, baseManaCost: 115, baseMotesYield: 13, baseCooldownMs: 60000, failureFlavor: "You cannot be moved. Not by force. Not by choice either." },
];
