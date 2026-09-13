"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping } from "three";
import { camp, tint } from "./palette";

/**
 * Sawn timber, drawn.
 *
 * §13 puts the wooden table second in the texture priority list, behind only
 * the notebook, and it earns that: it is the largest well-lit surface in the
 * frame and the one the eye lands on after the fire. It was a single flat
 * colour, which at this size does not read as wood at all — it reads as a
 * brown rectangle that four legs happen to hold up.
 *
 * Four things in order, because that is the order they exist in a real board:
 *
 *   plank bands   a table is boards, and boards are not all the same tone
 *   seams         the dark line where two boards meet, which is the single
 *                 strongest cue that this is made rather than moulded
 *   grain         long, wavy, low-contrast, running down the board
 *   knots         two of them, because a camp table is not furniture-grade
 *
 * Grain runs along the texture's u, and the top face of the slab maps u to
 * the table's long axis — so the grain runs down the boards rather than
 * across them, which is the difference between timber and packaging.
 *
 * Seeded off a fixed sequence rather than Math.random, so the same table is
 * drawn every time.
 */
const PX = 512;
const PLANKS = 5;

/* Takes two numbers rather than a tuple on purpose. A [1, 1] literal at the
   call site is a new array on every render, which would make the memo miss
   every time and regenerate a 512-square canvas per render — the texture
   would be correct and the cost would be silent and enormous. */
export function useTimberTexture(rx = 1, ry = 1) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = PX;
    canvas.height = PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let seed = 0x51a7c3;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    ctx.fillStyle = camp.timber;
    ctx.fillRect(0, 0, PX, PX);

    const band = PX / PLANKS;

    for (let p = 0; p < PLANKS; p += 1) {
      const top = p * band;

      /* Each board a little lighter or darker than its neighbours. Boards cut
         from one tree still differ; boards from a camp woodpile differ more. */
      ctx.fillStyle = tint(rand() > 0.5 ? camp.canvas : camp.timberDark, 0.05 + rand() * 0.07);
      ctx.fillRect(0, top, PX, band);

      /* The grain. Long and wavy and barely there — grain you can see clearly
         from four metres is a wood-effect laminate. */
      const lines = 14 + Math.floor(rand() * 10);
      for (let i = 0; i < lines; i += 1) {
        const y = top + rand() * band;
        const amp = 1.5 + rand() * 4;
        const phase = rand() * Math.PI * 2;
        ctx.strokeStyle = tint(
          rand() > 0.45 ? camp.timberDark : camp.canvas,
          0.05 + rand() * 0.09,
        );
        ctx.lineWidth = 0.6 + rand() * 1.5;
        ctx.beginPath();
        for (let x = 0; x <= PX; x += 8) {
          const yy = y + Math.sin(x / 90 + phase) * amp;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }

      /* The seam. Drawn last within the band so no grain line crosses it —
         grain that runs over a joint is the tell that this is one surface
         pretending to be several. */
      if (p > 0) {
        ctx.strokeStyle = tint(camp.timberDark, 0.55);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(PX, top);
        ctx.stroke();
      }
    }

    /* Knots. Two, placed off any seam, each a dark centre with one ring —
       which is all a knot needs to be at this size. */
    for (const knot of [
      { x: 0.22, y: 0.34, r: 7 },
      { x: 0.71, y: 0.68, r: 5.5 },
    ]) {
      const kx = knot.x * PX;
      const ky = knot.y * PX;
      ctx.fillStyle = tint(camp.timberDark, 0.5);
      ctx.beginPath();
      ctx.ellipse(kx, ky, knot.r * 1.6, knot.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tint(camp.timberDark, 0.22);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(kx, ky, knot.r * 2.9, knot.r * 1.9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.repeat.set(rx, ry);
    return map;
  }, [rx, ry]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
