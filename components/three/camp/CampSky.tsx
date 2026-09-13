"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, LinearFilter } from "three";
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
 *
 * ---
 *
 * Two things changed when the quality target moved, and both are about the
 * same failure: a dark gradient is the hardest thing in a scene to draw.
 *
 * **Banding.** From zenith to the next stop the red channel crosses several
 * 8-bit levels over a stretch that fills most of the frame, so a level change
 * was landing roughly every five screen pixels in the flattest, largest,
 * most-looked-at area of the picture.
 *
 * Raising the texture resolution does not fix that, and it is worth writing
 * down because it is the obvious move: the bands are quantisation of the
 * colour, not of the sampling. A 4096-tall ramp stores the same eight-bit
 * values and the GPU was already interpolating between them. Measured both
 * ways, the spacing is identical.
 *
 * What fixes it is dithering — an ordered pattern in screen space, applied
 * after tone mapping, costing one instruction and no memory. The ramp is
 * taller anyway, because it buys precision in where the stops land, but the
 * dither is the part that does the work.
 *
 * **A sky is not a vertical gradient.** The sun set somewhere, and where it
 * set is brighter. The key light comes from x -14, so the afterglow now has
 * a broad, very soft falloff away from the left of centre rather than an even
 * band all the way across. It costs a texture that is 256 wide instead of 4,
 * and it ties the sky to the direction the land is lit from, which is most of
 * what separates an art-directed frame from a correct one.
 */
const SKY_W = 256;
const SKY_H = 1024;

export function CampSky() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = SKY_W;
    canvas.height = SKY_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    /* Canvas y runs down and the plane's v runs up, so stop 0 is the zenith.
       The band's position in the texture is its world height mapped onto the
       plane's own extent. */
    const half = SKY_SIZE[1] / 2;
    const band = 1 - (SKY_BAND_Y + half) / SKY_SIZE[1];

    const g = ctx.createLinearGradient(0, 0, 0, SKY_H);
    g.addColorStop(0, sky.zenith);
    /* Two extra stops through the darkest stretch. The eye finds a kink in a
       dark gradient far more readily than it finds one in a bright gradient,
       and the old ramp had its longest straight run exactly there. */
    g.addColorStop(Math.max(0.01, band - 0.5), sky.zenith);
    g.addColorStop(Math.max(0.02, band - 0.34), sky.high);
    g.addColorStop(Math.max(0.03, band - 0.22), sky.high);
    g.addColorStop(Math.max(0.04, band - 0.12), sky.mid);
    g.addColorStop(Math.max(0.06, band - 0.022), sky.afterglow);
    g.addColorStop(Math.min(0.97, band + 0.05), sky.haze);
    g.addColorStop(1, sky.haze);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SKY_W, SKY_H);

    /*
      Where the sun went down. Left of centre, because that is where the key
      light is standing.

      Made by taking light away from the far side rather than adding it to the
      near side. The additive version of this read correctly and was wrong: it
      lifted the band's centre from #6a5138 to #76604c, which is a brighter,
      warmer sky everywhere the lobe reached — and §5 hangs the art direction
      on warmth belonging to the fire. A multiply can only darken, so the
      brightest point keeps the value it was tuned to.

      Horizontal, and only horizontal. The first version of this was radial,
      which is the shape a glow actually has and the wrong shape for a
      multiply over a texture four times taller than it is wide: every texel
      more than a couple of hundred pixels from the sun fell to the far stop,
      so the zenith went from #0c1018 to #090c13 and the whole sky lost a
      quarter of its light. A gradient in x alone cannot do that — it darkens
      the right of the frame relative to the left and leaves every vertical
      relationship exactly where the stops above put it.
    */
    const falloff = ctx.createLinearGradient(0, 0, SKY_W, 0);
    falloff.addColorStop(0, sky.falloffNear);
    falloff.addColorStop(0.32, "rgb(255, 255, 255)");
    falloff.addColorStop(1, sky.falloffFar);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = falloff;
    ctx.fillRect(0, 0, SKY_W, SKY_H);
    ctx.globalCompositeOperation = "source-over";

    const map = new CanvasTexture(canvas);
    /* No mipmaps and linear filtering: this is stretched across the frame and
       never minified, so a mip chain is memory spent on levels nothing will
       ever sample. */
    map.generateMipmaps = false;
    map.minFilter = LinearFilter;
    map.magFilter = LinearFilter;
    return map;
  }, []);

  /* Made outside the R3F tree, so it is ours to release. */
  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, SKY_Z]} renderOrder={-1}>
      <planeGeometry args={SKY_SIZE} />
      <meshBasicMaterial map={texture} fog={false} depthWrite={false} dithering />
    </mesh>
  );
}
