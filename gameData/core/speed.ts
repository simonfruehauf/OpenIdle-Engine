import { SpeedTierConfig } from "../../types";

/**
 * Speed system placeholder — Task 1 scaffold.
 * Real content (tiers + offline rate) lands in Task 3.
 *
 * Shape:
 *   export const SPEED_TIERS: SpeedTierConfig[] = [
 *     { multiplier: 1, name: "Normal", costs: [], description: "Real time." },
 *     { multiplier: 2, name: "Haste", costs: [{ resourceId: "time_essence", amount: 1 }], description: "2× speed, 1 essence/tick." },
 *     { multiplier: 4, costs: [{ resourceId: "time_essence", amount: 3 }] },
 *     { multiplier: 8, costs: [{ resourceId: "time_essence", amount: 8 }], prerequisites: [{ resourceId: "time_essence", minMax: 500 }] },
 *   ];
 *
 *   export const OFFLINE_RATE = { resourceId: "time_essence", ratePerSecond: 0.08 };
 */

export const SPEED_TIERS: SpeedTierConfig[] = [];
