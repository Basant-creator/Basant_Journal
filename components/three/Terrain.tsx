"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, Shape } from "three";
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

/** Just behind the furthest ridge, so a height in the sky is the same
 *  height on the crest and the band can be aimed rather than guessed. */
const SKY_Z = BANDS[0].z - 0.5;
const SKY_HEIGHT = 60;
const SKY_CENTRE = 20;

/**
 * The last light.
 *
 * Without it the ridges are dark shapes on a dark clear colour and the whole
 * country reads as black — which is exactly what the first cut of this did,
 * and exactly what the first cut of the *illustrated* vista did before it.
 * MapVista.module.css carries the warning in its own comment: the warm band
 * has to land above the highest crest, or the ridges cover the only light in
 * the picture.
 *
 * So it is aimed rather than eyeballed. The furthest ridge crests at
 * 10.5 units; the plane spans -10 to 50; the band sits just above that crest
 * in the same units, and the gradient below it is academic because the
 * ridges are drawn over it.
 *
 * Generated, unlit and unfogged: it is the light source in this picture, not
 * a surface catching light, and fog would wash out the one bright thing.
 */
function Sky() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    /* Canvas y runs down and v runs up, so the top of the image is the top
       of the sky. The crest lands at v 0.342 of this plane. */
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#0b0908");
    gradient.addColorStop(0.5, "#151009");
    gradient.addColorStop(0.58, "#3a2614");
    gradient.addColorStop(0.62, "#7a522f");
    gradient.addColorStop(0.66, "#2a1c11");
    gradient.addColorStop(0.78, "#100c08");
    gradient.addColorStop(1, "#0b0908");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 256);

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;

  return (
    <mesh position={[0, SKY_CENTRE, SKY_Z]}>
      <planeGeometry args={[260, SKY_HEIGHT]} />
      <meshBasicMaterial map={texture} fog={false} depthWrite={false} />
    </mesh>
  );
}

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
interface TerrainProps {
  /**
   * Flattens the ridges without narrowing them.
   *
   * The illustrated vista is a near-orthographic stack: three crests inside
   * the 11% of frame between the highest ridge and the sheet's top edge. A
   * perspective camera cannot reach that by framing alone — at full height
   * the furthest ridge subtends ten degrees, half the frame — and widening
   * the lens far enough to fit it distorts everything else.
   *
   * So height and width are separable. Camp wants the country it actually
   * stands in; the survey sheet wants the country as a drawing of it.
   */
  heightScale?: number;
}

export function Terrain({ heightScale = 1 }: TerrainProps = {}) {
  const shapes = useMemo(() => {
    const profiles = ridgeProfiles();

    return profiles.map((points, i) => {
      const { scale } = BANDS[i];
      const shape = new Shape();

      /* Vista space is y-down from a horizon; world space is y-up from the
         ground. Height is the drop below the horizon, inverted once, here. */
      const wx = (x: number) => (x - VISTA_WIDTH / 2) * scale;
      const wy = (y: number) => (HORIZON - y) * scale * heightScale;

      shape.moveTo(wx(points[0].x), 0);
      for (const point of points) shape.lineTo(wx(point.x), wy(point.y));
      shape.lineTo(wx(points[points.length - 1].x), 0);
      shape.closePath();

      return shape;
    });
  }, [heightScale]);

  return (
    <group>
      <Sky />

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
