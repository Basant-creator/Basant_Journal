/**
 * Performance probe: how smoothly each place runs, at rest and while scrolled.
 *
 *   npm run build && npm run start      # in one terminal — measure production
 *   node scripts/perf-probe.mjs         # in another
 *
 * Options:
 *   --base http://localhost:3000   the server to measure
 *   --cpu 4                        CPU slowdown (Emulation.setCPUThrottlingRate):
 *                                  1 is this machine, 4 a mid laptop, 6 a weak one
 *   --gpu hardware|software        software = SwiftShader, a machine with no GPU
 *   --dsf 1|2                      device scale factor: 2 is a high-DPI screen
 *   --tier high|medium|low|fallback  pin the quality tier; default is detected
 *   --only landing,camp            restrict to named routes
 *   --settle 1.5                   seconds to wait after a scene has drawn,
 *                                  before measuring — long enough for the
 *                                  scene's own pacing to settle
 *
 * Why a script and not the in-app browser: the pane runs requestAnimationFrame
 * at a fixed 40 Hz whatever the page costs, so it cannot see a dropped frame.
 * This drives the installed Chrome over the DevTools protocol instead — real
 * frame timing at 60 Hz, real trusted wheel events (so Lenis is exercised as a
 * visitor exercises it), and the main thread's own accounting of where the
 * time went. Nothing is downloaded; it uses the browser already on the
 * machine, like visual-baseline.mjs.
 *
 * What it reports, per route and per phase (rest, then a wheel scroll):
 *   fps      frames per second the page actually produced
 *   p95      95th-percentile frame interval, ms — the stutter a visitor feels
 *   janky    frames over 25ms, i.e. at least one frame missed at 60 Hz
 *   busy     share of wall time the main thread spent in tasks
 *   style/layout/script  where that time went, ms over the phase
 */

import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
function argOf(name, fallback) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
}

const BASE = argOf("--base", "http://localhost:3000");
const CPU = Number(argOf("--cpu", "1"));
const GPU = argOf("--gpu", "hardware");
const DSF = Number(argOf("--dsf", "1"));
const TIER = argOf("--tier", "");
const ONLY = (argOf("--only", "") || "").split(",").filter(Boolean);
const SETTLE = Number(argOf("--settle", "1.5"));

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No installed Chrome found. Set one in scripts/perf-probe.mjs.");
  process.exit(1);
}

const ROUTES = [
  ["landing", "/"],
  ["frontier", "/frontier"],
  ["camp", "/about"],
  ["journal", "/projects"],
  ["record", "/projects/tuneit"],
  ["board", "/bounties"],
  ["archive", "/archive"],
  ["trail-end", "/contact"],
  ["professional", "/professional"],
].filter(([name]) => ONLY.length === 0 || ONLY.includes(name));

/* Before anything on the page runs: skip the once-per-visit boot, pin the
   hour, and pin the tier if asked. */
const PRIME = `
  try {
    window.localStorage.setItem("frontier.visited", "1");
    window.sessionStorage.setItem("frontier.booted", "1");
    window.sessionStorage.setItem("frontier:hour", "dusk");
    ${TIER ? `window.localStorage.setItem("frontier:quality", "${TIER}");` : `window.localStorage.removeItem("frontier:quality");`}
  } catch (e) {}
`;

const GPU_ARGS =
  GPU === "software"
    ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    : ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-lcd-text", ...GPU_ARGS],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* A rAF recorder living in the page: frame intervals, nothing else. */
const RECORDER = `
  window.__frames = [];
  window.__recording = true;
  (function () {
    let last = performance.now();
    const tick = (t) => {
      window.__frames.push(t - last);
      last = t;
      if (window.__recording) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();
`;

