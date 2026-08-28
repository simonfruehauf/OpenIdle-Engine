import { SlotConfig } from "../../types";

export const SLOTS: SlotConfig[] = [
  { id: "focus_gear", name: "Focus Gear" },
  { id: "wardslot", name: "Wardslot" },
  {
    id: "farseer_lens",
    name: "Farseer's Lens",
    prerequisitesAny: [{ taskId: "braid_practice", minExecutions: 1 }],
  },
  {
    id: "current_tuner",
    name: "Current-Tuner",
    // TODO(ch4): uncomment once sustain_training task exists
    // prerequisitesAny: [{ taskId: "sustain_training", minExecutions: 1 }],
  },
];
