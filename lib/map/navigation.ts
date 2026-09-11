/**
 * Directional traversal across the map.
 *
 * Arrow keys move focus by geographic proximity, not DOM order — pressing
 * Right on the sheet should reach whatever actually lies east, which is the
 * only behaviour that makes sense on a spatial surface. Trail order is still
 * available through Home/End and through the index list.
 */

import type { NavigationLocation } from "@/lib/content/types";

export type Direction = "up" | "down" | "left" | "right";

const AXIS: Record<Direction, { x: number; y: number }> = {
  // Sheet coordinates: y grows downward.
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function directionForKey(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

/**
 * The nearest location in a direction.
 *
 * Candidates inside a 90-degree cone are preferred and scored by distance
 * along the axis plus a penalty for drifting sideways, so "straight ahead and
 * close" wins over "far off to one side". If the cone is empty the search
 * widens to the whole half-plane, so a key press is never swallowed while
 * anything at all lies that way.
 */
export function nearestInDirection(
  from: NavigationLocation,
  all: NavigationLocation[],
  direction: Direction,
): NavigationLocation | null {
  const axis = AXIS[direction];
  const [fx, fy] = from.coord;

  let coned: { location: NavigationLocation; score: number } | null = null;
  let halfPlane: { location: NavigationLocation; score: number } | null = null;

  for (const candidate of all) {
    if (candidate.id === from.id) continue;

    const dx = candidate.coord[0] - fx;
    const dy = candidate.coord[1] - fy;

    const along = dx * axis.x + dy * axis.y;
    if (along <= 0) continue;

    const across = Math.abs(dx * axis.y - dy * axis.x);
    const score = along + across * 0.6;

    if (!halfPlane || score < halfPlane.score) {
      halfPlane = { location: candidate, score };
    }

    if (across <= along && (!coned || score < coned.score)) {
      coned = { location: candidate, score };
    }
  }

  return (coned ?? halfPlane)?.location ?? null;
}
