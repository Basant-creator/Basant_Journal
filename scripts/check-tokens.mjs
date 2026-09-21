/**
 * Guards custom properties against silently resolving to nothing.
 *
 * `var(--x)` with no fallback and no definition is not an error anywhere in
 * the toolchain. The declaration becomes invalid at computed-value time and
 * the property falls back to `unset`, which for most of what this site uses
 * it for means the rule simply does not happen. Nothing warns. The build is
 * green. The page is subtly wrong, and stays wrong.
 *
 * Three of these were live when this script was written, and the worst of
 * them is the reason it exists: CampScene's record sheet read
 * `animation: sheetArrives var(--duration-slow) var(--ease-weighted) both`,
 * `--ease-weighted` was defined only in design/tokens.css — which is
 * documentation and is imported by nobody — so the whole shorthand was
 * invalid and the sheet had no arrival animation at all. The other two were
 * `--map-label` (same cause) and `--space-7`, a step that has never existed
 * on the spacing scale.
 *
 * The check is deliberately narrow. A property is fine if anything defines
 * it, if any `var()` reading it supplies a fallback, if a component sets it
 * as an inline style, or if next/font emits it from a `variable:` option.
 * The last two are why the .tsx scan is here — plenty of these are written
 * at runtime and appear in no stylesheet.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN = ["app", "components", "design", "lib"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(css|tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const defined = new Set();
/** Referenced without a fallback: `var(--x)` rather than `var(--x, y)`. */
const bare = new Map();

const files = SCAN.flatMap((base) => walk(join(ROOT, base)));

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  /* Defined in a stylesheet. */
  for (const m of src.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);

  /* Defined at runtime, as an inline style: { "--x": value }. */
  for (const m of src.matchAll(/["'](--[a-zA-Z0-9-]+)["']\s*:/g)) defined.add(m[1]);

  /* Defined by next/font, which emits a class carrying the property rather
     than writing it into any file here: `Rye({ variable: "--font-rye" })`. */
  for (const m of src.matchAll(/variable:\s*["'](--[a-zA-Z0-9-]+)["']/g))
    defined.add(m[1]);

  /* Read. A fallback makes it safe whatever happens upstream. */
  for (const m of src.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])/g)) {
    if (m[2] === ",") continue;
    if (!bare.has(m[1])) bare.set(m[1], []);
    const where = bare.get(m[1]);
    if (!where.includes(rel)) where.push(rel);
  }
}

const missing = [...bare].filter(([name]) => !defined.has(name));

if (missing.length === 0) {
  console.log(
    `Tokens intact: ${bare.size} custom properties read without a fallback, all defined.`,
  );
  process.exit(0);
}

console.error("Custom properties read with no definition and no fallback:\n");
for (const [name, where] of missing) {
  console.error(`  ${name}`);
  for (const w of where) console.error(`      ${w}`);
}
console.error(
  "\nEach of these computes to `unset`, which usually means the declaration " +
    "does nothing at all.\nDefine it in app/globals.css (the stylesheet that " +
    "ships), or give the var() a fallback.",
);
process.exit(1);
