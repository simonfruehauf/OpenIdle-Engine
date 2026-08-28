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

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/(^|[^:"'\\])\/\/.*$/gm, "$1"); // line comments (naive, fine for config files)
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
  const definedSpells = new Set<string>();
  const definedAspects = new Set<string>();
  const definedBraids = new Set<string>();
  const definedForms = new Set<string>();

  // Also track ids by kind heuristically: check file content around export const RESOURCES etc.
  for (const f of files) {
    const content = stripComments(fs.readFileSync(f, "utf-8"));
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
    SPELLS: definedSpells,
    ASPECTS: definedAspects,
    BRAIDS: definedBraids,
    CASTING_FORMS: definedForms,
  };
  // id -> kind tags, and id -> kind -> files (for kind-aware duplicate detection)
  const idKinds = new Map<string, Set<string>>();
  const kindFiles = new Map<string, Map<string, Set<string>>>();
  const tag = (id: string, kind: string, file: string) => {
    if (!idKinds.has(id)) idKinds.set(id, new Set());
    idKinds.get(id)!.add(kind);
    if (!kindFiles.has(id)) kindFiles.set(id, new Map());
    const km = kindFiles.get(id)!;
    if (!km.has(kind)) km.set(kind, new Set());
    km.get(kind)!.add(file);
  };
  for (const f of files) {
    const content = stripComments(fs.readFileSync(f, "utf-8"));
    for (const kind of Object.keys(kindMap)) {
      if (new RegExp(`export\\s+const\\s+${kind}\\b`).test(content)) {
        // extract ids that appear after this export up to next export
        const rel = path.relative(".", f);
        const ids = extract(idPattern, content);
        for (const id of ids) {
          kindMap[kind].add(id);
          tag(id, kind, rel);
        }
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
    ...definedSpells,
    ...definedAspects,
    ...definedBraids,
    ...definedForms,
  ]);

  // 1. Duplicate IDs - kind-aware: cross-kind collisions are legitimate
  // (state is kind-namespaced), so only flag:
  //   a) same id twice within ONE file, or
  //   b) two different files both tagging the id with the SAME kind.
  for (const [id, fileList] of allIds) {
    const seenFiles = new Set<string>();
    let sameFileDup = false;
    for (const f of fileList) {
      if (seenFiles.has(f)) {
        sameFileDup = true;
        break;
      }
      seenFiles.add(f);
    }
    let dupKind: string | null = null;
    const kindsForId = kindFiles.get(id);
    if (kindsForId) {
      for (const [kind, fsForKind] of kindsForId) {
        if (fsForKind.size > 1) {
          dupKind = kind;
          break;
        }
      }
    }
    if (sameFileDup || dupKind) {
      const uniqueFiles = [...new Set(fileList)].join(", ");
      errors.push(
        dupKind
          ? `Duplicate ${dupKind.toLowerCase()} id "${id}" in: ${uniqueFiles}`
          : `Duplicate id "${id}" in: ${uniqueFiles}`
      );
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
    const content = stripComments(fs.readFileSync(f, "utf-8"));
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
    const content = stripComments(fs.readFileSync(f, "utf-8"));
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
    const c = stripComments(fs.readFileSync(f, "utf-8"));
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
    const c = stripComments(fs.readFileSync(f, "utf-8"));
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

  // 5. Speed tier validation (Task 5 polishing)
  // If SPEED_TIERS defined (non-empty), validate multipliers, costs, OFFLINE_RATE, duplicates, and prereqs.
  {
    const speedTierFiles = files.filter(f => stripComments(fs.readFileSync(f, "utf-8")).includes("SPEED_TIERS"));
    const allMultipliers: number[] = [];
    let hasSpeedTiers = false;
    for (const f of speedTierFiles) {
      const content = stripComments(fs.readFileSync(f, "utf-8"));
      // Robust tier parsing: slice by multiplier occurrences to avoid nested-brace regex pitfalls
      const tierStartRe = /\{\s*multiplier\s*:\s*(\d+)/g;
      const starts: { index: number; mult: number }[] = [];
      let sm: RegExpExecArray | null;
      while ((sm = tierStartRe.exec(content))) {
        starts.push({ index: sm.index, mult: parseInt(sm[1], 10) });
      }
      for (let i = 0; i < starts.length; i++) {
        const start = starts[i].index;
        const end = i + 1 < starts.length ? starts[i + 1].index : content.length;
        const tierSlice = content.slice(start, end);
        // Only consider slices that are inside SPEED_TIERS array (heuristic: they follow SPEED_TIERS)
        // If file has other multiplier fields outside SPEED_TIERS, they'd be false positives — but spec says only speed tiers use multiplier
        const costsMatch = tierSlice.match(/costs\s*:\s*\[([^\]]*)\]/);
        if (!costsMatch) continue;
        hasSpeedTiers = true;
        const mult = starts[i].mult;
        allMultipliers.push(mult);
        const costsInner = costsMatch[1];
        const costResIds = [...costsInner.matchAll(/resourceId:\s*["']([^"']+)["']/g)].map(x => x[1]);
        if (![1, 2, 4, 8].includes(mult)) {
          errors.push(`SPEED_TIERS multiplier "${mult}" in ${path.relative(".", f)} is invalid — must be one of 1,2,4,8`);
        }
        for (const rid of costResIds) {
          if (!definedResources.has(rid)) {
            errors.push(`SPEED_TIERS costs resourceId "${rid}" in ${path.relative(".", f)} has no defined Resource`);
          }
        }
        if (mult === 1 && costResIds.length > 0) {
          warnings.push(`SPEED_TIERS 1× has costs [${costResIds.join(", ")}] in ${path.relative(".", f)} — 1× should be free`);
        }
        const prereqMatch = tierSlice.match(/prerequisites\s*:\s*\[([^\]]*)\]/);
        if (prereqMatch) {
          const prereqInner = prereqMatch[1];
          const prereqResIds = [...prereqInner.matchAll(/resourceId:\s*["']([^"']+)["']/g)].map(x => x[1]);
          const prereqActionIds = [...prereqInner.matchAll(/actionId:\s*["']([^"']+)["']/g)].map(x => x[1]);
          const prereqTaskIds = [...prereqInner.matchAll(/taskId:\s*["']([^"']+)["']/g)].map(x => x[1]);
          for (const rid of prereqResIds) if (!definedResources.has(rid)) errors.push(`SPEED_TIERS prerequisites resourceId "${rid}" in ${path.relative(".", f)} has no defined Resource`);
          for (const aid of prereqActionIds) if (!definedActions.has(aid)) errors.push(`SPEED_TIERS prerequisites actionId "${aid}" in ${path.relative(".", f)} has no defined Action`);
          for (const tid of prereqTaskIds) if (!definedTasks.has(tid)) errors.push(`SPEED_TIERS prerequisites taskId "${tid}" in ${path.relative(".", f)} has no defined Task`);
        }
      }
    }
    if (hasSpeedTiers) {
      const seenMult = new Map<number, number>();
      for (const mm of allMultipliers) seenMult.set(mm, (seenMult.get(mm) || 0) + 1);
      for (const [mult, count] of seenMult) if (count > 1) warnings.push(`SPEED_TIERS duplicate multiplier ${mult}× (${count} tiers)`);
      // OFFLINE_RATE validation: if defined, check its resourceId exists
      for (const f of files) {
        const c = stripComments(fs.readFileSync(f, "utf-8"));
        if (c.includes("OFFLINE_RATE")) {
          const offIdx = c.indexOf("OFFLINE_RATE");
          const slice = c.slice(offIdx, offIdx + 600);
          const ridMatch = slice.match(/resourceId:\s*["']([^"']+)["']/);
          if (ridMatch) {
            const rid = ridMatch[1];
            if (!definedResources.has(rid)) errors.push(`OFFLINE_RATE resourceId "${rid}" in ${path.relative(".", f)} has no defined Resource`);
          }
          break;
        }
      }
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
