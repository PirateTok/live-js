import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const MAX_LOC = 800;
const SRC_DIR = "src";

let violations = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (!full.endsWith(".ts") && !full.endsWith(".js")) continue;
    checkFile(full);
  }
}

function checkFile(path) {
  const content = readFileSync(path, "utf-8");
  const lines = content.split("\n");
  const rel = relative(".", path);

  // R1: LOC
  if (lines.length > MAX_LOC) {
    console.error(`R1 ${rel} — ${lines.length} lines (max ${MAX_LOC})`);
    violations++;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const ln = i + 1;

    // R2: empty catch
    if (line === "catch {}") {
      console.error(`R2 ${rel}:${ln} — empty catch block`);
      violations++;
    }
    if (/\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(line)) {
      console.error(`R2 ${rel}:${ln} — swallowed promise: ${line}`);
      violations++;
    }

    // R3: wildcard imports
    if (/import\s+\*\s+from/.test(line)) {
      console.error(`R3 ${rel}:${ln} — wildcard import: ${line}`);
      violations++;
    }
  }
}

walk(SRC_DIR);

if (violations > 0) {
  console.error(`\n${violations} discipline violation(s) found`);
  process.exit(1);
}
console.log("discipline check passed");
