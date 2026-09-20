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

/**
 * The route, in order. Index is position, and everything downstream reads it.
 *
 * Seven marks, and the count is not arbitrary — each one is a place that
 * answers Phase 12 §1's question, *why does this exist in the territory*:
 *
 *   Arrival     you are looking at the country from outside it
 *   Frontier    the survey of that country — the sheet
 *   Camp        where the work is done
 *   Records     the notebook the work is written in
 *   Board       where findings are posted for other people to read
 *   Archive     where the formal record is kept
 *   Trail End   where the survey stops and the correspondence starts
 *
 * This list was three marks for one commit, which folded the last four into
 * the notebook. That was right while the board, the archive and trail end
 * *were* leaves of the notebook — a table of contents does not belong on the
 * world route (§4, and it is still true of Gear and the Journey, which are
 * still leaves). Phase 12 takes them out of the book and gives each one
 * ground of its own, so they are places again and the marks come back with
 * them.
 */
export const checkpoints: Checkpoint[] = [
  {
    id: "arrival",
    label: "Arrival",
    route: "/",
    mark: "arrival",
    ahead: "Where the trail begins.",
  },
  {
    id: "frontier",
    label: "Frontier",
    route: "/frontier",
    mark: "compass",
    ahead: "The survey sheet: the whole territory, drawn.",
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
      Everything the field book holds is *this* checkpoint, and §16 is the
      reason: a reader who turns to TuneIt has not travelled anywhere. They
      have turned a page inside the place they were already standing in.
      Without this list the trail would grow a marker per document and the
      clutter §2 warns about would come straight back one level down.
    */
    within: ["/projects/", "/journey", "/skills", "/notes"],
    mark: "book",
    ahead: "The field book: the journey, the work, the gear, the notes.",
  },
  {
    id: "board",
    label: "Board",
    route: "/bounties",
    mark: "board",
    ahead: "The notice board: measured findings, posted.",
  },
  {
    id: "archive",
    label: "Archive",
    route: "/archive",
    mark: "box",
    ahead: "The record office: degree, training, certifications.",
  },
  {
    id: "trail-end",
    label: "Trail End",
    route: "/contact",
    mark: "end",
    ahead: "Where the trail stops and the correspondence starts.",
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
  bounties: "board",
  archive: "archive",
  "trail-end": "trail-end",
};

export function indexOfCheckpoint(id: string): number {
  return checkpoints.findIndex((point) => point.id === id);
}

/**
 * Where the walk goes from here.
 *
 * Not simply `checkpoints[current + 1]`, and the difference is the whole of
 * §19. A visitor standing at Camp who has not opened the notebook should be
 * pointed at the notebook; one who has just closed it should be pointed on
 * down the trail to the Board. Both are "the next place", and which one it is
 * depends on what they have already done rather than on where they are.
 *
 * So: the first place ahead of them that they have not been to. If they have
 * been everywhere ahead — a second lap, or a deep link near the end — it falls
 * back to the immediate neighbour, because a route that says nothing is worse
 * than a route that repeats itself.
 *
 * Reads session state, so it is only correct on the client. Callers render the
 * neighbour on the server and let the real answer arrive with hydration; see
 * TrailOnward, which does exactly that.
 */
export function nextCheckpoint(current: number): Checkpoint | null {
  if (current < 0 || current >= checkpoints.length - 1) return null;
  for (let i = current + 1; i < checkpoints.length; i += 1) {
    if (!hasVisited(checkpoints[i].id)) return checkpoints[i];
  }
  return checkpoints[current + 1];
}

/** The place before this one. The route runs both ways; the walk does not. */
export function previousCheckpoint(current: number): Checkpoint | null {
  if (current <= 0) return null;
  return checkpoints[current - 1];
}

/**
 * The chapter numeral for a checkpoint, derived rather than written down.
 *
 * §33 asks that the map, the trail, the route and the chapter card all agree
 * about where the visitor is, and a hand-maintained numeral is the one of
 * those four that drifts — it did, for two phases, while the routes were
 * renumbered around it. Arrival is not an act, so the count starts at the
 * Frontier.
 */
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function chapterNumeralFor(pathname: string): string | undefined {
  const index = indexOfRoute(pathname);
  if (index <= 0) return undefined;
  /* Only the checkpoint's own route is an act. A leaf of the notebook is
     inside Records, not a chapter of its own (§16). */
  if (checkpoints[index].route !== pathname) return undefined;
  return NUMERALS[index - 1];
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
