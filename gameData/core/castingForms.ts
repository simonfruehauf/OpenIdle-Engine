import { CastingFormModifier } from "../../types";

export const CASTING_FORMS: CastingFormModifier[] = [
  // METHOD (Ch IV)
  { id: "method_instant", axis: "method", value: "instant", displayName: "Instant", description: "Standard cost, standard reliability.", costMultiplier: 1.0, effectMultiplier: 1.0, minTier: 0 },
  { id: "method_ritual", axis: "method", value: "ritual", displayName: "Ritual", description: "Slower, more expensive - near-guaranteed and stronger.", costMultiplier: 1.5, effectMultiplier: 1.4, reliabilityBonus: 0.15, minTier: 4 },
  { id: "method_wild", axis: "method", value: "wild", displayName: "Wild", description: "Cheaper, faster, unstable - output varies meaningfully.", costMultiplier: 0.7, effectMultiplier: 1.1, variance: 0.6, minTier: 4 },
  // DURATION (Ch IV)
  { id: "duration_instant", axis: "duration", value: "instant", displayName: "Instant", description: "Resolves immediately.", costMultiplier: 1.0, effectMultiplier: 1.0, minTier: 0 },
  { id: "duration_delayed", axis: "duration", value: "delayed", displayName: "Delayed", description: "Set now, triggers later on a stated condition.", costMultiplier: 0.9, effectMultiplier: 1.2, triggerDelaySeconds: 30, minTier: 4 },
  { id: "duration_sustained", axis: "duration", value: "sustained", displayName: "Sustained", description: "Channeled - drains Mana continuously while active.", costMultiplier: 0.4, effectMultiplier: 0.8, continuousDrainPerSecond: 0.06, minTier: 4 },
  // TARGET (Ch IV)
  { id: "target_outward", axis: "target", value: "outward", displayName: "Outward", description: "Affects the world. Standard cost.", costMultiplier: 1.0, effectMultiplier: 1.0, minTier: 0 },
  { id: "target_inward", axis: "target", value: "inward", displayName: "Inward", description: "Affects the caster - cheaper, smaller.", costMultiplier: 0.5, effectMultiplier: 0.7, minTier: 4 },
];
