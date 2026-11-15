"use client";

import { useEffect, type RefObject } from "react";

/**
 * Pointer depth for a scene: --px and --py (each -0.5 to 0.5, the
 * pointer's place across `ref`), eased toward the pointer with frame-rate
 * independent damping, and only while there is distance left to cover.
 * Nothing at all on touch, or for a reader who has asked for stillness.
 *
 * They are written onto the layers that move with them (marked
 * `data-depth`), each of which moves by its own amount, and they are
 * registered as not inherited (see the scenes' CSS). Written onto the
 * scene and inherited, as they were, every write restyled every element
 * in it — measured, most of what scrolling past a scene cost on a slow
 * machine just after the pointer had moved. And only when the value
 * changes at three places: a thousandth of the way across is a fraction of
 * a pixel at any layer's depth, so the long tail of an ease writes nothing.
 */
export function useDepth(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const layers = [...el.querySelectorAll<HTMLElement>("[data-depth]")];
    if (!layers.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still") return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let last = 0;
    let wx = "";
    let wy = "";
    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-4 * dt);
      x += (tx - x) * k;
      y += (ty - y) * k;
      const nx = x.toFixed(3);
      const ny = y.toFixed(3);
      if (nx !== wx) for (const layer of layers) layer.style.setProperty("--px", nx);
      if (ny !== wy) for (const layer of layers) layer.style.setProperty("--py", ny);
      wx = nx;
      wy = ny;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.002) frame = requestAnimationFrame(step);
      else {
        frame = 0;
        last = 0;
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = el.getBoundingClientRect();
      if (event.clientY < box.top || event.clientY > box.bottom) return;
      tx = Math.max(-0.5, Math.min(0.5, (event.clientX - box.left) / box.width - 0.5));
      ty = Math.max(-0.5, Math.min(0.5, (event.clientY - box.top) / box.height - 0.5));
      if (!frame) frame = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
