/**
 * Routes and camera maths for the survey map.
 *
 * Trails are derived from the content model's location order — add a location
 * to portfolio.json and the trail between it and its neighbour appears.
 */

import { locations, originLocationId, primaryLocationId } from "@/lib/content/portfolio";
import type { NavigationLocation } from "@/lib/content/types";
import { type PointOnPath, arcPath, pointOnArc, pt } from "./geometry";
import { SHEET_HEIGHT, SHEET_WIDTH } from "./terrain";

export type TrailKind = "route" | "primary";

export interface Trail {
  id: string;
  from: string;
  to: string;
  path: string;
  kind: TrailKind;
  /** Draw order for the staggered reveal. */
  index: number;
}

/**
 * How far each segment bows off the straight line. Hand-tuned so routes follow
 * plausible ground — around the knoll, along the draw, clear of the river.
 */
const BOW: Record<string, number> = {
  "camp>journal": 62,
  "journal>bounties": -30,
  "bounties>archive": 44,
  "archive>trail-end": 34,
  /* The spur. */
  "journal>gear": -26,
};

/*
  The main trail, and which locations are on it.

  §15 asks for one clearly readable route through the world, and the map was
  drawing something else: a chain that ran Camp -> Gear -> Journal -> Bounties
  -> Archive -> Trail End, with a separate red shortcut from Camp to Journal
  laid over the top. Two routes, and the longer one detoured through Gear.

  Gear is not a place in the world. §4 is explicit that it lives *inside* the
  Records checkpoint along with the journey and the project files, and a world
  route that visits it is the same category error the bookmarks were making —
  document scale drawn as territory.

  So the main trail is the checkpoint sequence and nothing else, and Gear
  hangs off Records as a spur: on the sheet, reachable, plainly not on the
  way to anywhere.
*/
const MAIN_SEQUENCE = ["camp", "journal", "bounties", "archive", "trail-end"];

/** Spurs: a location that is drawn, but is not a stop on the world route. */
const SPURS: Array<[string, string]> = [["journal", "gear"]];

function coordOf(location: NavigationLocation) {
  return pt(location.coord[0], location.coord[1]);
}

function buildTrails(): Trail[] {
  const out: Trail[] = [];
  const byId = new Map(locations.map((l) => [l.id, l]));

  /* The world route, in red, drawn first so the eye finds it first. */
  for (let i = 1; i < MAIN_SEQUENCE.length; i += 1) {
    const from = byId.get(MAIN_SEQUENCE[i - 1]);
    const to = byId.get(MAIN_SEQUENCE[i]);
    if (!from || !to) continue;
    const key = `${from.id}>${to.id}`;
    out.push({
      id: key,
      from: from.id,
      to: to.id,
      path: arcPath(coordOf(from), coordOf(to), BOW[key] ?? 0),
      kind: "primary",
      index: out.length,
    });
  }

  /* Spurs, in ink: drawn ground that the route does not take. */
  for (const [anchorId, leafId] of SPURS) {
    const from = byId.get(anchorId);
    const to = byId.get(leafId);
    if (!from || !to) continue;
    const key = `${from.id}>${to.id}`;
    out.push({
      id: key,
      from: from.id,
      to: to.id,
      path: arcPath(coordOf(from), coordOf(to), BOW[key] ?? 0),
      kind: "route",
      index: out.length,
    });
  }

  return out;
}

export const trails: Trail[] = buildTrails();

/** The Camp -> Journal shortcut: the narrative route, drawn in red. */
export const primaryTrail: Trail | undefined = trails.find((t) => t.kind === "primary");

/**
 * Survey arrows laid along the primary trail.
 *
 * Direction is communicated by static marks on the line rather than by a
 * moving one — a trail that reads as "this way" when nothing is animating at
 * all, which is what reduced-motion and a failed stylesheet both need.
 */
export const primaryTrailArrows: PointOnPath[] = (() => {
  /* Taken from the main sequence rather than from the origin/primary pair, so
     the arrows cannot end up on a different arc from the one they are meant to
     be lying on. They mark the first leg out of Camp. */
  const from = locations.find((l) => l.id === MAIN_SEQUENCE[0]);
  const to = locations.find((l) => l.id === MAIN_SEQUENCE[1]);
  if (!from || !to) return [];
  const bow = BOW[`${from.id}>${to.id}`] ?? 0;

  return [0.3, 0.56, 0.82].map((t) =>
    pointOnArc(pt(from.coord[0], from.coord[1]), pt(to.coord[0], to.coord[1]), bow, t),
  );
})();

/** Trail segments that touch a location — used to brighten the route on hover. */
export function trailsTouching(locationId: string): string[] {
  return trails.filter((t) => t.from === locationId || t.to === locationId).map((t) => t.id);
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export const RESTING_CAMERA: Camera = { x: 0, y: 0, scale: 1 };

/**
 * Frames a location at the centre of the sheet.
 *
 * Assumes the transformed group has `transform-origin: 0 0`, so the composed
 * transform is translate(x, y) scale(k) and the maths stays this simple.
 */
export function cameraFor(coord: [number, number], zoom = 1.28): Camera {
  const [cx, cy] = coord;
  return {
    x: SHEET_WIDTH / 2 - cx * zoom,
    y: SHEET_HEIGHT / 2 - cy * zoom,
    scale: zoom,
  };
}
