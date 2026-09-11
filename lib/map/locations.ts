/**
 * Routes and camera maths for the survey map.
 *
 * Trails are derived from the content model's location order — add a location
 * to portfolio.json and the trail between it and its neighbour appears.
 */

import { locations, originLocationId, primaryLocationId } from "@/lib/content/portfolio";
import type { NavigationLocation } from "@/lib/content/types";
import { arcPath, pt } from "./geometry";
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
  "camp>gear": -34,
  "gear>journal": -38,
  "journal>bounties": -30,
  "bounties>town": 40,
  "town>archive": -26,
  "archive>trail-end": 34,
};

/** The shortcut sags south along the valley floor, under the Gear route. */
const PRIMARY_BOW = 62;

function coordOf(location: NavigationLocation) {
  return pt(location.coord[0], location.coord[1]);
}

function buildTrails(): Trail[] {
  const out: Trail[] = [];

  for (let i = 1; i < locations.length; i += 1) {
    const from = locations[i - 1];
    const to = locations[i];
    const key = `${from.id}>${to.id}`;
    out.push({
      id: key,
      from: from.id,
      to: to.id,
      path: arcPath(coordOf(from), coordOf(to), BOW[key] ?? 0),
      kind: "route",
      index: i - 1,
    });
  }

  const origin = locations.find((l) => l.id === originLocationId);
  const primary = locations.find((l) => l.id === primaryLocationId);

  if (origin && primary) {
    out.push({
      id: `${origin.id}>${primary.id}:primary`,
      from: origin.id,
      to: primary.id,
      path: arcPath(coordOf(origin), coordOf(primary), PRIMARY_BOW),
      kind: "primary",
      index: out.length,
    });
  }

  return out;
}

export const trails: Trail[] = buildTrails();

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
