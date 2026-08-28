import { SpeedTierConfig } from "../../types";

export const SPEED_TIERS: SpeedTierConfig[] = [
  { multiplier: 1, name: "Normal", costs: [], description: "Real time." },
  { multiplier: 2, name: "Haste", costs: [{ resourceId: "time_essence", amount: 1 }], description: "2\u00d7 speed, 1 essence/tick." },
  { multiplier: 4, name: "Swift", costs: [{ resourceId: "time_essence", amount: 3 }], description: "4\u00d7 speed, 3 essence/tick." },
  { multiplier: 8, name: "Warp", costs: [{ resourceId: "time_essence", amount: 8 }], prerequisites: [{ resourceId: "time_essence", minMax: 500 }], description: "8\u00d7 speed, 8 essence/tick. Requires 500 capacity." },
];

export const OFFLINE_RATE: { resourceId: string; ratePerSecond: number } = { resourceId: "time_essence", ratePerSecond: 0.08 };
