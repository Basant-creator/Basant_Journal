/**
 * The Frontier Trail: the world's own route, and where the visitor is on it.
 *
 * §1 replaces a tab bar with a territory. The difference in the code is
 * smaller than it sounds and the difference in behaviour is not: a navbar
 * answers "what else is there", and this answers §37's three questions and
 * nothing else — where am I, where have I been, what is ahead.
 *
 * Two navigation scales exist and they are kept apart (§5). This file is the
 * **world** scale: seven checkpoints, in order, each a place. The **document**
 * scale lives in the field book and is the book's own business — pages,
 * bookmarks, the index. Nothing here knows what a project record is, and the
 * book knows nothing about checkpoints.
 */

export type MarkKind =
  | "arrival"
  | "compass"
  | "camp"
  | "book"
  | "board"
  | "box"
  | "end";

export interface Checkpoint {
  id: string;
  /** What the trail calls it. Short: these sit under a 1px line. */
  label: string;
  route: string;
  /**
   * Other routes that mean "still here".
   *
   * §4 is the rule this enforces. A project record is not a checkpoint, and
   * neither is the journey or the gear list — they are pages *inside* the
   * Records checkpoint, and turning to one must not make the trail look like
   * the visitor has arrived somewhere new. Without this the trail would grow
   * a marker per document and the problem §1 describes would come straight
   * back.
   */
  within?: string[];
  mark: MarkKind;
  /** One line, for the accessible description of a place not yet reached. */
  ahead: string;
}

export const checkpoints: Checkpoint[] = [
  {
    id: "arrival",
    label: "Arrival",
    route: "/",
    mark: "arrival",
    ahead: "Where the trail begins.",
  },
  {
    id: "camp",
    label: "Camp",
    route: "/about",
    mark: "camp",
    ahead: "The fire, the table, and the field book lying on it.",
  },
  {
    id: "records",
    label: "Records",
    route: "/projects",
    /*
      Everything the field book holds is *this* checkpoint.

      The trail had seven marks and four of them were pages of one object: the
      survey sheet, the board, the archive and trail end are all leaves of the
      notebook, and giving each its own world marker put the book's table of
      contents along the bottom of every screen. That is the clutter, and it is
      the same mistake §4 warns about one level up.

      Three marks now: you arrived, you are at the camp, and the records are
      what the camp is for. Inside the book, the book navigates.
    */
    within: ["/projects/", "/journey", "/skills", "/frontier", "/bounties", "/archive", "/contact"],
    mark: "book",
    ahead: "The field book: the survey, the work, the results, the record.",
  },
];

/**
 * Routes that are deliberately *not* on the trail.
 *
 * §24: the professional view is an escape hatch for somebody who wants the
 * facts without the walk, and making it a checkpoint would put the shortcut
 * inside the journey it exists to skip. It is reachable from the landing and
 * from the archive, and the trail never mentions it.
 */
export const OFF_TRAIL = ["/professional", "/lab"];

export function isOffTrail(pathname: string): boolean {
  return OFF_TRAIL.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Which checkpoint a path belongs to, or -1. */
export function indexOfRoute(pathname: string): number {
  if (isOffTrail(pathname)) return -1;

  /* Exact first: /projects must not match before /projects/tuneit has had a
     chance to, and `within` prefixes must not swallow a later checkpoint. */
  const exact = checkpoints.findIndex((point) => point.route === pathname);
  if (exact !== -1) return exact;

  return checkpoints.findIndex((point) =>
    point.within?.some((prefix) => pathname.startsWith(prefix)),
  );
}

export function checkpointFor(pathname: string): Checkpoint | undefined {
  const index = indexOfRoute(pathname);
  return index === -1 ? undefined : checkpoints[index];
}

/* -------------------------------------------------------------------------
   WHERE THE VISITOR HAS BEEN

   §29: for the session, and no longer. A trail that remembered last month
   would be a profile, and the thing being modelled is a walk rather than an
   account.
   ------------------------------------------------------------------------- */

export const TRAIL_KEY = "frontier:trail";

const listeners = new Set<() => void>();
let seen: Set<string> | null = null;

function load(): Set<string> {
  if (seen) return seen;
  seen = new Set<string>();
  if (typeof window === "undefined") return seen;
  try {
    const raw = window.sessionStorage.getItem(TRAIL_KEY);
    if (raw) for (const id of JSON.parse(raw) as string[]) seen.add(id);
  } catch {
    /* Storage refused. The walk still works; it simply forgets. */
  }
  return seen;
}

/** A stable string, because `useSyncExternalStore` compares snapshots by identity. */
let snapshot = "";

function publish(): void {
  const ids = [...load()].sort();
  snapshot = ids.join(",");
  for (const listener of listeners) listener();
}

export function visitedSnapshot(): string {
  if (snapshot === "" && load().size > 0) snapshot = [...load()].sort().join(",");
  return snapshot;
}

export function serverSnapshot(): string {
  return "";
}

export function hasVisited(id: string): boolean {
  return load().has(id);
}

export function markVisited(id: string): void {
  const set = load();
  if (set.has(id)) return;
  set.add(id);
  try {
    window.sessionStorage.setItem(TRAIL_KEY, JSON.stringify([...set]));
  } catch {
    /* As above. */
  }
  publish();
}

export function subscribeTrail(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* -------------------------------------------------------------------------
   WHAT THE VISITOR MAY DO WITH A MARKER
   ------------------------------------------------------------------------- */

/**
 * Which checkpoint each location on the survey map stands for.
 *
 * The map's locations and the world's checkpoints are two lists that have to
 * agree, and they are not the same list. Most of what the sheet draws — Gear,
 * the board, the archive, trail end — lives *inside* the Records checkpoint
 * rather than beside it, because all of it is pages of one notebook. Anything
 * absent from this table is drawn on the sheet and is not a stop on the world
 * route, which is what a spur is.
 */
export const LOCATION_CHECKPOINT: Record<string, string> = {
  camp: "camp",
  journal: "records",
};

export function indexOfCheckpoint(id: string): number {
  return checkpoints.findIndex((point) => point.id === id);
}

export type MarkerState = "behind" | "here" | "ahead";

/**
 * How a marker should behave, given where the visitor is.
 *
 * §12 asks that the trail not be a teleporter to places nobody has been, and
 * §35 insists the route must never be the only way to reach content. Both are
 * satisfied by one rule: **anything at or behind the current position is a
 * link, and anything ahead is a mark.**
 *
 * The "or behind" half matters more than it looks. Position is taken from the
 * route, not only from the session's history, so a visitor who follows a deep
 * link straight to the archive (§31) finds the whole trail behind them open
 * rather than six dead markers and no way back. They arrived by another road;
 * the territory between here and the start is still established ground.
 */
export function markerState(index: number, current: number): MarkerState {
  if (current === -1) {
    /* Off-trail — the professional view. Nothing is "here", and only places
       actually walked are offered. */
    return hasVisited(checkpoints[index].id) ? "behind" : "ahead";
  }
  if (index === current) return "here";
  if (index < current) return "behind";
  return hasVisited(checkpoints[index].id) ? "behind" : "ahead";
}
