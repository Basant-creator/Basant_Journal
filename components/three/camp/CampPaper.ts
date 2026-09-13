"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, type Texture } from "three";
import { props, tint } from "./palette";

/**
 * Paper stock.
 *
 * §13 puts paper high in the texture priority list and §14 asks materials to
 * say what they are made of. The mount under the photograph was a flat
 * `props.paper` — a perfectly even fill, which is the one thing card never
 * is. Card is pressed fibre: it has a tooth, the tooth catches light from one
 * side, and every sheet has a faint cloudiness left over from how it dried.
 *
 * Three layers, cheapest first:
 *
 *   cloud   broad, very low contrast, so the sheet is not one value
 *   fibre   short strokes at shallow angles, which is the tooth
 *   specks  a scattering of darker flecks, because pulp is not pure
 *
 * None of it is visible as texture at four metres. What is visible is that
 * the mount stops looking like a swatch.
 */
const PX = 256;

export function usePaperStock(): Texture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = PX;
    canvas.height = PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let seed = 0x7f31a9;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    ctx.fillStyle = props.paper;
    ctx.fillRect(0, 0, PX, PX);

    for (let i = 0; i < 16; i += 1) {
      const r = 40 + rand() * 110;
      const g = ctx.createRadialGradient(
        rand() * PX,
        rand() * PX,
        0,
        rand() * PX,
        rand() * PX,
        r,
      );
      g.addColorStop(0, tint(rand() > 0.5 ? props.paperEdge : props.parchment, 0.07));
      g.addColorStop(1, tint(props.paperEdge, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, PX, PX);
    }

    /* The tooth. Short strokes, mostly shallow, both lighter and darker —
       fibre lying in a sheet points roughly one way and not exactly. */
    for (let i = 0; i < 2200; i += 1) {
      const x = rand() * PX;
      const y = rand() * PX;
      const len = 1.5 + rand() * 4;
      const angle = (rand() - 0.5) * 1.1;
      ctx.strokeStyle = tint(rand() > 0.45 ? props.paperEdge : props.parchment, 0.05 + rand() * 0.08);
      ctx.lineWidth = 0.6 + rand() * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    for (let i = 0; i < 320; i += 1) {
      ctx.fillStyle = tint(props.ink, 0.04 + rand() * 0.07);
      ctx.fillRect(rand() * PX, rand() * PX, 1, 1);
    }

    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
