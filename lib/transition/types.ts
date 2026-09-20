import { routes } from "@/lib/routes";
import { isInBook, isRearLeaf } from "@/lib/book/registry";
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
  /**
   * The landing to the survey sheet: §4's one move, and the site's thesis.
   *
   * The visitor stops *looking at* the territory and starts *examining the
   * survey of* it. Nothing goes dark: the landscape stays where it is, a
   * survey line is drawn across it, the ground recedes behind paper, and the
   * sheet is what is left. It is the only transition on the site that changes
   * what kind of thing the visitor is looking at, which is why it is its own
   * type rather than a louder LANDING_TO_WORLD.
   */
  | "LANDING_TO_FRONTIER"
  /** The sheet to the place drawn on it: paper becomes ground (§8). */
  | "MAP_TO_CAMP"
  | "WORLD_TO_SCENE"
  | "WORLD_TO_PAPER"
  | "PAPER_TO_RECORD"
  /** Camp to the journal: the notebook is picked up and opened. */
  | "CAMP_TO_JOURNAL"
  /** And back: the book closes and the table is underneath it again (§18). */
  | "JOURNAL_TO_CAMP"
  /** Between two leaves of the field journal. A page turns. */
  | "BOOK_TURN"
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
  /*
     Entering the survey.

     No mark, deliberately. §5 asks for a short sequence in which the
     landscape recedes and paper emerges, and the Frontier stamp struck over a
     black veil is the opposite instruction — it says "a journey is loading",
     when what is happening is that one representation of a place is being
     replaced by another. The presentation is in RouteCurtain; this only says
     the move is announced and that Chapter I lands at the end of it.
  */
  LANDING_TO_FRONTIER: { cover: true, loader: false, chapter: true, dwell: 700, turn: false },
  /* Off the sheet and onto the ground. Paper, enlarging past the point where
     it is paper at all, and then the place. Again no mark: the visitor is
     travelling to somewhere they were just looking at, not waiting. */
  MAP_TO_CAMP: { cover: true, loader: false, chapter: true, dwell: 620, turn: false },
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
  /*
     The notebook, put down.

     §18 asks for a believable reverse, and "believable" here means literally
     the same object moving the other way rather than a different animation
     that happens to end at Camp. So the same leaf, the same origin, the same
     easing family — run from open back down onto the table. No chapter:
     returning to a place you have already been is not entering an act, and a
     card announcing Chapter II on the way out of the book would make closing
     it feel like arriving somewhere new.
  */
  JOURNAL_TO_CAMP: { cover: true, loader: false, chapter: false, dwell: 0, turn: false },
  /* One leaf of the book to the next is a page being turned — between two
     records, and equally between Gear and the Archive. They are pages of the
     same notebook now, and a chapter card between two of them would announce
     a journey the reader did not take. */
  BOOK_TURN: { cover: false, loader: false, chapter: false, dwell: 0, turn: true },
  /* The recruiter path stays quick: a fade, no ceremony, no chapter. */
  ANY_TO_PROFESSIONAL: { cover: false, loader: false, chapter: false, dwell: 0, turn: false },
  NONE: { cover: false, loader: false, chapter: false, dwell: 0, turn: false },
};

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

  const toInBook = isInBook(to);
  const fromInBook = from !== null && isInBook(from);

  /* Inside the book, a page turns. Both ends have to be leaves: Gear to the
     Notes is a turn; Camp to the Notes is picking the book up. */
  if (toInBook && fromInBook) return "BOOK_TURN";

  /* Camp to any leaf is the notebook being picked up and opened. It is the
     only way into the book from the world that is a reach for an object
     rather than a journey to a place. */
  if (toInBook && from === routes.about) return "CAMP_TO_JOURNAL";

  /* And the mirror of it. Any leaf back to Camp is the book being closed and
     set down — including the page arrows and the ribbon, which all end up
     here rather than each choosing their own treatment. */
  if (to === routes.about && fromInBook) return "JOURNAL_TO_CAMP";

  /* Arriving at a record from outside the book — a direct link, the map — is
     opening a document rather than entering an act. Records have no chapter. */
  if (isRearLeaf(to)) return "PAPER_TO_RECORD";

  if (!isMajorRoute(to)) return "NONE";

  /* The two moves that carry the world's argument, checked before the general
     cases so neither can be swallowed by them. */
  if (from === routes.home && to === routes.frontier) return "LANDING_TO_FRONTIER";
  if (from === routes.frontier && to === routes.about) return "MAP_TO_CAMP";

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
