/**
 * The survey sheet's terrain, generated rather than hand-drawn.
 *
 * Everything here is deterministic (seeded) so server and client render byte
 * -identical markup, and so the whole composition can be re-tuned by changing
 * a number instead of redrawing a path by hand.
 *
 * Coordinate space is the survey sheet: 1600 x 1000.
 */

import {
  type Point,
  arcPath,
  jitterPoints,
  normal,
  offsetPolyline,
  polylinePath,
  pt,
  ringPoints,
  sampleLine,
  smoothPath,
} from "./geometry";
import { createRng, seedFrom } from "./rng";

export const SHEET_WIDTH = 1600;
export const SHEET_HEIGHT = 1000;

/** Neat line — the double rule that frames every survey sheet. */
const FRAME_OUTER = 30;
const FRAME_INNER = 44;

export interface MapLabel {
  x: number;
  y: number;
  text: string;
  rotate?: number;
  size?: number;
  kind: "terrain" | "water" | "survey" | "road";
  anchor?: "start" | "middle" | "end";
}

export interface Stain {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
}

export interface TerrainModel {
  frame: { outer: string; inner: string; ticks: string[]; corners: string[] };
  settlement: string[];
  mountains: { ridges: string[]; hachures: string[]; silhouettes: string[] };
  contours: string[];
  river: { channel: string; banks: string[]; tributary: string };
  marsh: string[];
  road: { lanes: string[]; bridge: string };
  scrub: string[];
  stations: { markers: string[]; lines: string[] };
  stains: Stain[];
  labels: MapLabel[];
}

/* -------------------------------------------------------------------------
   Frame and graticule
   ------------------------------------------------------------------------- */

function buildFrame(): TerrainModel["frame"] {
  const o = FRAME_OUTER;
  const i = FRAME_INNER;
  const outer = `M ${o} ${o} H ${SHEET_WIDTH - o} V ${SHEET_HEIGHT - o} H ${o} Z`;
  const inner = `M ${i} ${i} H ${SHEET_WIDTH - i} V ${SHEET_HEIGHT - i} H ${i} Z`;

  const ticks: string[] = [];
  for (let x = i + 100; x < SHEET_WIDTH - i; x += 100) {
    ticks.push(`M ${x} ${i} v 9`);
    ticks.push(`M ${x} ${SHEET_HEIGHT - i} v -9`);
  }
  for (let y = i + 100; y < SHEET_HEIGHT - i; y += 100) {
    ticks.push(`M ${i} ${y} h 9`);
    ticks.push(`M ${SHEET_WIDTH - i} ${y} h -9`);
  }

  // Register crosses at every second graticule intersection.
  const corners: string[] = [];
  for (let x = i + 200; x < SHEET_WIDTH - i; x += 200) {
    for (let y = i + 200; y < SHEET_HEIGHT - i; y += 200) {
      corners.push(`M ${x - 6} ${y} h 12 M ${x} ${y - 6} v 12`);
    }
  }

  return { outer, inner, ticks, corners };
}

/* -------------------------------------------------------------------------
   Mountains — three overlapping ridges, hachured on the south face
   ------------------------------------------------------------------------- */

function ridgePoints(
  seed: string,
  x0: number,
  x1: number,
  baseY: number,
  peaks: number,
  amplitude: number,
): Point[] {
  const rng = createRng(seedFrom(seed));
  const out: Point[] = [pt(x0, baseY)];
  const span = (x1 - x0) / peaks;

  for (let i = 0; i < peaks; i += 1) {
    const footL = x0 + span * i;
    const peakX = footL + span * rng.range(0.32, 0.64);
    const peakY = baseY - amplitude * rng.range(0.55, 1);
    const saddleX = footL + span * rng.range(0.78, 0.94);
    const saddleY = baseY - amplitude * rng.range(0.08, 0.28);
    out.push(pt(peakX, peakY), pt(saddleX, saddleY));
  }

  out.push(pt(x1, baseY));
  return out;
}

