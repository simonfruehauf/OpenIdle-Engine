import * as fs from "fs";
import * as path from "path";
import { globSync } from "fs"; // fallback
import { fileURLToPath } from "url";

// Simple validator without importing compiled modules (avoids TSX loader complexity)
// Parses gameData/**/*.ts for ids and references and checks consistency.

type CheckResult = { ok: boolean; errors: string[]; warnings: string[] };

function collectFiles(dir: string, out: string[] = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) collectFiles(full, out);
    else if (ent.isFile() && ent.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function extract(pattern: RegExp, content: string): string[] {
  const res: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(content))) res.push(m[1]);
  return res;
}

function run(): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const gameDataDir = path.resolve("gameData");
  if (!fs.existsSync(gameDataDir)) {
    return { ok: false, errors: ["gameData dir missing"], warnings };
  }
  const files = collectFiles(gameDataDir);
  // Gather all defined ids
  const idPattern = /id:\s*["']([^"']+)["']/g;
  const categoryPattern = /category:\s*["']([^"']+)["']/g;
  const resourceIdPattern = /resourceId:\s*["']([^"']+)["']/g;
  const sourceResPattern = /sourceResourceId:\s*["']([^"']+)["']/g;
  const targetResPattern = /targetResourceId:\s*["']([^"']+)["']/g;
  const taskIdRef = /taskId:\s*["']([^"']+)["']/g;
  const actionIdRef = /actionId:\s*["']([^"']+)["']/g;
  const itemIdRef = /itemId:\s*["']([^"']+)["']/g;
  const slotRef = /slot:\s*["']([^"']+)["']/g;
  const locksPattern = /locks:\s*\[([^\]]*)\]/g;
  const exclusivePattern = /exclusiveWith:\s*\[([^\]]*)\]/g;

  // Collect defined ids per kind by scanning RESOURCES/CATEGORIES etc.
  // We collect all id: occurrences as global ids to detect duplicates across files.
  const allIds: Map<string, string[]> = new Map(); // id -> files
  const definedResources = new Set<string>();
  const definedCategories = new Set<string>();
  const definedTasks = new Set<string>();
  const definedActions = new Set<string>();
  const definedItems = new Set<string>();
  const definedSlots = new Set<string>();
  const definedConverters = new Set<string>();

  // Also track ids by kind heuristically: check file content around export const RESOURCES etc.
  for (const f of files) {
    const content = fs.readFileSync(f, "utf-8");
    // Heuristic: determine which export is in file and map ids accordingly, but also keep global map
    const ids = extract(idPattern, content);
    for (const id of ids) {
      if (!allIds.has(id)) allIds.set(id, []);
      allIds.get(id)!.push(path.relative(".", f));
    }

    // More precise per-kind if file exports that kind
    if (content.includes("RESOURCES")) {
      // crude: find all id inside RESOURCES array region - just add all ids in this file to resources
      // We'll refine by looking at ResourceConfig mentions: but easier to rely on overall existence later
      // For now add all ids from files that export RESOURCES/CATEGORIES etc. to respective sets
      // Use separate pass reading the files that actually define each kind via import heuristic:
    }
  }

  // Second pass: parse aggregated config by reading files and using keyword proximity?
  // Simpler: import compiled modules via dynamic import if possible - try import, fallback to regex.
  // Attempt dynamic import of gameData/index via tsx? For pure regex fallback, we can consider all ids as potential resources,
  // and validation of resourceId existence will check against the union of all ids (conservative).
  // Instead, we will attempt to collect defined IDs by inspecting each file's export const NAME arrays.
  const kindMap: Record<string, Set<string>> = {
    CATEGORIES: definedCategories,
    RESOURCES: definedResources,
    TASKS: definedTasks,
    ACTIONS: definedActions,
    ITEMS: definedItems,
    SLOTS: definedSlots,
    CONVERTERS: definedConverters,
  };
  for (const f of files) {
    const content = fs.readFileSync(f, "utf-8");
    for (const kind of Object.keys(kindMap)) {
      if (new RegExp(`export\\s+const\\s+${kind}\\b`).test(content)) {
        // extract ids that appear after this export up to next export
        const ids = extract(idPattern, content);
        for (const id of ids) kindMap[kind].add(id);
      }
    }
  }

  // Union for generic existence: all known ids across kinds
  const allKnownIds = new Set<string>([
    ...definedResources,
    ...definedCategories,
    ...definedTasks,
    ...definedActions,
    ...definedItems,
    ...definedSlots,
    ...definedConverters,
  ]);

  // 1. Duplicate IDs across modules (global)
  for (const [id, fileList] of allIds) {
    if (fileList.length > 1) {
      errors.push(`Duplicate id "${id}" in: ${fileList.join(", ")}`);
    }
  }

  // Helper to validate that a set of referenced ids exist in a target set
  function checkRefs(
    pattern: RegExp,
    content: string,
    file: string,
    target: Set<string>,
    kind: string
  ) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, "g");
    while ((m = re.exec(content))) {
      const ref = m[1];
      if (!target.has(ref) && !allKnownIds.has(ref)) {
        // For resource/category, also allow not-yet defined? Strict check:
        // If target is specific kind, error if missing in that kind
        if (target.size > 0) {
          errors.push(`${kind} ref "${ref}" in ${path.relative(".", file)} has no defined ${kind.toLowerCase()} (checked among ${kind})`);
        } else {
          warnings.push(`${kind} ref "${ref}" in ${path.relative(".", file)} cannot be verified (no ${kind} definitions found)`);
        }
      }
    }
  }

  // 2. Reference integrity
  for (const f of files) {
    const content = fs.readFileSync(f, "utf-8");
    // resourceId must exist in RESOURCES
    checkRefs(resourceIdPattern, content, f, definedResources, "Resource");
    checkRefs(sourceResPattern, content, f, definedResources, "Resource(source)");
    checkRefs(targetResPattern, content, f, definedResources, "Resource(target)");
    // category must exist in CATEGORIES
    {
      const re = /category:\s*["']([^"']+)["']/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(content))) {
        const cat = m[1];
        if (!definedCategories.has(cat) && cat !== "other") {
          errors.push(`Category ref "${cat}" in ${path.relative(".", f)} has no CATEGORIES entry`);
        }
      }
    }
    // taskId/actionId/itemId/slot refs
    checkRefs(taskIdRef, content, f, definedTasks, "Task");
    checkRefs(actionIdRef, content, f, definedActions, "Action");
    checkRefs(itemIdRef, content, f, definedItems, "Item");
    checkRefs(slotRef, content, f, definedSlots, "Slot");
  }

  // 3. Hidden resource unlock path: baseMax 0 must have a modify_max_resource effect targeting it
  const hiddenResources: string[] = [];
  for (const f of files) {
    const content = fs.readFileSync(f, "utf-8");
    // Only consider objects that look like ResourceConfig (contain baseMax: 0 within same brace block)
    // Use brace-limited capture to avoid category-id false positives
    const resBlockRe = /\{[^}]*id:\s*["']([^"']+)["'][^}]*baseMax:\s*0\b[^}]*\}/g;
    let m: RegExpExecArray | null;
    while ((m = resBlockRe.exec(content))) {
      const candidate = m[1];
      if (definedResources.has(candidate)) hiddenResources.push(candidate);
    }
  }
  // collect all modify_max_resource_* target ids
  const unlockTargets = new Set<string>();
  for (const f of files) {
    const c = fs.readFileSync(f, "utf-8");
    const re = /type:\s*["'](?:modify_max_resource_flat|modify_max_resource_pct|set_max_resource)["'][\s\S]*?resourceId:\s*["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(c))) unlockTargets.add(m[1]);
  }
  const uniqueHidden = [...new Set(hiddenResources)];
  for (const rid of uniqueHidden) {
    if (!unlockTargets.has(rid)) {
      warnings.push(`Hidden resource "${rid}" (baseMax 0) has no modify_max_resource_flat/pct/set unlock path`);
    }
  }

  // 4. locks / exclusiveWith existence
  for (const f of files) {
    const c = fs.readFileSync(f, "utf-8");
    let m: RegExpExecArray | null;
    const lockRe = /locks:\s*\[([^\]]*)\]/g;
    while ((m = lockRe.exec(c))) {
      const inner = m[1];
      const ids = [...inner.matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
      for (const lid of ids) if (!allKnownIds.has(lid)) warnings.push(`locks target "${lid}" in ${path.relative(".", f)} does not match any defined id`);
    }
    const exRe = /exclusiveWith:\s*\[([^\]]*)\]/g;
    while ((m = exRe.exec(c))) {
      const inner = m[1];
      const ids = [...inner.matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
      for (const eid of ids) if (!definedActions.has(eid)) errors.push(`exclusiveWith "${eid}" in ${path.relative(".", f)} not an Action`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

const result = run();
for (const e of result.errors) console.error("ERROR:", e);
for (const w of result.warnings) console.warn("WARN:", w);
if (result.ok) {
  if (result.warnings.length) console.log(`Validate: PASS with ${result.warnings.length} warnings`);
  else console.log("Validate: PASS");
  process.exit(0);
} else {
  console.error(`Validate: FAIL (${result.errors.length} errors, ${result.warnings.length} warnings)`);
  process.exit(1);
}
