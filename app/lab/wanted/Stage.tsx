"use client";

import { useEffect } from "react";
import { decideQuality } from "./quality";

/**
 * The page's own housekeeping, mounted once, first inside the world, so
 * that everything after it can rely on what it sets. Renders nothing.
 *
 * Quality: the world's grade (quality.ts), stamped before any picture
 * decides whether to chalk itself in.
 *
 * Ahead: every picture still waiting to load is fetched and decoded while
 * it is a little more than a screen away, not as it reaches the edge of
 * the screen. Arriving at a chapter at speed used to mean its painting
 * being fetched, decoded and rasterised in the middle of the scroll, and
 * that, measured, was most of the frames a 120 Hz screen missed. Started
 * once the page has loaded and the browser is idle, so it never competes
 * with what the opening needs.
 *
 * Arrivals: the small things that come up once as they are reached (a
 * rule drawn across, a label, a record, a stamp) are marked `data-enter`
 * in the markup and given `data-entered` here, by one observer for the
 * whole page rather than one per component, and never taken away: reading
 * back up a few lines does not play them again. Anything already on
 * screen when this runs is marked `at-once`: it stays as it is, rather
 * than being hidden and played in. Until `data-arrivals` is on the world
 * nothing is hidden at all, so without script, or before it runs,
 * everything is there.
 */
export function Stage() {
  useEffect(() => {
    const world = document.querySelector<HTMLElement>("[data-world]");
    if (!world) return;
    world.dataset.quality = decideQuality();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-entered", "");
          io.unobserve(entry.target);
        }
      },
      { root: world, rootMargin: "0px 0px -10% 0px" },
    );
    const height = world.clientHeight;
    world.querySelectorAll<HTMLElement>("[data-enter]:not([data-entered])").forEach((el) => {
      const box = el.getBoundingClientRect();
      if (box.top < height && box.bottom > 0) el.setAttribute("data-entered", "at-once");
      else io.observe(el);
    });
    world.setAttribute("data-arrivals", "");

    const ahead = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target as HTMLImageElement;
          ahead.unobserve(img);
          img.loading = "eager";
          const ready =
            img.complete && img.naturalWidth
              ? Promise.resolve()
              : new Promise((resolve) => img.addEventListener("load", resolve, { once: true }));
          ready.then(() => img.decode()).catch(() => undefined);
        }
      },
      { root: world, rootMargin: "120% 0px" },
    );
    const watch = () => world.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => ahead.observe(img));
    let idle = 0;
    const start = () => {
      idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(watch, { timeout: 2500 }) : window.setTimeout(watch, 1200);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      io.disconnect();
      ahead.disconnect();
      window.removeEventListener("load", start);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, []);

  return null;
}