function hachuresFor(points: Point[], seed: string, density: number, length: number): string[] {
  const rng = createRng(seedFrom(seed));
  const out: string[] = [];

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const segLength = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.round(segLength / density));
    const isSouthFace = b.y > a.y; // drawing down-slope only

    if (!isSouthFace) continue;

    for (let s = 0; s < steps; s += 1) {
      const t = (s + 0.5) / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const nrm = normal(a, b);
      const len = length * rng.range(0.45, 1);
      out.push(
        `M ${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10} l ${Math.round(nrm.x * len * 10) / 10} ${
          Math.round(nrm.y * len * 10) / 10
        }`,
      );
    }
  }

  return out;
}

/** Closes a ridge down to the foot of the sheet, making a fillable shape. */
function silhouette(points: Point[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  return `${polylinePath(points)} L ${last.x} ${SHEET_HEIGHT} L ${first.x} ${SHEET_HEIGHT} Z`;
}

/**
 * The three ridge silhouettes as points, before anything decides how to draw
 * them.
 *
 * Widened so a filled silhouette reaches past the frame on the landing scene,
 * where the ridge is scenery rather than cartography — and for the same
 * reason they are what Camp stands in front of. The illustrated camp already
 * borrows these; the rendered one has to borrow the same ones or the two are
 * different places wearing the same name.
 *
 * Safe to call more than once: ridgePoints seeds its own generator from the
 * name, so each silhouette is the same silhouette regardless of when or in
 * what order it is asked for.
 */
export function silhouettePoints(): Point[][] {
  return [
    ridgePoints("sil-far", -120, 1760, 300, 8, 132),
    ridgePoints("sil-mid", -160, 1740, 380, 6, 96),
    ridgePoints("sil-near", -140, 1780, 470, 5, 64),
  ];
}

function buildMountains(): TerrainModel["mountains"] {
  const far = ridgePoints("ridge-far", 330, 1540, 262, 7, 118);
  const mid = ridgePoints("ridge-mid", 380, 1500, 292, 5, 86);
  const near = ridgePoints("ridge-near", 300, 1120, 316, 4, 58);

  const [wideFar, wideMid, wideNear] = silhouettePoints();

  const rngA = createRng(seedFrom("ridge-jitter-a"));
  const rngB = createRng(seedFrom("ridge-jitter-b"));
  const rngC = createRng(seedFrom("ridge-jitter-c"));

  return {
    ridges: [
      polylinePath(jitterPoints(far, rngA, 2.4)),
      polylinePath(jitterPoints(mid, rngB, 2)),
      polylinePath(jitterPoints(near, rngC, 1.6)),
    ],
    hachures: [
      ...hachuresFor(far, "hach-far", 16, 13),
      ...hachuresFor(mid, "hach-mid", 18, 10),
    ],
    silhouettes: [silhouette(wideFar), silhouette(wideMid), silhouette(wideNear)],
  };
}

/* -------------------------------------------------------------------------
   Contours — high ground around the Bounties plateau, plus a western knoll
   ------------------------------------------------------------------------- */

function contourSet(seed: string, cx: number, cy: number, rings: number, rx: number, ry: number): string[] {
  const rng = createRng(seedFrom(seed));
  const out: string[] = [];
  for (let i = 0; i < rings; i += 1) {
    const scale = 1 - i * (0.72 / rings);
    out.push(
      smoothPath(ringPoints(cx, cy, rx * scale, ry * scale, 22, rng, 0.055), true),
    );
  }
  return out;
}

/* -------------------------------------------------------------------------
   Water
   ------------------------------------------------------------------------- */

const RIVER_SPINE: Point[] = [
  pt(596, 296),
  pt(508, 402),
  pt(486, 536),
  pt(600, 676),
  pt(842, 776),
  pt(1094, 838),
  pt(1348, 892),
  pt(1556, 938),
];

const TRIBUTARY_SPINE: Point[] = [
  pt(1206, 606),
  pt(1170, 700),
  pt(1118, 792),
  pt(1094, 838),
];

function buildRiver(): TerrainModel["river"] {
  const rng = createRng(seedFrom("river"));
  const spine = jitterPoints(RIVER_SPINE, rng, 3);
  return {
    channel: smoothPath(spine),
    banks: [
      smoothPath(offsetPolyline(spine, 7)),
      smoothPath(offsetPolyline(spine, -7)),
    ],
    tributary: smoothPath(jitterPoints(TRIBUTARY_SPINE, rng, 2.5)),
  };
}

function buildMarsh(): string[] {
  const rng = createRng(seedFrom("marsh"));
  const out: string[] = [];
  for (let i = 0; i < 26; i += 1) {
    const x = rng.range(660, 1000);
    const y = rng.range(790, 866);
    const w = rng.range(9, 16);
    out.push(`M ${Math.round(x)} ${Math.round(y)} h ${Math.round(w)}`);
    out.push(`M ${Math.round(x + 3)} ${Math.round(y + 5)} h ${Math.round(w - 5)}`);
  }
  return out;
}

/* -------------------------------------------------------------------------
   The old post road — double lane, distinct from a surveyor's trail
   ------------------------------------------------------------------------- */

const ROAD_SPINE: Point[] = [
  pt(FRAME_INNER, 892),
  pt(300, 872),
  pt(620, 884),
  pt(900, 856),
  pt(1180, 812),
  pt(1420, 830),
  pt(SHEET_WIDTH - FRAME_INNER, 846),
];

function buildRoad(): TerrainModel["road"] {
  const rng = createRng(seedFrom("road"));
  const spine = jitterPoints(ROAD_SPINE, rng, 2);
  return {
    lanes: [
      smoothPath(offsetPolyline(spine, 5)),
      smoothPath(offsetPolyline(spine, -5)),
    ],
    // Where the road meets the river, a short double tick: a bridge.
    bridge: "M 886 838 l 0 -22 M 916 842 l 0 -22",
  };
}

/* -------------------------------------------------------------------------
   Scrub and timber — stipple, not illustration
   ------------------------------------------------------------------------- */

function scrubPatch(seed: string, x0: number, x1: number, y0: number, y1: number, count: number): string[] {
  const rng = createRng(seedFrom(seed));
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(rng.range(x0, x1));
    const y = Math.round(rng.range(y0, y1));
    const h = Math.round(rng.range(7, 13));
    const w = Math.round(rng.range(3, 6));
    out.push(`M ${x} ${y} v -${h} M ${x - w} ${y - h + 3} L ${x} ${y - h} L ${x + w} ${y - h + 3}`);
  }
  return out;
}

