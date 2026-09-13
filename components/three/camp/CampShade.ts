"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, type Texture } from "three";

/**
 * The dark under a thing lying on a table.
 *
 * §36 asks hero objects to answer the pointer with a shadow change among
 * other things, and the scene could not do it. The fire casts real shadows
 * (§28) but its shadow map is drawn once and frozen (§04) — deliberately,
 * because a point light shadow is six faces of render and the flicker is
 * intensity rather than position. Nothing in that arrangement can follow an
 * object five centimetres into the air.
 *
 * So the lift had no shadow consequence at all, and a small object rising off
 * a surface with its shadow unchanged does not read as rising. It reads as
 * the object getting slightly bigger, which is the exact thing §36 says not
 * to do.
 *
 * A contact shadow is the answer the whole industry uses for this and it is
 * almost free: one soft ellipse on the surface, which grows and pales as the
 * object leaves it. That is also what really happens — a shadow cast by a
 * broad dim source spreads and weakens with separation — so the cheap trick
 * and the physics agree for once.
 *
 * Black to transparent rather than black to grey: this multiplies nothing and
 * blends normally over the table, so the edge has to actually reach zero or
 * it draws its own rectangle.
 */
export function useShadeTexture(): Texture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    /* Dense in the middle and gone well before the edge. A contact shadow
       that fades linearly to the corner reads as a smudge; the density has
       to sit under the object and let go quickly. */
    g.addColorStop(0, "rgba(0, 0, 0, 0.85)");
    g.addColorStop(0.42, "rgba(0, 0, 0, 0.42)");
    g.addColorStop(0.78, "rgba(0, 0, 0, 0.08)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
