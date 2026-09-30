"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isOffTrail } from "@/lib/world/trail";

/**
 * Walking pace, as a damping factor.
 *
 * Lenis eases the page toward where the wheel has sent it by this fraction of
 * the remaining distance per 60th of a second — and it does it through
 * `1 - exp(-λ·dt)`, so the pace is the same at 60 Hz and at 120. The default
 * is 0.1, which feels like a website. A little under it has weight without
 * lag: the page is carried, not dragged.
 */
const PACE = 0.085;

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
