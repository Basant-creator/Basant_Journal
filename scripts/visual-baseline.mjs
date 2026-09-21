/**
 * Renders the world and writes it to disk.
 *
 * Phase 12.6 §1: source inspection is not sufficient, and a green build says
 * nothing about whether a page looks finished. This drives the Chrome that is
 * already installed on the machine — `puppeteer-core`, so nothing downloads a
 * second browser — and captures every checkpoint at fixed viewports.
 *
 * Three things make the output comparable run to run, and all three are
 * deliberate:
 *
 *   1. **The boot and the entry are skipped.** Both are gated on storage keys
 *      (`frontier.booted`, `frontier.visited`) that a returning visitor
 *      already has, so setting them is not cheating — it is photographing the
 *      second visit. Without it every shot is a random frame of a cinematic
 *      and nothing can be compared to anything.
 *   2. **The hour is pinned.** `frontier:hour` decides dusk, dawn or the
 *      split, and an unpinned baseline changes colour between runs.
 *   3. **The quality tier is pinned high.** `navigator.connection` is
 *      documented as unreliable on this machine — it reports 3g one minute
 *      and 4g the next — and a scene that silently renders its illustrated
 *      fallback is a different picture, not a worse one.
 *
 * Usage:  node scripts/visual-baseline.mjs [--out DIR] [--url ORIGIN]
 *
 * The server has to be running. It does not start one, because a script that
 * launches a build server is a script that fights the one you already have.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};

const ORIGIN = argOf("--url", "http://localhost:3000");
const OUT = argOf("--out", ".visual");

/** The installed browser. No download; no second copy of Chromium. */
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No installed Chrome found. Set one in scripts/visual-baseline.mjs.");
  process.exit(1);
}

/** The journey, in order. §3 asks for the sequence, not a set of pages. */
const ROUTES = [
  ["landing", "/"],
  ["frontier", "/frontier"],
  ["camp", "/about"],
  ["book-journey", "/journey"],
  ["book-journal", "/projects"],
  ["record-tuneit", "/projects/tuneit"],
  ["book-gear", "/skills"],
  ["book-notes", "/notes"],
  ["board", "/bounties"],
  ["archive", "/archive"],
  ["trail-end", "/contact"],
  ["professional", "/professional"],
];

const VIEWPORTS = [
  ["desktop", 1440, 900, 1],
  ["mobile", 390, 844, 2],
];

/* Runs before anything on the page does, so the stamps in <head> read it. */
const PRIME = `
  try {
    window.localStorage.setItem("frontier.visited", "1");
    window.sessionStorage.setItem("frontier.booted", "1");
    window.sessionStorage.setItem("frontier:hour", "dusk");
    window.localStorage.setItem("frontier:quality", "high");
  } catch (e) {}
`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--hide-scrollbars",
    /* The Camp and the landing are WebGL. Software rendering is slow and is
       the only way a headless capture sees them at all. */
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-lcd-text",
  ],
});

let shots = 0;
for (const [label, w, h, dsf] of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf });
  await page.evaluateOnNewDocument(PRIME);

  for (const [name, route] of ROUTES) {
    /* Mobile only needs the journey's spine; the rest is the same document at
       a different width and tells you nothing a full set would not. */
    if (label === "mobile" && !/^(landing|frontier|camp|book-journal|record-tuneit|board)$/.test(name)) {
      continue;
    }
    await page.goto(ORIGIN + route, { waitUntil: "networkidle0", timeout: 60000 });
    /* Long enough for a deferred canvas to mount, arrive and settle; the
       Camp's own establish alone is 1.9s. */
    await new Promise((r) => setTimeout(r, 4200));
    const file = join(OUT, `${label}-${name}.png`);
    await page.screenshot({ path: file });
    shots += 1;
    console.log("  " + file);
  }
  await page.close();
}

await browser.close();
console.log(`\n${shots} frames written to ${OUT}/`);
