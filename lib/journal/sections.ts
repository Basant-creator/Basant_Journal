import { projects } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";

/**
 * What is in the field journal.
 *
 * The notebook is a *presentation* of the territory, not a second copy of it.
 * Every leaf here resolves to a route that already exists and already renders
 * the same facts — §23 and §35 of the brief both turn on that, and it is the
 * only way a table of contents can be trusted not to drift from the thing it
 * indexes.
 *
 * So there is no content in this file. There are names, hands and destinations,
 * and the content stays where it has always been: content/portfolio.json.
 */

export interface JournalLeaf {
  /** Stable id. Used for the tab, the page and the turn's direction maths. */
  id: string;
  /** The tab's word. Short — a bookmark is not a sentence. */
  tab: string;
  /** The heading written on the page itself. */
  title: string;
  /** One line, in the surveyor's voice, saying what is kept here. */
  hand: string;
  /** Where it goes. Always an existing canonical route. */
  href: string;
}

/**
 * The ordered spine of the book.
 *
 * Order matters twice: it is the reading order of the contents page, and it is
 * what decides which way a page turns when the reader jumps between two
 * sections. A turn that disagrees with the book's own order is a turn that
 * feels wrong without the reader being able to say why.
 *
 * The Journal is the section the notebook itself lives at, which is why it
 * carries the route the book is mounted on.
 */
export const JOURNAL_SECTIONS: JournalLeaf[] = [
  {
    id: "journey",
    tab: "Journey",
    title: "The Journey",
    hand: "Where the surveyor has been, and when.",
    href: routes.about,
  },
  {
    id: "journal",
    tab: "Journal",
    title: "The Journal",
    hand: "Three systems, written up in full.",
    href: routes.projects,
  },
  {
    id: "bounties",
    tab: "Bounties",
    title: "Bounties",
    hand: "Measured outcomes, each pinned to its record.",
    href: routes.bounties,
  },
  {
    id: "gear",
    tab: "Gear",
    title: "Gear",
    hand: "What gets carried, and what it is evidenced in.",
    href: routes.skills,
  },
  {
    id: "archive",
    tab: "Archive",
    title: "The Archive",
    hand: "Degree, training and certifications, as issued.",
    href: routes.archive,
  },
  {
    id: "trail-end",
    tab: "Trail End",
    title: "Trail End",
    hand: "The last stop, and how to reach the surveyor.",
    href: routes.contact,
  },
];

/** The section the book is currently open at, from the route. */
export function sectionFor(pathname: string): JournalLeaf | null {
  return JOURNAL_SECTIONS.find((s) => s.href === pathname) ?? null;
}

/**
 * The rear section: the field records themselves.
 *
 * Numbered rather than named in the index, because that is what a technical
 * record section does — the number is the filing, the name is the subject.
 * Drawn from the content model so a fourth project appears here by existing.
 */
export interface RecordLeaf {
  id: string;
  /** "01", "02", "03" — the filing number, not the chapter numeral. */
  filing: string;
  title: string;
  subtitle: string;
  date: string;
  href: string;
}

export const RECORD_LEAVES: RecordLeaf[] = projects.map((project, i) => ({
  id: project.id,
  filing: String(i + 1).padStart(2, "0"),
  title: project.title,
  subtitle: project.subtitle,
  date: project.date,
  href: project.route,
}));

/** Whether a pathname is one of the rear records. */
export function isRecordRoute(pathname: string): boolean {
  return RECORD_LEAVES.some((r) => r.href === pathname);
}

/**
 * Which way the book turns to get from one place to another.
 *
 * The whole spine in one order — the six sections, then the rear records —
 * so a jump from Gear to a project record turns *back* through the book the
 * way a hand would, and the reverse turns forward. Anything not in the book
 * (the landing page, the professional view) has no position and does not turn.
 */
const SPINE: string[] = [
  ...JOURNAL_SECTIONS.map((s) => s.href),
  ...RECORD_LEAVES.map((r) => r.href),
];

export function spineIndex(pathname: string): number {
  return SPINE.indexOf(pathname);
}
