import { routes } from "@/lib/routes";

/**
 * What a route announces itself as.
 *
 * One registry, and it is the only place a chapter name exists. The bug this
 * phase fixes was not that any component misbehaved — it was that seven routes
 * each decided their own entry treatment in isolation, so three of them had
 * one, two had another, and two had none. A registry makes the omission
 * impossible to write: a route either has an entry here or it is not a major
 * route.
 *
 * Nothing infers these from the destination page. The routing layer knows
 * where it is going before the page exists, which is the whole reason the
 * chapter can be shown while the destination is still arriving.
 */
export interface ChapterMeta {
  /** Roman numeral. Omitted for places that are not acts. */
  chapter?: string;
  title: string;
  subtitle: string;
}

/**
 * Chapters belong to the world; records belong to the journal.
 *
 * The three project records carried "Chapter I / II / III" before this, which
 * collided head-on with numbering the routes — a reader would have met
 * "Chapter III · The Journal" and then, inside it, "Chapter I · TuneIt". Two
 * numbering systems using the same word is a bug that looks like a typo, so
 * the records are now Records and the word Chapter means one thing.
 */
export const CHAPTERS: Record<string, ChapterMeta> = {
  [routes.frontier]: {
    chapter: "I",
    title: "The Frontier",
    subtitle: "The Survey",
  },
  /*
     §28 asks for this one by name, and it earns the exception. Camp is the
     only chapter that is about a person rather than about a body of work —
     the others are a survey, a set of records, a toolkit, a board, an
     archive, a last stop. "Where the journey is kept" describes what is on
     the table; this says whose table it is.

     It also fits where the old one did not. The subtitle renders uppercase at
     0.3em of tracking, and twenty-five characters at that spacing is a line
     that has to shrink to fit a phone. Eighteen does not.
  */
  [routes.about]: {
    chapter: "II",
    title: "The Camp",
    subtitle: "Basant's Territory",
  },
  [routes.projects]: {
    chapter: "III",
    title: "The Journal",
    subtitle: "Field Records",
  },
  [routes.skills]: {
    chapter: "IV",
    title: "The Workshop",
    subtitle: "Tools of the Trade",
  },
  [routes.bounties]: {
    chapter: "V",
    title: "The Board",
    subtitle: "Notable Findings",
  },
  [routes.archive]: {
    chapter: "VI",
    title: "The Archive",
    subtitle: "Records & History",
  },
  [routes.contact]: {
    chapter: "VII",
    title: "Trail End",
    subtitle: "The Last Stop",
  },
  /* The professional view is deliberately not a chapter. It is the same
     material without the world around it, and a recruiter arriving there
     should not be told they have entered an act. */
  [routes.professional]: {
    title: "Professional Record",
    subtitle: "Everything, plainly",
  },
};

/**
 * The chapter for a pathname, or null if it is not a major route.
 *
 * Exact match only, on purpose. `/projects/tuneit` is not the Journal
 * arriving again — it is a document being opened inside it, and it has its
 * own transition. Prefix matching here is how a reader ends up being told
 * they have entered Chapter III every time they turn a page.
 */
export function chapterFor(pathname: string): ChapterMeta | null {
  return CHAPTERS[pathname] ?? null;
}

/** Whether a pathname is one of the world's major routes. */
export function isMajorRoute(pathname: string): boolean {
  return pathname in CHAPTERS;
}
