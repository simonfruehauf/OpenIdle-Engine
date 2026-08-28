import { CategoryConfig } from "../../types";

export const CATEGORIES: CategoryConfig[] = [
  { id: "journey", name: "The Kindled Journey" },

  { id: "first_spark", name: "First Spark", parentCategoryId: "journey" },
  { id: "four_aspects", name: "The Four Aspects", parentCategoryId: "journey" },
  { id: "braided_casting", name: "Braided Casting", parentCategoryId: "journey" },
  { id: "casting_forms", name: "Casting Forms", parentCategoryId: "journey" },
  { id: "wound_answers", name: "The Wound Answers", parentCategoryId: "journey" },

  { id: "aspects", name: "The Four Aspects", parentCategoryId: "four_aspects" },
  { id: "ash", name: "Ash - Consumption", parentCategoryId: "aspects" },
  { id: "root", name: "Root - Growth", parentCategoryId: "aspects" },
  { id: "hush", name: "Hush - Negation", parentCategoryId: "aspects" },
  { id: "iron", name: "Iron - Permanence", parentCategoryId: "aspects" },

  { id: "braids", name: "Braided Workings", parentCategoryId: "braided_casting" },
  { id: "smolder", name: "Smolder (Ash + Hush)", parentCategoryId: "braids" },
  { id: "dormancy", name: "Dormancy (Hush + Root)", parentCategoryId: "braids" },
  { id: "heartwood", name: "Heartwood (Root + Iron)", parentCategoryId: "braids" },
  { id: "temper", name: "Temper (Iron + Ash)", parentCategoryId: "braids" },

  { id: "forms", name: "Casting Forms", parentCategoryId: "casting_forms" },

  { id: "notebook", name: "The Kindled Notebook", parentCategoryId: "journey" },
  { id: "endgame", name: "The Wound Answers", parentCategoryId: "wound_answers" },
];