/* -------------------------------------------------------------------------
   The townsite.

   Town is drawn as a place on the ground, not as a navigable location: the
   record office (Archive) is the destination, and it stands just north-east of
   the settlement. Keeping the town as terrain means the territory still reads
   as inhabited without inventing a second URL for the same content.
   ------------------------------------------------------------------------- */

function buildSettlement(): string[] {
  const rng = createRng(seedFrom("townsite"));
  const out: string[] = [];

  for (let i = 0; i < 11; i += 1) {
    const x = Math.round(rng.range(1096, 1242));
    const y = Math.round(rng.range(628, 700));
    const w = Math.round(rng.range(8, 14));
    const h = Math.round(rng.range(6, 10));
    // A roof over a wall line: the smallest mark that still reads as a building.
    out.push(`M ${x - w} ${y} L ${x} ${y - h} L ${x + w} ${y} Z`);
    out.push(`M ${x - w + 1} ${y} v ${Math.round(rng.range(3, 6))}`);
    out.push(`M ${x + w - 1} ${y} v ${Math.round(rng.range(3, 6))}`);
  }

  // A church or meeting hall, marked by its spire.
  out.push("M 1160 704 L 1160 676 M 1152 704 L 1160 662 L 1168 704");

  return out;
}

/* -------------------------------------------------------------------------
   Triangulation — the measured lines that make it a survey and not a drawing
   ------------------------------------------------------------------------- */

const STATIONS: Point[] = [pt(432, 322), pt(1128, 362), pt(742, 726)];

