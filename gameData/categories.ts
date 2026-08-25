import { CategoryConfig } from "../types";

// Hierarchical Categories: Supports nesting via parentCategoryId
export const CATEGORIES: CategoryConfig[] = [

  // --- Root Categories ---
  { id: "basic", name: "Basic Resources & Stats", parentCategoryId: null },
  { id: "starting", name: "Starting Out", parentCategoryId: null },
  { id: "upgrades", name: "Upgrades", parentCategoryId: null },

  // --- Physical Body Stats (Grouping Health/Time/Vigor) ---
  { id: "physical_body", name: "Physical Body Stats", parentCategoryId: "basic" },
  { id: "sub_body", name: "Physical Stats", parentCategoryId: "physical_body" },

  // --- Prismatic Energies Hierarchy ---
  // Parent Category
  { id: "prismatic_energies", name: "Prismatic Energies", parentCategoryId: "basic" },

  // Child: Mana Pool (Standalone energy)
  { id: "mana", name: "Mana Pool", parentCategoryId: "prismatic_energies" },

  // Sub-Category: Elemental Forces (Children of Prismatic Energies)
  { id: "elemental", name: "Elemental Forces", parentCategoryId: "prismatic_energies" },

  // Grandchildren: Individual Elements
  { id: "water", name: "Water Essence", parentCategoryId: "elemental" },
  { id: "air", name: "Air Current", parentCategoryId: "elemental" },
  { id: "fire", name: "Fire Soul", parentCategoryId: "elemental" },
  { id: "earth", name: "Earth Core", parentCategoryId: "elemental" },

  // --- Other Existing Categories (Unchanged) ---
  { id: "oddness", name: "Oddness", parentCategoryId: null },
  { id: "strange", name: "Strange Lore", parentCategoryId: null },
  { id: "library_job", name: "Library Assistant", parentCategoryId: null },
  { id: "cafe", name: "Cafe Work", parentCategoryId: null },
  { id: "garden", name: "Community Garden", parentCategoryId: null },
  { id: "tunnels", name: "Abandoned Tunnels", parentCategoryId: null },
  { id: "rooftop", name: "Rooftop Garden", parentCategoryId: null },
  { id: "fighting", name: "Fighting Ring", parentCategoryId: null },
  { id: "scavenging", name: "Scavenging", parentCategoryId: null },
  { id: "leads", name: "Leads", parentCategoryId: null },
];
