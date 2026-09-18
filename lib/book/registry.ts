import { projects } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";

/**
 * The field book, as a physical object.
 *
 * One registry, and it is the only place the book's order exists. §38 asks for
 * this explicitly and the reason is worth stating: a page's neighbours, the
 * direction a turn runs, which bookmark is lit and how far a jump has to
 * travel are all the same fact — where this leaf sits in the stack. Scattered
 * across components, that fact drifts, and a book whose pages disagree about
 * their own order is a book that turns the wrong way.
 *
 * Nothing here holds content. A leaf names a route that already renders the
 * same facts from content/portfolio.json, so the book cannot say something the
 * territory does not.
 */

export interface BookLeaf {
  /** Stable id, used for keys and for the bookmark. */
  id: string;
  /** The canonical route this leaf presents. The URL is authoritative. */
  route: string;
  /** The bookmark's word. A tab is not a sentence. */
  tab: string;
  /** Written at the head of the leaf. */
  title: string;
  /** One line in the surveyor's voice, saying what is kept here. */
  hand: string;
  /**
   * Which part of the book this belongs to.
   *
   *   front   the working sections, read front to back
   *   rear    the technical record section at the back
   */
  part: "front" | "rear";
}

/**
 * The physical index.
 *
 * Front to back, and the order is the composition: the map first because a
 * survey opens with its sheet, the journey next because that is how the
 * surveyor got there, then the working sections, then the records filed in the
 * back. Reordering this array reorders the book — the turns, the bookmarks and
 * the flutter distance all follow.
 */
export const BOOK_LEAVES: BookLeaf[] = [
  {
    id: "map",
    route: routes.frontier,
    tab: "Map",
    title: "The Survey",
    hand: "The sheet, and everything mapped on it.",
    part: "front",
  },
  {
    id: "journey",
    route: routes.journey,
    tab: "Journey",
    title: "The Journey",
    hand: "Where the surveyor has been, and when.",
    part: "front",
  },
  {
    id: "journal",
    route: routes.projects,
    tab: "Journal",
    title: "The Journal",
    hand: "Three systems, and where their records are filed.",
    part: "front",
  },
  {
    id: "bounties",
    route: routes.bounties,
    tab: "Bounties",
    title: "Bounties",
    hand: "Measured outcomes, each pinned to its record.",
    part: "front",
  },
  {
    id: "gear",
    route: routes.skills,
    tab: "Gear",
    title: "Gear",
    hand: "What gets carried, and what it is evidenced in.",
    part: "front",
  },
  {
    id: "archive",
    route: routes.archive,
    tab: "Archive",
    title: "The Archive",
    hand: "Degree, training and certifications, as issued.",
    part: "front",
  },
  {
    id: "trail-end",
    route: routes.contact,
    tab: "Trail End",
    title: "Trail End",
    hand: "The last stop, and how to reach the surveyor.",
    part: "front",
  },
  /* The rear section. Built from the content model, so a fourth project is
     filed in the back by existing rather than by being added here. */
  ...projects.map((project, i) => ({
    id: project.id,
    route: project.route,
    tab: project.title,
    title: project.title,
    hand: `Field record ${String(i + 1).padStart(2, "0")}.`,
    part: "rear" as const,
  })),
];

/** Where the notebook is kept. Camp is not a page of it — see BookShell. */
export const CAMP_ROUTE = routes.about;

const INDEX = new Map(BOOK_LEAVES.map((leaf, i) => [leaf.route, i]));

/** The leaf's physical position, or -1 if the route is not in the book. */
export function leafIndex(pathname: string): number {
  return INDEX.get(pathname) ?? -1;
}

export function leafFor(pathname: string): BookLeaf | null {
  const i = leafIndex(pathname);
  return i < 0 ? null : BOOK_LEAVES[i];
}

export function isInBook(pathname: string): boolean {
  return INDEX.has(pathname);
}

export function isRearLeaf(pathname: string): boolean {
  return leafFor(pathname)?.part === "rear";
}

/**
 * Leaves that are world checkpoints rather than document sections.
 *
 * They are still pages of the book — the Board, the Archive and Trail End are
 * printed on leaves and reached by turning to them. What they are not is
 * *bookmarks*, because §5 keeps two navigation scales apart and a bookmark is
 * the document scale: it moves the reader inside one object.
 *
 * Leaving them on the bookmark rail meant the book could carry a reader from
 * the Journal straight to Trail End, which is world travel performed by a
 * document control — precisely the teleportation §33 asks to be removed, and
 * the reason the trail exists.
 */
const WORLD_LEAVES = new Set(["bounties", "archive", "trail-end"]);

/** The bookmarks: the front *document* sections. The world is the trail's. */
export const BOOKMARKS = BOOK_LEAVES.filter(
  (leaf) => leaf.part === "front" && !WORLD_LEAVES.has(leaf.id),
);
export const FIRST_REAR_LEAF =
  BOOK_LEAVES.find((leaf) => leaf.part === "rear") ?? null;

export type TurnDirection = "forward" | "back";

/**
 * How a move through the book reads, physically.
 *
 * §31 asks for three weights, and they are distances rather than route names:
 * one leaf is a deliberate turn, a few are a quicker one, and the far side of
 * the book is a flutter. A reader jumping from the Archive to a record should
 * see the book travel — but not watch fifteen pages at full speed, which §30
 * is explicit about.
 */
export type TurnWeight = "single" | "near" | "flutter";

export interface Turn {
  direction: TurnDirection;
  weight: TurnWeight;
  /** How many leaves the move crosses. Zero when one end is outside the book. */
  distance: number;
}

export function turnBetween(from: string, to: string): Turn {
  const a = leafIndex(from);
  const b = leafIndex(to);
  if (a < 0 || b < 0) {
    return { direction: "forward", weight: "single", distance: 0 };
  }
  const distance = Math.abs(b - a);
  const direction: TurnDirection = b >= a ? "forward" : "back";
  const weight: TurnWeight =
    distance <= 1 ? "single" : distance <= 3 ? "near" : "flutter";
  return { direction, weight, distance };
}

/** The neighbouring leaves, for the page arrows and the keyboard. */
export function neighbours(pathname: string): {
  previous: BookLeaf | null;
  next: BookLeaf | null;
} {
  const i = leafIndex(pathname);
  if (i < 0) return { previous: null, next: null };
  return {
    previous: i > 0 ? BOOK_LEAVES[i - 1] : null,
    next: i < BOOK_LEAVES.length - 1 ? BOOK_LEAVES[i + 1] : null,
  };
}
