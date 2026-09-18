"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import {
  type Checkpoint,
  type MarkerState,
  checkpoints,
  indexOfRoute,
  isOffTrail,
  markVisited,
  markerState,
  serverSnapshot,
  subscribeTrail,
  visitedSnapshot,
} from "@/lib/world/trail";
import styles from "./FrontierTrail.module.css";

/**
 * The Frontier Trail.
 *
 * §37 is the whole specification and it is a short one: where am I, where have
 * I been, what is ahead. Anything this component does beyond those three
 * questions is a navbar in survey clothing, which is the thing §1 asks to be
 * rid of.
 *
 * So there is no drawer, no dropdown, no "jump to", and no list of everything
 * the site contains. A marker the visitor has reached is a link; a marker
 * ahead of them is a mark on a map, drawn but not offered. That distinction is
 * the entire difference between a trail and a tab bar, and it is enforced in
 * `markerState` rather than here — see the note there for why a deep link does
 * not strand anybody.
 *
 * Not rendered on the landing. Arrival is a checkpoint and it is in the model,
 * but the landing is a composition that Phase 10C spent a lot of care on and
 * a line of markers across the foot of it would be the first thing the eye
 * found. The trail is picked up on entering the territory, which is also the
 * more truthful reading: you do not consult a route while you are still
 * looking at the horizon.
 */

/* -------------------------------------------------------------------------
   THE MARKS

   Original survey symbols, drawn small. §16 asks for a distinct mark per
   checkpoint and §7 for field notation rather than iconography — so these are
   geometry at 16 units, on the same visual terms as the annotations layer:
   thin strokes, no fills except where a shape needs a body, nothing that
   would read as a UI icon set.
   ------------------------------------------------------------------------- */

function Mark({ kind }: { kind: Checkpoint["mark"] }) {
  switch (kind) {
    case "arrival":
      /* A start peg: a post with the ground line through it. */
      return (
        <>
          <path d="M8 3.5v9" />
          <path d="M4.5 12.5h7" />
        </>
      );
    case "compass":
      /* A survey rose, reduced to its two axes and a north. */
      return (
        <>
          <path d="M8 2.5v11M2.5 8h11" />
          <path d="M8 2.5l1.7 3H6.3z" />
        </>
      );
    case "camp":
      /* A tent: two poles and a ground line. */
      return (
        <>
          <path d="M8 3l4.5 9h-9z" />
          <path d="M8 3v9" />
        </>
      );
    case "book":
      /* A field book, open, seen from above. */
      return (
        <>
          <path d="M2.5 4.5h5l.5 1 .5-1h5v7h-5l-.5-1-.5 1h-5z" />
          <path d="M8 5.5v6" />
        </>
      );
    case "board":
      /* A notice board: a sheet and two pins. */
      return (
        <>
          <path d="M3.5 3.5h9v9h-9z" />
          <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" />
        </>
      );
    case "box":
      /* An archive box with its lid line. */
      return (
        <>
          <path d="M2.5 5.5h11v7h-11z" />
          <path d="M2.5 5.5l1.5-2h8l1.5 2" />
          <path d="M6.5 8.5h3" />
        </>
      );
    case "end":
      /* A terminus: the trail's last peg, struck through. */
      return (
        <>
          <path d="M8 3v10" />
          <path d="M4 5.5l8 5M12 5.5l-8 5" />
        </>
      );
  }
}

/** The stamp a checkpoint gets once it is behind you (§28). */
function Stamp() {
  return <path className={styles.stamp} d="M4.5 8.6l2.4 2.6 4.6-6" />;
}

function useVisited(): string {
  return useSyncExternalStore(subscribeTrail, visitedSnapshot, serverSnapshot);
}

export function FrontierTrail() {
  const pathname = usePathname();
  const current = indexOfRoute(pathname);
  /* Subscribed so the stamps appear as the walk happens, not on reload. */
  useVisited();

  /*
    Arriving somewhere marks it.

    In an effect rather than during render because it writes to storage and
    notifies subscribers — doing that while rendering is a side effect in the
    middle of a pure function, and React is entitled to run the render twice.
  */
  useEffect(() => {
    const index = indexOfRoute(pathname);
    if (index !== -1) markVisited(checkpoints[index].id);
  }, [pathname]);

  /* §24: the escape hatch is not a place on the route. And the landing keeps
     its own composition. */
  if (isOffTrail(pathname) || pathname === "/") return null;

  return (
    <nav className={styles.trail} aria-label="The frontier trail">
      <ol className={styles.line}>
        {checkpoints.map((point, index) => {
          const state: MarkerState = markerState(index, current);
          const near = Math.abs(index - current) <= 1;

          const glyph = (
            <span className={styles.marker} aria-hidden="true">
              <svg viewBox="0 0 16 16" className={styles.glyph}>
                <Mark kind={point.mark} />
                {state === "behind" ? <Stamp /> : null}
              </svg>
            </span>
          );

          const label = (
            <span className={styles.label} data-near={near || undefined}>
              {point.label}
            </span>
          );

          return (
            <li
              key={point.id}
              className={styles.stop}
              data-state={state}
              /* The one place the current checkpoint is named for assistive
                 tech. `aria-current="step"` says it better than a visually
                 hidden "you are here" would, and without adding a string the
                 eye has to skip. */
              aria-current={state === "here" ? "step" : undefined}
            >
              {state === "ahead" ? (
                /*
                  Ahead: drawn, not offered (§12).

                  A `<span>` rather than a disabled link, because a disabled
                  link is still announced as a link and invites a press that
                  does nothing. The description carries what the place is, so
                  a screen-reader user learns the route without being handed a
                  control that refuses them.
                */
                <span className={styles.stopMark} title={point.ahead}>
                  {glyph}
                  {label}
                  <span className={styles.sr}>{` — ahead: ${point.ahead}`}</span>
                </span>
              ) : (
                <Link href={point.route} className={styles.stopMark}>
                  {glyph}
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
