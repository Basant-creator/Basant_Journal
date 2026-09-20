import { routes } from "@/lib/routes";
import { chapterNumeralFor } from "@/lib/world/trail";

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
  /**
   * How loud the arrival is.
   *
   * §24 asks that the further into the journey the visitor gets, the calmer
   * the environment becomes — current findings give way to historical record,
   * and the treatment should say so before the content does. `quiet` is that
   * instruction, carried on the chapter rather than inferred by the curtain,
   * because "the Archive is a quiet place" is a fact about the place.
   */
  tone?: "quiet";
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
/**
 * The acts, and only the acts.
 *
 * One entry per world checkpoint, which is the invariant §33 turns on: a
 * chapter card is the loudest statement the site makes about where somebody
 * is, and it must not be able to disagree with the trail at the foot of the
 * screen or with the marker on the sheet. The Journey, Gear and the Notes are
 * gone from this table — they are leaves of the notebook, so a reader turning
 * to one is still at Records and is told so by the trail rather than by a
 * card announcing an act they did not enter (§16).
 *
 * The numerals are not written here either. They come from the checkpoint's
 * own position on the route, so renumbering is something that happens by
 * reordering the world rather than by editing two files and hoping.
 */
export const CHAPTERS: Record<string, ChapterMeta> = {
  [routes.frontier]: {
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
    title: "The Camp",
    subtitle: "Basant's Territory",
  },
  [routes.projects]: {
    title: "The Records",
    subtitle: "Field Journal",
  },
  [routes.bounties]: {
    title: "The Board",
    subtitle: "Notable Findings",
  },
  /* §24: from here the world gets quieter. The Archive and Trail End are
     where the journey stops being a survey and starts being a record of one,
     and their arrivals are treated accordingly — see RouteCurtain. */
  [routes.archive]: {
    title: "The Archive",
    subtitle: "Records & History",
    tone: "quiet",
  },
  [routes.contact]: {
    title: "Trail End",
    subtitle: "The Last Stop",
    tone: "quiet",
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
  const meta = CHAPTERS[pathname];
  if (!meta) return null;
  /* The numeral is the checkpoint's index, not a field. A place that is not
     on the route — the professional view — gets no number, and that falls out
     of the model rather than being remembered. */
  const chapter = chapterNumeralFor(pathname);
  return chapter ? { ...meta, chapter } : meta;
}

/** Whether a pathname is one of the world's major routes. */
export function isMajorRoute(pathname: string): boolean {
  return pathname in CHAPTERS;
}
