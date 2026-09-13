"use client";

import { useMemo } from "react";
import { Shape } from "three";
import { buildLandBands } from "@/lib/world/camp";
import { land } from "./palette";

/**
 * The ground, and the country going away from it.
 *
 * Silhouettes rather than a heightfield, which is the same call the map's
 * terrain made and wrote down: a displaced mesh would cost thousands of
 * triangles and a normal map to say what a dark shape against a lighter one
 * says in four draw calls. At blue hour, with no sun to model form, a
 * displaced surface would look almost exactly like this and cost far more.
 *
 * Each band is lighter and bluer than the one in front of it. That is the
 * whole mechanism — aerial perspective is the only thing making flat shapes
 * read as distance, and it is why the palette's four land values step toward
 * the sky rather than away from it.
 *
 * The bands are generated once at module scope in `lib/world/camp.ts`, beside
 * the treeline and scatter the illustrated camp already uses, so that when the
 * drawn version needs the same country it reads the same generator rather than
 * being redrawn to match.
 */

/** How wide each band is cut. Generous: a band whose ends enter the frame
 *  stops being country and becomes a prop. */
const BAND_WIDTH = 96;

export function CampTerrain() {
  const bands = useMemo(() => {
    return buildLandBands().map((band) => {
      const shape = new Shape();
      const steps = band.profile.length - 1;
      const x = (i: number) => -BAND_WIDTH / 2 + (i / steps) * BAND_WIDTH;

      /* Down to well below the ground line, so the band is a solid mass
         rather than a ribbon — the ground plane hides the bottom edge. */
      shape.moveTo(x(0), -6);
      band.profile.forEach((h, i) => shape.lineTo(x(i), h));
      shape.lineTo(x(steps), -6);
      shape.closePath();

      return { shape, z: band.z };
    });
  }, []);

  /* Furthest first, nearest last: four values stepping down from the haze. */
  const tone = [land.far, land.mid, land.near, land.treeline];

  return (
    <group>
      {bands.map((band, i) => (
        <mesh key={`land-${i}`} position={[0, 0, band.z]}>
          <shapeGeometry args={[band.shape]} />
          {/*
            Basic, not standard. A silhouette that responds to light stops
            being a silhouette, and at this hour there is no light worth
            responding to out there anyway. Fog still reaches it, which is
            what keeps the four bands separated rather than stacked.
          */}
          <meshBasicMaterial color={tone[bands.length - 1 - i]} fog />
        </mesh>
      ))}
    </group>
  );
}
