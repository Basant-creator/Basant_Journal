/**
 * Guards the 3D boundary.
 *
 * `three` is ~700 kB; the shared bundle is ~103 kB. One stray import from a
 * shared component puts the former in front of every visitor. Next.js will
 * not warn about that, so this does.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN = ["app", "components", "lib"];
const ALLOWED = [join("components", "three"), join("lib", "three")];
const FORBIDDEN = /from\s+["'](three|three\/[^"']*|@react-three\/[^"']+)["']/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const offenders = [];

for (const base of SCAN) {
  for (const file of walk(join(ROOT, base))) {
    const rel = relative(ROOT, file);
    if (ALLOWED.some((a) => rel.startsWith(a + sep) || rel.startsWith(a))) continue;

    const source = readFileSync(file, "utf8");
    source.split("\n").forEach((line, i) => {
      // `import type` is erased at compile time and costs nothing at runtime.
      if (/^\s*import\s+type\s/.test(line)) return;
      if (FORBIDDEN.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
    });
  }
}

if (offenders.length > 0) {
  console.error("3D boundary violated — three must only be imported inside components/three:\n");
  offenders.forEach((o) => console.error("  " + o));
  console.error("\nRoute it through <ThreeScene> instead.");
  process.exit(1);
}

console.log("3D boundary intact: three is imported only inside components/three.");
