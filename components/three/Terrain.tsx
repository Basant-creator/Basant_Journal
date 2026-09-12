"use client";

import { useMemo } from "react";
import { Shape } from "three";
import { ridgeProfiles, VISTA_WIDTH, SHEET_INSET } from "@/lib/world/vista";
import { scene } from "./palette";

/**
 * Where each ridge stands, and how big it is there.
 *
 * Further bands are *larger* in world units, not smaller: perspective shrinks
 * them on the way to the camera, and a distant ridge modelled at its literal
 * size would vanish into a bump. These three numbers are the whole of the
 * scene's depth, so they sit together where they can be compared.
 */
const BANDS = [
  { z: -38, scale: 0.075, colour: scene.depth[0] },
  { z: -28, scale: 0.058, colour: scene.depth[1] },
  { z: -20, scale: 0.045, colour: scene.depth[2] },
] as const;

const HORIZON = SHEET_INSET.top;

/**
 * The country, as silhouettes.
 *
 * Flat shapes standing at three depths rather than a heightfield, and the
 * choice is the same one the 2D scene already made and wrote down: "distance,
 * as silhouettes rather than terrain". A displaced mesh would cost thousands
 * of triangles and a normal map to say something a black shape against a
 * lighter one says for three draw calls.
 *
 * The profiles come from `ridgeProfiles()` — the same seeded stream the survey
 * map draws its skyline from — so this is not a ridge *like* the one on the
 * sheet, it is that ridge. Someone who walks from the map into Camp is looking
 * at the country they were just holding a drawing of.
 *
 * Geometry is built declaratively from a memoised Shape, so R3F owns its
 * lifetime and disposes it with the tree.
 */
export function Terrain() {
  const shapes = useMemo(() => {
    const profiles = ridgeProfiles();

    return profiles.map((points, i) => {
      const { scale } = BANDS[i];
      const shape = new Shape();

      /* Vista space is y-down from a horizon; world space is y-up from the
         ground. Height is the drop below the horizon, inverted once, here. */
      const wx = (x: number) => (x - VISTA_WIDTH / 2) * scale;
      const wy = (y: number) => (HORIZON - y) * scale;

      shape.moveTo(wx(points[0].x), 0);
      for (const point of points) shape.lineTo(wx(point.x), wy(point.y));
      shape.lineTo(wx(points[points.length - 1].x), 0);
      shape.closePath();

      return shape;
    });
  }, []);

  return (
    <group>
      {/* The floor. Unlit-dark rather than a lit plane: at dusk the ground is
          read from what stands on it, and a standard material here just
          spends a lighting pass to come out nearly black anyway. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={scene.ground} roughness={1} metalness={0} />
      </mesh>

      {BANDS.map((band, i) => (
        <mesh key={`ridge-${i}`} position={[0, 0, band.z]}>
          <shapeGeometry args={[shapes[i]]} />
          {/* Basic, not standard: a silhouette that responds to light stops
              being a silhouette. Fog still reaches it, which is what keeps the
              three bands separated. */}
          <meshBasicMaterial color={band.colour} fog />
        </mesh>
      ))}
    </group>
  );
}