function summarise(frames, seconds, before, after) {
  const f = frames.slice(1);
  const sorted = [...f].sort((a, b) => a - b);
  const pick = (q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : 0);
  const d = (k) => (after[k] ?? 0) - (before[k] ?? 0);
  return {
    fps: +(f.length / seconds).toFixed(1),
    p95: +pick(0.95).toFixed(1),
    max: +(sorted[sorted.length - 1] ?? 0).toFixed(1),
    janky: f.filter((x) => x > 25).length,
    busy: +((d("TaskDuration") / seconds) * 100).toFixed(1),
    style: Math.round(d("RecalcStyleDuration") * 1000),
    layout: Math.round(d("LayoutDuration") * 1000),
    script: Math.round(d("ScriptDuration") * 1000),
  };
}

async function metrics(client) {
  const { metrics: list } = await client.send("Performance.getMetrics");
  return Object.fromEntries(list.map((m) => [m.name, m.value]));
}

async function phase(page, client, seconds, action) {
  await page.evaluate(RECORDER);
  const before = await metrics(client);
  const t0 = Date.now();
  if (action) await action();
  const left = seconds * 1000 - (Date.now() - t0);
  if (left > 0) await sleep(left);
  const after = await metrics(client);
  const frames = await page.evaluate(() => {
    window.__recording = false;
    return window.__frames;
  });
  return summarise(frames, seconds, before, after);
}

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: DSF });
await page.evaluateOnNewDocument(PRIME);
const client = await page.target().createCDPSession();
await client.send("Performance.enable");
await client.send("Emulation.setCPUThrottlingRate", { rate: CPU });

const rows = [];
let renderer = "";

for (const [name, route] of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "load" });

  /* Let the page arrive: the curtain, the idle mount of any scene, its first
     frame. A scene reports data-scene-drawn once it has drawn. */
  await page
    .waitForFunction(
      () => {
        const stage = document.querySelector("[data-scene-mode]");
        if (!stage) return true;
        const mode = stage.getAttribute("data-scene-mode");
        return mode !== "ready" && mode !== "pending" ? true : stage.hasAttribute("data-scene-drawn");
      },
      { timeout: 20000, polling: 250 },
    )
    .catch(() => {});
  await sleep(SETTLE * 1000);

  if (!renderer) {
    renderer = await page.evaluate(() => {
      try {
        const gl = document.createElement("canvas").getContext("webgl");
        const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
        return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
      } catch {
        return "unknown";
      }
    });
  }

  const sceneState = () =>
    page.evaluate(() => {
      const stage = document.querySelector("[data-scene-mode]");
      if (!stage) return "-";
      const canvas = stage.querySelector("canvas");
      const reason = stage.getAttribute("data-scene-reason");
      return `${stage.getAttribute("data-scene-mode")}${reason && reason !== "ready" ? `(${reason})` : ""}${canvas ? ` ${canvas.width}x${canvas.height}` : ""}`;
    });
  const scene = await sceneState();

  const rest = await phase(page, client, 3, null);

  await page.mouse.move(720, 450);
  const scroll = await phase(page, client, 3, async () => {
    for (let i = 0; i < 14; i += 1) {
      await page.mouse.wheel({ deltaY: 110 });
      await sleep(90);
    }
  });

  rows.push({ name, scene, rest, scroll, after: await sceneState() });
}

await browser.close();

const cell = (s) =>
  `${String(s.fps).padStart(5)}fps p95 ${String(s.p95).padStart(5)} max ${String(s.max).padStart(6)} janky ${String(s.janky).padStart(3)} busy ${String(s.busy).padStart(5)}% ` +
  `st ${String(s.style).padStart(4)} ly ${String(s.layout).padStart(4)} js ${String(s.script).padStart(4)}`;

console.log(`\nperf-probe  cpu x${CPU}  gpu ${GPU} (${renderer})  dsf ${DSF}  tier ${TIER || "detected"}\n`);
for (const r of rows) {
  console.log(`${r.name.padEnd(13)} ${r.scene.padEnd(24)}${r.after !== r.scene ? ` -> ${r.after}` : ""}`);
  console.log(`  rest    ${cell(r.rest)}`);
  console.log(`  scroll  ${cell(r.scroll)}`);
}
