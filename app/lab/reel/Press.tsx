"use client";

import { useEffect } from "react";
import { probeGpu } from "@/lib/three/quality";

/**
 * The reel's housekeeping, mounted once per page. Renders nothing.
 *
 * Arrivals: anything marked `data-enter` is given `data-entered` the first
 * time it is reached, by one observer for the whole page, and keeps it:
 * reading back up does not play it again. Whatever is already on screen
 * when this runs is marked `at-once` and simply shown, and anything focused
 * by keyboard arrives that instant, so focus never lands on something not
 * yet there. Nothing is hidden until `data-arrivals` is on the reel, so
 * without script everything is there.
 *
 * Loops: the film's flicker, weave and scratches, and the wire's ticker,
 * run only while they are on screen (`data-loops` regions get
 * `data-paused` when they are not).
 *
 * The projector: its countdown plays once a visit (an inline script marks
 * a return before first paint); any click, key, wheel or touch ends it at
 * once, and everything waiting on it starts.
 *
 * Stillness: the reel makes its own judgement (`html[data-reel-still]`)
 * rather than taking the site's (`html[data-motion="still"]`). The site
 * goes still for the rest of a visit if any 3D scene struggled, which is
 * right for scenes and wrong here: every effect on the reel is a transform
 * or an opacity the compositor carries, and a struggling WebGL scene, or
 * one measured while its tab was hidden, says nothing about that. What does
 * is a browser compositing in software, with no GPU at all; that, and a
 * reader's own reduced-motion preference (handled in the CSS), are what
 * make the reel still.
 */
export function Press() {
  useEffect(() => {
    const reel = document.querySelector<HTMLElement>("[data-reel]");
    if (!reel) return;
    const html = document.documentElement;
    if (probeGpu()?.software) html.dataset.reelStill = "1";

    const arrivals = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-entered", "");
          arrivals.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const h = window.innerHeight;
    reel.querySelectorAll<HTMLElement>("[data-enter]:not([data-entered])").forEach((el) => {
      const box = el.getBoundingClientRect();
      /* On screen before the intro has ended is still worth playing: the
         masthead and the still are timed to it. Only what a reader has
         already scrolled to (a return, a deep link) is shown as is. */
      if (box.top < h && box.bottom > 0 && window.scrollY > 0) el.setAttribute("data-entered", "at-once");
      else arrivals.observe(el);
    });
    reel.setAttribute("data-arrivals", "");
    const focused = (event: FocusEvent) => {
      const el = (event.target as Element | null)?.closest?.("[data-enter]:not([data-entered])");
      if (!el) return;
      el.setAttribute("data-entered", "at-once");
      arrivals.unobserve(el);
    };
    reel.addEventListener("focusin", focused);

    const loops = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute("data-paused", !entry.isIntersecting);
    });
    reel.querySelectorAll("[data-loops]").forEach((el) => loops.observe(el));

    const skip = () => {
      html.dataset.reelSkip = "1";
      off();
    };
    const off = () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
    if (reel.querySelector("[data-projector]") && !html.dataset.reelSeen) {
      window.addEventListener("pointerdown", skip, { once: true });
      window.addEventListener("keydown", skip, { once: true });
      window.addEventListener("wheel", skip, { once: true, passive: true });
      window.addEventListener("touchstart", skip, { once: true, passive: true });
    }

    return () => {
      arrivals.disconnect();
      loops.disconnect();
      reel.removeEventListener("focusin", focused);
      off();
    };
  }, []);

  return null;
}
