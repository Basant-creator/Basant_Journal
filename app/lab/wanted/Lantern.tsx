"use client";

import { useEffect, useRef } from "react";
import { qualityOf } from "./quality";
import styles from "./ride.module.css";

/**
 * A lantern carried over the page: a faint warm pool of light that follows
 * the pointer, so the dark is something being looked through rather than a
 * background. Only where there is a pointer that hovers (no touch), not for
 * a reader who has asked for stillness, not on the low grade.
 *
 * One element, moved by transform at most once a frame and only while the
 * pointer moves; the light itself is drawn once.
 */
export function Lantern() {
  const light = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = light.current;
    if (!el) return;
    const allowed =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.motion !== "still" &&
      qualityOf(el) !== "low";
    if (!allowed) return;

    let x = 0;
    let y = 0;
    let frame = 0;
    const place = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!el.hasAttribute("data-on")) el.setAttribute("data-on", "");
      if (!frame) frame = requestAnimationFrame(place);
    };
    const leave = () => el.removeAttribute("data-on");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={light} className={styles.lantern} aria-hidden="true" />;
}
