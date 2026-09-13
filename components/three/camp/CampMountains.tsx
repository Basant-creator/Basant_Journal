"use client";

import { useMemo } from "react";
import { Shape } from "three";
import { silhouettePoints } from "@/lib/map/terrain";
import { MOUNTAINS, SHEET_MIDDLE } from "./layout";
import { land, sky } from "./palette";

/**
 * The survey's own mountains, standing up.
 *
 * These are not mountains like the ones on the map. They are the ones on the
 * map — `silhouettePoints()` is the same seeded generator the sheet draws and
 * the illustrated camp already borrows. A visitor who walks from the frontier
 * into Camp is looking at the country they were holding a drawing of, which is
 * the entire reason this project keeps its generators in one place.
 *
 * Sheet coordinates are y-down from a baseline; world coordinates are y-up
 * from the ground. The conversion happens once, here, and the scale that does
 * it is derived from each silhouette's own amplitude rather than typed in — so
 * if the map's mountains ever change shape, Camp's change with them instead of
 * drifting quietly apart.
 *
 * Flat shapes again, and by now for a familiar reason: at blue hour, seen from
 * nineteen to fifty-eight metres, a modelled mountain and a dark shape against
 * a lighter sky are the same picture at very different prices.
 */
export function CampMountains() {
  const ridges = useMemo(() => {
    const silhouettes = silhouettePoints();

    return MOUNTAINS.map((ridge, i) => {
      const points = silhouettes[i];
      /* The first point sits on the baseline, which is what every height is
         measured down from. */
      const base = points[0].y;
      const tallest = points.reduce((m, p) => Math.max(m, base - p.y), 0);
      const scale = ridge.crest / tallest;

      const shape = new Shape();
      const wx = (x: number) => (x - SHEET_MIDDLE) * scale;
      const wy = (y: number) => (base - y) * scale;

      /* Dropped well below the ground line so the ridge is a mass rather than
         a ribbon; the land in front hides where it ends. */
      shape.moveTo(wx(points[0].x), -14);
      points.forEach((p) => shape.lineTo(wx(p.x), wy(p.y)));
      shape.lineTo(wx(points[points.length - 1].x), -14);
      shape.closePath();

      return { shape, z: ridge.z };
    });
  }, []);

  /* Furthest is nearly the sky; nearest is nearly the land. That progression
     is the depth — three identical greys would read as three cut-outs. */
  const tone = [sky.haze, land.far, land.mid];

  return (
    <group>
      {ridges.map((ridge, i) => (
        <mesh key={`ridge-${i}`} position={[0, 0, ridge.z]}>
          <shapeGeometry args={[ridge.shape]} />
          <meshBasicMaterial color={tone[i]} fog />
        </mesh>
      ))}
    </group>
  );
}
