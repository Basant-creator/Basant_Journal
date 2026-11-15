import { ongoing, projects, skills } from "@/lib/content/portfolio";
import type { EvidenceTable, ProjectChallenge, ProjectMetric } from "@/lib/content/types";
import { KEY_CASES } from "./keys";

/**
 * A case file as the cards tell it: a finished project, or work still in
 * progress that carries a case file of its own (lib/content/types.ts,
 * OngoingCaseFile). Either way every word is the content file's; the two
 * things work in progress can lack, a start date and a lesson, are null and
 * simply left out.
 */
export type CaseFile = {
  id: string;
  title: string;
  subtitle: string;
  date: string | null;
  /* The label work in progress carries ("Ongoing"); null for a finished project. */
  status: string | null;
  summary: string;
  problem: string;
  objective: string;
  architecture: string;
  implementation: string[];
  technologies: string[];
  metrics: ProjectMetric[];
  metricsCaption?: string;
  evidence?: EvidenceTable;
  challenges: ProjectChallenge[];
  lessons: string | null;
  github: string | null;
  liveUrl: string | null;
  skills?: { name: string; group: string }[];
};

/* Work in progress that has a case file, as a case file. */
const inProgress: CaseFile[] = ongoing.flatMap((o) =>
  o.caseFile ? [{ id: o.id, title: o.title, status: o.label, ...o.caseFile }] : [],
);

/* The finished projects, as case files. */
const finished: CaseFile[] = projects.map((p) => ({ ...p, status: null }));

/**
 * The key projects, in the order the cards deal them (lib/cards/keys.ts).
 * Strata leads. BobAI is not billed: it stays in the content file, and in
 * the earlier site kept in the repository for review.
 */
const all = [...inProgress, ...finished];
export const CASES: CaseFile[] = KEY_CASES.flatMap((id) => all.filter((c) => c.id === id));
export const getCase = (id: string) => CASES.find((c) => c.id === id);

/**
 * The toolbox as the cards bill it: every skill in the content file's
 * groups, credited only with the case files on the deck. A finished project
 * is credited from the toolbox's own lists; work in progress names its own
 * skills (its case file's `skills`), which credits it on the skills it
 * shares and adds the ones it brings to their groups. A skill no case file
 * on the deck uses is still billed, with no credit.
 */
export type Credit = { name: string; credits: string[] };
export const CAST: { group: string; items: Credit[] }[] = skills.map((g) => {
  const credits = (name: string, ids: string[]) =>
    CASES.filter((c) => ids.includes(c.id) || c.skills?.some((s) => s.name === name && s.group === g.group)).map((c) => c.title);
  const items = g.items.map((item) => ({ name: item.name, credits: credits(item.name, item.projects) }));
  const known = new Set(g.items.map((i) => i.name));
  const brought = CASES.flatMap((c) => c.skills ?? []).filter((s) => s.group === g.group && !known.has(s.name));
  for (const name of new Set(brought.map((s) => s.name))) items.push({ name, credits: credits(name, []) });
  return { group: g.group, items };
});

/* Roman numerals for case files, in the order the cards deal them. */
export const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

/* The poster field each card is printed on, and the ink printed over it.
   A project keeps its field on its case file. */
export type Field = "blood" | "black" | "night" | "mustard" | "teal" | "rust" | "cream";
export const PROJECT_FIELD: Record<string, Field> = { strata: "rust", tuneit: "mustard", onsight: "teal" };

/* The content file sets ranges with long dashes; the cards set them with a
   plain hyphen. Punctuation only. */
export const plain = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");

/* A case file's date line: its dates, then, for work in progress, its status. */
export const when = (c: CaseFile) => [c.date ? plain(c.date) : null, c.status].filter(Boolean).join(" · ");
