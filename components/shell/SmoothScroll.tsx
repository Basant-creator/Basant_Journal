"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isOffTrail } from "@/lib/world/trail";

/**
 * Walking pace, as a damping factor.
 *
 * Lenis eases the page toward where the wheel has sent it through
 * `1 - exp(-λ·dt)` with λ = PACE × 60, so the pace is the same at 60 Hz and
 * at 120. What the number decides is how long the page trails the hand.
 *
 * It was 0.085, under Lenis's own 0.1, on the idea that heavier reads as
 * more cinematic. It read as lag: 90% of a wheel notch arrived after 0.45s
 * and the page was still settling at 0.9s, so every stop landed late and a
 * trackpad — which brings its own momentum — floated on top of it. "Smooth
 * and laggy at the same time" was the report, and it was exactly this.
 *
 * At 0.13 the same notch is 90% of the way in 0.30s and at rest by 0.6s:
 * still a glide, but one that follows the wheel rather than chasing it.
 */
const PACE = 0.13;

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function prefersReduced(): boolean {
  return window.matchMedia(REDUCED).matches;
}

/**
 * How the visitor moves through a checkpoint.
 *
 * One owner for scroll, the way TransitionProvider is the one owner for
 * arrival: everything a wheel or a trackpad does to the page goes through the
 * Lenis instance made here, and nothing else on the site makes one.
 *
 * What it gives the trail is weight. Native wheel scrolling moves a page in
 * detents — a notch, a jump, a notch — which is right for a document and
 * wrong for a place; here the ground is carried under the reader and comes to
 * rest, and the scroll-driven depth in each place (see Place.module.css) runs
 * on that smoothed position, so the country glides with it instead of
 * stepping. It stays native, and so stays exactly what the visitor's device
 * does, in four cases:
 *
 *   - touch, always: Lenis leaves touch alone unless asked, and a phone's own
 *     momentum is better than anything that could replace it;
 *   - reduced motion: no instance at all, rather than a smoothed scroll at a
 *     lerp of 1 — the setting is honoured at the source (CLAUDE.md);
 *   - off the trail: the professional view is the facts without the walk, and
 *     a recruiter's scroll wheel should behave like everybody else's;
 *   - keyboard: Lenis only ever sees wheels, so Space, Page Down and the
 *     arrows scroll the way the browser scrolls them.
 *
 * Two things it has to be told, both about leaving. A glide still carrying
 * the page when the visitor steps to the next checkpoint would go on carrying
 * the next page as it arrived, so a click on any link to another route stops
 * it dead (`stopInertiaOnNavigate`). And Back and Forward never click
 * anything, so they stop it by hand — on popstate, before the router restores
 * the position the history entry remembers.
 *
 * It renders nothing. The route never waits for it: stopping a glide is
 * synchronous, and nothing here delays or gates a navigation.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const offTrail = isOffTrail(pathname);
  /* True on the server, so nothing is decided until the client says so. */
  const reduced = useSyncExternalStore(subscribeReduced, prefersReduced, () => true);

  useEffect(() => {
    if (offTrail || reduced) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: PACE,
      stopInertiaOnNavigate: true,
    });

    /* Back and Forward. An immediate scroll to where the page already is
       ends any glide in progress without moving anything, and the router's
       restoration then lands on a page that is standing still. */
    const onPop = () => {
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      lenis.destroy();
    };
  }, [offTrail, reduced]);

  return null;
}
