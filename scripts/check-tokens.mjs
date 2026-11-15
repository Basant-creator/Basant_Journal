/**
 * Guards the site's tokens.
 *
 * 1. Custom properties that resolve to nothing. `var(--x)` with no fallback
 *    and no definition is not an error anywhere in the toolchain: the
 *    declaration becomes invalid at computed-value time and falls back to
 *    `unset`, so the rule simply does not happen, and nothing warns. A
 *    property is fine if anything defines it, if any `var()` reading it
 *    supplies a fallback, if a component sets it as an inline style, or if
 *    next/font emits it from a `variable:` option (the .tsx scan is for the
 *    last two, which appear in no stylesheet).
 *
 * 2. Raw colours in a component's stylesheet. Every colour comes from a
 *    token in app/globals.css; a hex code written into any other stylesheet
 *    is a colour that will not follow the palette.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN = ["app", "components", "lib"];

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
     than writing it into any file here: `Archivo({ variable: "--font-archivo" })`. */
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

/* Raw hex colours in any stylesheet but the one that defines the tokens. */
const raw = [];
for (const file of files) {
  const rel = relative(ROOT, file).split("\\").join("/");
  if (!rel.endsWith(".css") || rel === "app/globals.css") continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const hit = line.match(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b/);
    if (hit) raw.push(`${rel}:${i + 1}  ${hit[0]}`);
  });
}

if (raw.length) {
  console.error("Raw colours outside app/globals.css (use a --titles-* token):");
  for (const r of raw) console.error(`  ${r}`);
  console.error("");
}

if (missing.length === 0 && raw.length === 0) {
  console.log(
    `Tokens intact: ${bare.size} custom properties read without a fallback, all defined; no raw colours in components.`,
  );
  process.exit(0);
}
if (missing.length === 0) process.exit(1);

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
