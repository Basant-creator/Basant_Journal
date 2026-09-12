"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture } from "three";
import { sky } from "./palette";
import { SKY_BAND_Y, SKY_SIZE, SKY_Z } from "./layout";

/**
 * Blue hour.
 *
 * A plane rather than a dome, because the camera's whole travel is under a
 * metre and a half wide — a dome would cost geometry to solve a parallax
 * problem the bounds already solve. It is unlit and unfogged: this is the
 * light source in the picture, not a surface catching light, and fog would
 * wash out the one bright thing in the frame.
 *
 * The gradient is generated for the same reasons the wind is synthesised and
 * the ridges are seeded — nothing to ship, nothing to license, and what
 * defines it is a dozen stops rather than a file.
 *
 * The band is placed, not eyeballed. `SKY_BAND_Y` is derived from where the
 * furthest ridge crests, because the one way to get this wrong is to put the
 * afterglow behind the mountains — which the illustrated vista did on its
 * first cut, and which its own comment now warns about.
 */
export function CampSky() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    /* Canvas y runs down and the plane's v runs up, so stop 0 is the zenith.
       The band's position in the texture is its world height mapped onto the
       plane's own extent. */
    const half = SKY_SIZE[1] / 2;
    const band = 1 - (SKY_BAND_Y + half) / SKY_SIZE[1];

    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, sky.zenith);
    g.addColorStop(Math.max(0.02, band - 0.34), sky.high);
    g.addColorStop(Math.max(0.04, band - 0.12), sky.mid);
    g.addColorStop(Math.max(0.06, band - 0.022), sky.afterglow);
    g.addColorStop(Math.min(0.97, band + 0.05), sky.haze);
    g.addColorStop(1, sky.haze);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);

    return new CanvasTexture(canvas);
  }, []);

  /* Made outside the R3F tree, so it is ours to release. */
  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, SKY_Z]} renderOrder={-1}>
      <planeGeometry args={SKY_SIZE} />
      <meshBasicMaterial map={texture} fog={false} depthWrite={false} />
    </mesh>
  );
}