function buildStations(): TerrainModel["stations"] {
  const markers = STATIONS.map(
    (s) => `M ${s.x} ${s.y - 9} L ${s.x + 8} ${s.y + 5} L ${s.x - 8} ${s.y + 5} Z`,
  );

  const lines = [
    arcPath(STATIONS[0], STATIONS[1], -18),
    arcPath(STATIONS[1], STATIONS[2], 14),
    arcPath(STATIONS[2], STATIONS[0], 12),
  ];

  return { markers, lines };
}

/* -------------------------------------------------------------------------
   Foxing and water stains on the sheet
   ------------------------------------------------------------------------- */

function buildStains(): Stain[] {
  const rng = createRng(seedFrom("stains"));
  const out: Stain[] = [];
  for (let i = 0; i < 7; i += 1) {
    out.push({
      cx: Math.round(rng.range(120, SHEET_WIDTH - 120)),
      cy: Math.round(rng.range(120, SHEET_HEIGHT - 120)),
      rx: Math.round(rng.range(90, 230)),
      ry: Math.round(rng.range(70, 170)),
      opacity: Math.round(rng.range(0.05, 0.13) * 1000) / 1000,
    });
  }
  return out;
}

/* -------------------------------------------------------------------------
   Place names. Generic frontier topography — nothing borrowed from anywhere.
   ------------------------------------------------------------------------- */

const LABELS: MapLabel[] = [
  { x: 690, y: 196, text: "S I G N A L   R I D G E", kind: "terrain", size: 21, rotate: -3 },
  { x: 1338, y: 268, text: "B R O K E N   S C A R P", kind: "terrain", size: 18, rotate: 4 },
  { x: 236, y: 566, text: "T H E   L O N G   D R A W", kind: "terrain", size: 18, rotate: -6, anchor: "start" },
  { x: 566, y: 348, text: "D R Y   F O R K", kind: "water", size: 17, rotate: 50 },
  { x: 1146, y: 774, text: "C O L D   S P R I N G", kind: "water", size: 15, rotate: 62 },
  { x: 1168, y: 736, text: "T O W N S I T E", kind: "terrain", size: 16 },
  { x: 742, y: 842, text: "T H E   S H A L L O W S", kind: "water", size: 16 },
  { x: 372, y: 906, text: "O L D   P O S T   R O A D", kind: "road", size: 15, rotate: -2 },
  { x: 1072, y: 214, text: "EL. 2140", kind: "survey", size: 15 },
  { x: 432, y: 346, text: "STA. 1", kind: "survey", size: 14 },
  { x: 1128, y: 386, text: "STA. 2", kind: "survey", size: 14 },
  { x: 742, y: 750, text: "STA. 3", kind: "survey", size: 14 },
];

/* -------------------------------------------------------------------------
   Assembly — computed once at module scope
   ------------------------------------------------------------------------- */

function build(): TerrainModel {
  return {
    frame: buildFrame(),
    settlement: buildSettlement(),
    mountains: buildMountains(),
    contours: [
      ...contourSet("contour-bounties", 1030, 250, 5, 186, 104),
      ...contourSet("contour-knoll", 404, 402, 3, 96, 58),
    ],
    river: buildRiver(),
    marsh: buildMarsh(),
    road: buildRoad(),
    scrub: [
      ...scrubPatch("scrub-west", 150, 420, 590, 690, 34),
      ...scrubPatch("scrub-east", 1240, 1460, 700, 786, 22),
      ...scrubPatch("scrub-mid", 640, 780, 560, 624, 14),
    ],
    stations: buildStations(),
    stains: buildStains(),
    labels: LABELS,
  };
}

export const terrain: TerrainModel = build();

/** Scale bar: 0–20 miles in four divisions, drawn at the sheet's foot. */
export const SCALE_BAR = {
  x: 96,
  y: 916,
  width: 208,
  height: 9,
  divisions: 4,
  caption: "0        5       10       15      20  MILES",
};

/** Compass rose station, kept clear of every location node. */
export const COMPASS = { x: 158, y: 196, radius: 62 };

export { sampleLine, polylinePath, smoothPath, pt };
