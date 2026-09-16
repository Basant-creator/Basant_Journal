"use client";

import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type ChapterMeta, chapterFor } from "@/lib/transition/chapters";
import { type TurnWeight, turnBetween } from "@/lib/book/registry";
import {
  type TransitionType,
  type TurnDirection,
  profileFor,
  transitionFor,
} from "@/lib/transition/types";
import { triggerPaperRustle } from "@/lib/audio/atmosphere";
import { TransitionContext, type TransitionPhase } from "./TransitionContext";
import { RouteCurtain } from "./RouteCurtain";
import { TransitionDebug } from "./TransitionDebug";

/** The curtain always lifts, whatever happens upstream of it. */
const GUARD = 2600;

/** How long the destination has to arrive before we stop waiting for it. */
const ARRIVAL_LIMIT = 2200;

/** A direct load or a Back gets the chapter, and gets it briefly. */
const SHORT_DWELL = 540;

const EXIT_MS = 220;

/**
 * The mark's minimum showing.
 *
 * Routes here are prefetched and arrive in about a hundred milliseconds, so
 * without a floor the loader is never seen at all and the site has no
 * transition identity — which is the thing this phase was asked for. With a
 * floor it is seen every time, briefly, and the whole move still lands inside
 * a second and a half.
 *
 * This is the one place the system deliberately spends the visitor's time.
 * Everything else here is careful not to.
 */
const MARK_MIN = 300;

/**
 * A page turn, kept under the brief's 600ms with room to spare.
 *
 * Sequential browsing should feel like reading a journal, and a reader turning
 * pages is not waiting for anything. The destination's own arrival — the
 * sheet pulling forward, the file being drawn — continues underneath after
 * the page has passed, which is a document settling rather than a delay.
 */
const TURN_OUT = 230;
const TURN_IN = 250;

/**
 * The notebook, opening.
 *
 * Paper rises to meet the reader while the route changes behind it, then
 * clears to leave the book open. Longer than a page turn and shorter than a
 * chapter, because it is neither: it is a hand reaching for an object.
 */
