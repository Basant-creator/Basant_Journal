"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, type Texture } from "three";
import { props, tint } from "./palette";

/**
 * The two surfaces a notebook is made of.
 *
 * §13 puts the notebook at the top of the texture priority list, above the
 * table and everything else, and §15 says why: it has to feel convincingly
 * physical because §37 opens it. An object that reads as a box right up to
 * the moment it becomes a document breaks the one transition the phase is
 * built around.
 */

function seeded(start: number) {
  let s = start >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Leather.
 *
 * Grain first, then wear. The grain is a fine pebble — leather is not smooth
 * and it is not rough, it is covered in small irregular cells, and at this
 * size the only thing that matters is that the surface is never uniform.
 *
 * The wear is at the edges, which is where a notebook carried in a bag wears.
 * It is lighter rather than darker: leather rubs pale before it rubs through.
 */
export function useLeatherTexture(): Texture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const rand = seeded(0x9e3d71);

    ctx.fillStyle = props.leather;
    ctx.fillRect(0, 0, size, size);

    /* Broad tonal drift, so the hide is not one colour before it is grained. */
    for (let i = 0; i < 18; i += 1) {
      const r = 30 + rand() * 90;
      const g = ctx.createRadialGradient(
        rand() * size,
        rand() * size,
        0,
        rand() * size,
        rand() * size,
        r,
      );
      g.addColorStop(0, tint(rand() > 0.5 ? props.paperEdge : props.ink, 0.05 + rand() * 0.05));
      g.addColorStop(1, tint(props.ink, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    /* The pebble. Small overlapping arcs rather than dots — a cell in leather
       has an edge on one side and fades on the other, which is what stops a
       grain reading as noise. */
    for (let i = 0; i < 2600; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.8 + rand() * 2.1;
      const light = rand() > 0.5;
      ctx.strokeStyle = tint(light ? props.paperEdge : props.ink, 0.05 + rand() * 0.1);
      ctx.lineWidth = 0.7 + rand() * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, rand() * Math.PI * 2, rand() * Math.PI * 2 + 2.2);
      ctx.stroke();
    }

    /* Wear along the edges. A band rather than a line, because a rubbed edge
       has no boundary. */
    const edge = ctx.createLinearGradient(0, 0, size, 0);
    edge.addColorStop(0, tint(props.paperEdge, 0.16));
    edge.addColorStop(0.12, tint(props.paperEdge, 0));
    edge.addColorStop(0.88, tint(props.paperEdge, 0));
    edge.addColorStop(1, tint(props.paperEdge, 0.16));
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, size, size);

    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/**
 * The edge of a stack of paper.
 *
 * Fine horizontal striations, which on a box land on all four sides and read
 * as leaves. §15 asks for page thickness and a page stack, and this is the
 * cheap half of that: the expensive half is geometry, and geometry per leaf
 * at this size would be forty boxes to say what forty lines say.
 *
 * Deliberately uneven in tone and spacing. A stack of paper cut by a machine
 * still shows a gradient of shadow between the leaves, and a hand-filled
 * notebook does not have a flat edge at all.
 */
export function usePageEdgeTexture(): Texture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const w = 128;
    const h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const rand = seeded(0x2b77f1);

    ctx.fillStyle = props.paper;
    ctx.fillRect(0, 0, w, h);

    /* Roughly fifty leaves over the height. Spacing wanders, because leaves
       do not sit at a constant pitch once a book has been opened. */
    let y = 0;
    while (y < h) {
      y += 3.4 + rand() * 2.6;
      ctx.strokeStyle = tint(props.ink, 0.06 + rand() * 0.16);
      ctx.lineWidth = 0.7 + rand() * 0.9;
      ctx.beginPath();
      /* Not quite straight: a leaf edge bows. */
      const bow = (rand() - 0.5) * 1.6;
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(w / 2, y + bow, w, y + (rand() - 0.5) * 0.8);
      ctx.stroke();
    }

    /* A few leaves standing proud of the rest, caught lighter. */
    for (let i = 0; i < 7; i += 1) {
      const ly = rand() * h;
      ctx.strokeStyle = tint(props.paperEdge, 0.4);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly + (rand() - 0.5) * 1.2);
      ctx.stroke();
    }

    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}
