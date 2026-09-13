"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, type Texture } from "three";
import { fire } from "./palette";

/**
 * What is moving inside the flame.
 *
 * §7 wants the campfire to look substantially better than everything around
 * it, and is specific about the failure to avoid: it must not read as a
 * spinning orange shape. The cones were exactly that — correct silhouettes
 * with nothing happening inside them, so the only motion was the whole shape
 * scaling, which is how a balloon moves rather than how fire moves.
 *
 * The fix is the oldest one in real-time fire and still the right one: keep
 * the layered shapes and scroll a texture up through them. The silhouette
 * comes from the geometry, the life comes from the texture, and because the
 * blending is additive the dark parts of the texture contribute nothing —
 * so the same map that brightens the core leaves the edges alone.
 *
 * **Tileable in v, and that is the whole trick.** Every wave is an integer
 * number of cycles over the height, so the top edge and the bottom edge are
 * the same values and a texture scrolled forever never shows a seam. Get the
 * frequency wrong by a fraction and a hard line rides up the flame once per
 * loop, which reads as a bug long before anyone works out what it is.
 *
 * Horizontal variation is deliberately coarse. Flame is a sheet of moving
 * brightness, not a field of speckle; fine noise here reads as static.
 */
const W = 64;
const H = 256;

function hex(value: string): [number, number, number] {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function useFlameTexture(): Texture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const frame = ctx.createImageData(W, H);
    const px = frame.data;

    const ember = hex(fire.ember);
    const body = hex(fire.body);
    const core = hex(fire.core);

    /*
      Integer cycles in v only. See the note above about seams.

      The horizontal term is a sine of u rather than u itself, and that is not
      a detail. A phase that runs linearly with u gives every wave the same
      constant slope, and the sum of several of those is a barber pole — which
      is exactly what the first version produced: regular diagonal stripes,
      tiling perfectly, looking nothing whatever like fire. Modulating the
      phase instead bends the bands, so they gather and part the way flame
      does, and it stays periodic around u, which a cone needs.
    */
    const waves = [
      { f: 1, a: 0.5, p: 0.0, q: 1.7, k: 1, s: 0.0 },
      { f: 2, a: 0.3, p: 1.9, q: 1.2, k: 2, s: 2.1 },
      { f: 3, a: 0.22, p: 3.4, q: 0.9, k: 3, s: 0.6 },
      { f: 5, a: 0.13, p: 0.7, q: 0.6, k: 2, s: 4.3 },
    ];

    /*
      Two passes, because this map multiplies a colour rather than replacing
      it.

      A three.js material with both `map` and `color` renders the product of
      the two. The first version of this scaled every texel by its own
      brightness, which gave a mean of 0.347 — so switching it on would have
      dimmed the entire fire by two thirds while looking, in isolation, like a
      perfectly good flame texture. Measured before it shipped rather than
      wondered about afterwards.

      So the field is normalised against its own mean. The average texel now
      multiplies by one, the dim parts still fall away to nothing under
      additive blending, and the bright parts clip at white — which is what a
      flame core does anyway.
    */
    const field = new Float32Array(W * H);
    let total = 0;

    for (let y = 0; y < H; y += 1) {
      const v = y / H;
      for (let x = 0; x < W; x += 1) {
        const u = x / W;
        let n = 0;
        for (const w of waves) {
          n += w.a * Math.sin(2 * Math.PI * w.f * v + w.p + w.q * Math.sin(u * 2 * Math.PI * w.k + w.s));
        }
        /* -1..1 into 0..1, then squared so the bright parts are rarer and
           brighter — fire is mostly dark with occasional core. */
        const t = Math.pow(Math.min(1, Math.max(0, n * 0.5 + 0.5)), 1.7);
        field[y * W + x] = t;
        total += t;
      }
    }

    const mean = total / field.length || 1;

    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const t = field[y * W + x];
        const m = t / mean;

        /* Ember to body to core, so the texture carries the fire's own three
           colours rather than a brightness ramp on one of them. */
        const [r, g, b] =
          t < 0.55
            ? ember.map((c, i) => c + (body[i] - c) * (t / 0.55))
            : body.map((c, i) => c + (core[i] - c) * ((t - 0.55) / 0.45));

        const i = (y * W + x) * 4;
        px[i] = Math.min(255, r * m);
        px[i + 1] = Math.min(255, g * m);
        px[i + 2] = Math.min(255, b * m);
        px[i + 3] = 255;
      }
    }

    ctx.putImageData(frame, 0, 0);

    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/**
 * The bed of coals under the logs.
 *
 * §7 asks for ground illumination, and the point light gives that — but a
 * light with nothing visible at its origin is a fire with no heat in it. What
 * is missing at the base of the flames is the part that is not flame: the
 * hot, dull, barely-moving glow that a fire sits on and that outlives it.
 *
 * A radial ramp, brightest at the middle, black at the edge. Black rather
 * than transparent because this is additive too, and additive black is
 * already invisible — which saves the material a blend mode it does not need.
 */
export function useEmberBedTexture(): Texture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, fire.glow);
    g.addColorStop(0.35, fire.ember);
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