const OPEN_OUT = 300;
const OPEN_IN = 520;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * The route transition controller.
 *
 * One owner for route-entry choreography, which is the entire point. Before
 * this, seven routes each decided their own — three showed a nameplate over
 * their own heading, two showed a session-gated card that never played twice,
 * and two showed nothing. See docs/phase-5.1-transition-notes.md.
 *
 * Three invariants hold the whole thing together:
 *
 *   1. **The chapter is read from the rendered route, never from the intended
 *      one.** Chapter text is only ever `chapterFor(pathname)`, and it is only
 *      shown once the pathname has actually changed. It is therefore not
 *      possible to display "Chapter III · The Journal" over a rendering
 *      `/skills` — the brief's §12 failure is unrepresentable rather than
 *      merely avoided.
 *   2. **The newest navigation wins.** Every scheduled step carries the token
 *      it was scheduled under and does nothing if a newer one has started, so
 *      transitions cancel rather than stack.
 *   3. **It always returns to IDLE.** A guard timer that no cancellation path
 *      can clear runs on every transition. Nothing on this site is allowed to
 *      leave a visitor behind an overlay — a lesson this codebase learned
 *      once, from a journal cover that could be cancelled into staying shut
 *      over the page it was covering.
 *
 * It never delays navigation. Clicks are observed in the capture phase and
 * not prevented; the browser routes on its own schedule while the curtain
 * plays over the top.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [phase, setPhase] = useState<TransitionPhase>("IDLE");
  const [type, setType] = useState<TransitionType>("NONE");

  /** The route the curtain went up over. Null until something is announced. */
  const [target, setTarget] = useState<string | null>(null);
  /** Which way a page turn is going. Meaningless for every other type. */
  const [direction, setDirection] = useState<TurnDirection>("forward");
  /** How far it travels: one leaf, a few, or the far side of the book. */
  const [weight, setWeight] = useState<TurnWeight>("single");

  const token = useRef(0);
  const timers = useRef<number[]>([]);
  const previous = useRef<string | null>(null);
  const mounted = useRef(false);
  const announcedAt = useRef(0);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const at = useCallback((ms: number, run: () => void, mine: number) => {
    const id = window.setTimeout(() => {
      if (token.current !== mine) return;
      run();
    }, ms);
    timers.current.push(id);
  }, []);

  /* --- announcement: a click, seen before the route changes --------------- */

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      const next = transitionFor(window.location.pathname, url.pathname);
      const profile = profileFor(next);
      /* `cover` rather than `loader`: a move can have a presentation without
         having a mark in it, which is exactly what opening the notebook is. */
      if (!profile.cover && !profile.turn) return;

      token.current += 1;
      const mine = token.current;
      clearTimers();
      setType(next);
      setTarget(url.pathname);
      announcedAt.current = Date.now();

      if (profile.turn) {
        // A page sweeps across while the route changes underneath it. No
        // mark, no chapter: a document is not a destination.
        triggerPaperRustle();
        const turn = turnBetween(window.location.pathname, url.pathname);
        setDirection(turn.direction);
        setWeight(turn.weight);
        setPhase("EXIT");
        at(TURN_OUT + TURN_IN + 240, () => {
          setPhase("IDLE");
          setTarget(null);
        }, mine);
        return;
      }

      setPhase("EXIT");
      /* Only a move that shows the mark moves on to LOADER. The notebook
         stays in EXIT — its paper is still on its way up — until the route
         arrives and turns it into ENTER. */
      if (profile.loader) at(EXIT_MS, () => setPhase("LOADER"), mine);

      // If the destination never arrives — a cancelled navigation, a route
      // that failed — the curtain comes down rather than waiting forever.
      at(ARRIVAL_LIMIT, () => {
        setPhase("IDLE");
        setTarget(null);
      }, mine);
      at(GUARD, () => {
        setPhase("IDLE");
        setTarget(null);
      }, mine);
    };

    // Capture, so it is seen before anything calls preventDefault on the way
    // up — and before the router acts on it.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [at, clearTimers]);

  /* --- arrival: the route actually changed -------------------------------- */

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;

    const first = !mounted.current;
    mounted.current = true;

    const announced = target !== null && target === pathname;
    const kind = announced ? type : transitionFor(first ? null : from, pathname);
    const profile = profileFor(kind);
    const chapter = chapterFor(pathname);

    // A page turn: the record has arrived, so the page finishes its sweep.
    if (announced && profile.turn) {
      token.current += 1;
      const mine = token.current;
      clearTimers();
      setPhase("ENTER");
      at(TURN_IN + 60, () => {
        setPhase("IDLE");
        setTarget(null);
      }, mine);
      return;
    }

    /* The notebook has arrived: the paper clears and the book is open.
       Handled before the chapter check below, because /projects *has* a
       chapter and this move deliberately does not use it — reaching for an
       object on a table is not entering an act. */
    if (announced && kind === "CAMP_TO_JOURNAL") {
      token.current += 1;
      const mine = token.current;
      clearTimers();
      setPhase("ENTER");
      at(OPEN_IN + 80, () => {
        setPhase("IDLE");
        setTarget(null);
      }, mine);
      at(GUARD, () => {
        setPhase("IDLE");
        setTarget(null);
      }, mine);
      return;
    }

    // Nothing to announce here: the professional view, or a route with no
    // ceremony. Make sure any curtain in flight comes down.
    if (!chapter || !profile.chapter) {
      if (phase !== "IDLE") {
        token.current += 1;
        clearTimers();
        setPhase("IDLE");
        setTarget(null);
      }
      return;
    }

    token.current += 1;
    const mine = token.current;
    clearTimers();

    // Back, Forward and direct loads were never announced, so they skip the
    // loader entirely and get the shorter reveal §11 asks for.
    const dwell = announced ? profile.dwell : SHORT_DWELL;
    if (!announced) setType(kind);

    // The destination usually beats the mark here — these routes are
    // prefetched and arrive in about a hundred milliseconds. Hold in LOADER
    // until the mark has had its minimum showing, rather than cutting it off
    // mid-strike or, worse, never showing it at all.
    const elapsed = announced ? Date.now() - announcedAt.current : Infinity;
    const hold = announced ? Math.max(0, EXIT_MS + MARK_MIN - elapsed) : 0;
    if (hold > 0) setPhase("LOADER");

    at(hold, () => setPhase("CHAPTER"), mine);
    at(hold + dwell, () => setPhase("ENTER"), mine);
    at(hold + dwell + 420, () => {
      setPhase("IDLE");
      setTarget(null);
    }, mine);
    at(GUARD, () => {
      setPhase("IDLE");
      setTarget(null);
    }, mine);
    // `phase`, `target` and `type` are read, not tracked: this effect is about
    // the pathname changing, and re-running it when its own state moves would
    // restart the transition it just started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearTimers, [clearTimers]);

  const meta: ChapterMeta | null = useMemo(
    // Always the rendered route. Invariant 1.
    () => (phase === "CHAPTER" || phase === "ENTER" ? chapterFor(pathname) : null),
    [pathname, phase],
  );

  const value = useMemo(
    () => ({ phase, type, pathname, target, meta, direction, weight }),
    [phase, type, pathname, target, meta, direction, weight],
  );

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <RouteCurtain
        phase={phase}
        type={type}
        meta={meta}
        direction={direction}
        reduced={prefersReducedMotion()}
      />
      <TransitionDebug />
    </TransitionContext.Provider>
  );
}
