import { projects } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import { isMajorRoute } from "./chapters";

/**
 * What kind of move this is.
 *
 * Not every route change is the same event, and pretending otherwise is how a
 * site ends up putting a cinematic loading screen between a reader and the
 * next page of the thing they are already reading.
 */
export type TransitionType =
  | "LANDING_TO_WORLD"
  | "WORLD_TO_SCENE"
  | "WORLD_TO_PAPER"
  | "PAPER_TO_RECORD"
  /** Camp to the journal: the notebook is picked up and opened. */
  | "CAMP_TO_JOURNAL"
  | "RECORD_TO_RECORD"
  | "ANY_TO_PROFESSIONAL"
  /** Not a transition: same page, a fragment, or somewhere with no ceremony. */
  | "NONE";

export interface TransitionProfile {
  /**
   * Something covers the view while the destination is on its way.
   *
   * Separate from `loader` because they answer different questions. `cover`
   * decides whether this move is announced at all — whether a click is worth
   * intercepting and a presentation worth playing. `loader` decides whether
   * that presentation includes the Frontier mark. Opening the notebook is the
   * case that forced them apart: it covers the view with paper and shows no
   * mark at all, and before this it had to claim a loader it did not want in
   * order to be noticed.
   */
  cover: boolean;
  /** Show the Frontier mark while the destination is on its way. */
  loader: boolean;
  /** Show the destination's chapter once it has arrived. */
  chapter: boolean;
  /** How long the chapter holds, in milliseconds. */
  dwell: number;
  /**
   * Sweep a page across instead. Documents turn; worlds do not.
   *
   * A record is a page of the journal, and moving between two of them should
   * read as turning one — not as leaving a place and arriving somewhere else,
   * which is what the chapter curtain is for.
   */
  turn: boolean;
}

/**
 * The profiles.
 *
 * Deliberately small numbers. The loader exists to give the site a
 * recognisable transition identity, not to make the visitor wait — the brief
 * is explicit, and it is right: the loader appears exactly when someone is
 * already waiting, so it must not be the reason they are.
 */
const PROFILES: Record<TransitionType, TransitionProfile> = {
  LANDING_TO_WORLD: { cover: true, loader: true, chapter: true, dwell: 780, turn: false },
  WORLD_TO_SCENE: { cover: true, loader: true, chapter: true, dwell: 620, turn: false },
  WORLD_TO_PAPER: { cover: true, loader: true, chapter: true, dwell: 620, turn: false },
  /* Opening a document inside the journal is not leaving the journal. The
     record pulls forward under its own steam; nothing covers the view. */
  PAPER_TO_RECORD: { cover: false, loader: false, chapter: false, dwell: 0, turn: false },
  /*
     The notebook, picked up.

     No loader and no chapter: this is the one move in the world that is not
     a journey between places but a reach for an object on a table, and a
     mark struck over a dark veil would say exactly the wrong thing about it.
     What plays instead is paper coming up to meet the reader — see
     RouteCurtain. The dwell is the paper's, not a hold on the route.
  */
  CAMP_TO_JOURNAL: { cover: true, loader: false, chapter: false, dwell: 0, turn: false },
  /* One record to the next is a page being turned. */
  RECORD_TO_RECORD: { cover: false, loader: false, chapter: false, dwell: 0, turn: true },
  /* The recruiter path stays quick: a fade, no ceremony, no chapter. */
  ANY_TO_PROFESSIONAL: { cover: false, loader: false, chapter: false, dwell: 0, turn: false },
  NONE: { cover: false, loader: false, chapter: false, dwell: 0, turn: false },
};

const isRecord = (pathname: string) => pathname.startsWith(`${routes.projects}/`);

/**
 * Classify a move.
 *
 * `from` is null on a direct load or a refresh — there is no previous route,
 * which is itself information: §11 asks for a shorter treatment there, and the
 * controller gets it by knowing the origin is unknown rather than by guessing.
 */
export function transitionFor(from: string | null, to: string): TransitionType {
  if (from === to) return "NONE";
  if (to === routes.professional) return "ANY_TO_PROFESSIONAL";

  /* Camp → the journal is the notebook being opened, and only from Camp:
     arriving at the journal from the map or the navigation is still entering
     a place, and still gets the chapter that says so. */
  if (from === routes.about && to === routes.projects) return "CAMP_TO_JOURNAL";

  if (isRecord(to)) {
    // Journal → record, and record → record. Neither is a new chapter.
    if (from && (isRecord(from) || from === routes.projects)) {
      return isRecord(from) ? "RECORD_TO_RECORD" : "PAPER_TO_RECORD";
    }
    // Arriving at a record from anywhere else — a direct link, the map — is
    // still opening a document rather than entering an act.
    return "PAPER_TO_RECORD";
  }

  if (!isMajorRoute(to)) return "NONE";
  if (from === routes.home) return "LANDING_TO_WORLD";
  if (to === routes.projects) return "WORLD_TO_PAPER";
  return "WORLD_TO_SCENE";
}

export function profileFor(type: TransitionType): TransitionProfile {
  return PROFILES[type];
}

export type TurnDirection = "forward" | "back";

/**
 * Which way the page turns.
 *
 * From the journal's own order, not from which link was clicked: TuneIt to
 * OnSight turns forward whether the reader used the Next control, the index,
 * or typed the URL. A transition that depends on the control used is a
 * transition that disagrees with itself.
 */
export function turnDirection(from: string, to: string): TurnDirection {
  const index = (pathname: string) =>
    projects.findIndex((project) => project.route === pathname);

  const a = index(from);
  const b = index(to);
  if (a < 0 || b < 0) return "forward";
  return b >= a ? "forward" : "back";
}
