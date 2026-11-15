import { createRng, seedFrom } from "@/lib/map/rng";
import { certifications, education, person, projects, training } from "@/lib/content/portfolio";
import { trailGeometry, walk, type TrailGeometry, type Walk } from "./trail";

const r2 = (n: number) => Math.round(n * 100) / 100;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Mar 2026 - Apr 2026" -> a sortable month index from its first date. */
export const when = (period: string) => {
  const m = period.match(/([A-Z][a-z]{2})\s+(\d{4})/);
  if (m) return Number(m[2]) * 12 + MONTHS.indexOf(m[1]);
  const y = period.match(/\d{4}/);
  return y ? Number(y[0]) * 12 : 0;
};
const firstDate = (period: string) => period.match(/[A-Z][a-z]{2}\s+\d{4}|\d{4}/)?.[0] ?? period;

/* The content file sets ranges with long dashes; the page sets them with a
   plain hyphen. Punctuation only. */
const plain = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");
const proofOf = (item: { certificate?: string | null; certificateStatus?: string }) =>
  item.certificateStatus === "resolved" && item.certificate ? item.certificate : null;

/**
 * What a checkpoint stands for, in full: the record a visitor reads beside
 * the trail. Every field is the content file's own.
 */
export type Milestone =
  | { type: "year"; year: string; title: string; body: string }
  | { type: "school"; qualification: string; institution: string; place: string; period: string }
  | { type: "training"; title: string; issuer: string | null; period: string; body: string | null; proof: string | null }
  | { type: "certificate"; title: string; issuer: string | null; period: string; proof: string | null }
  | { type: "built"; title: string; subtitle: string; period: string; route: string };

/* Everything with a date that belongs on the trail, oldest first. */
const DATED = [
  ...education.map((e) => ({
    at: when(e.period),
    date: firstDate(e.period),
    label: e.qualification.split(",")[0],
    kind: "School",
    record: { type: "school", qualification: e.qualification, institution: e.institution, place: e.place, period: plain(e.period) } as Milestone,
  })),
  ...training.map((t) => ({
    at: when(t.period),
    date: firstDate(t.period),
    label: "UI/UX training",
    kind: "Training",
    record: { type: "training", title: t.title, issuer: t.issuer ?? null, period: plain(t.period), body: t.body ?? null, proof: proofOf(t) } as Milestone,
  })),
  ...certifications.map((c) => ({
    at: when(c.period),
    date: firstDate(c.period),
    label: c.title.replace(/ with Proctored Exam| \(Live MOOC\)/, ""),
    kind: "Certificate",
    record: { type: "certificate", title: c.title, issuer: c.issuer ?? null, period: plain(c.period), proof: proofOf(c) } as Milestone,
  })),
  ...projects.map((p) => ({
    at: when(p.date),
    date: firstDate(p.date),
    label: p.title,
    kind: "Built",
    record: { type: "built", title: p.title, subtitle: p.subtitle, period: plain(p.date), route: p.route } as Milestone,
  })),
].sort((a, b) => a.at - b.at);

/** A checkpoint on the trail, in the 1200 x 440 units of its drawing, and
    the record it stands for. */
export type TrailNode =
  | { x: number; y: number; kind: "camp"; year: string; title: string; record: Milestone }
  | { x: number; y: number; kind: "point"; when: string; what: string; record: Milestone };

export type JourneyTrail = { nodes: TrailNode[]; geo: TrailGeometry; walk: Walk };

/**
 * The journey as a trail: a camp for each year, the dated things of that
 * year as waypoints after it, laid out left to right and wound up and
 * down, measured, and timed for a walker. Built once, on the server; every
 * number in it is rounded, so the client hydrates the same drawing.
 */
export function journeyTrail(): JourneyTrail {
  const seq: (Omit<Extract<TrailNode, { kind: "camp" }>, "x" | "y"> | Omit<Extract<TrailNode, { kind: "point" }>, "x" | "y">)[] = [];
  for (const leg of person.journey) {
    seq.push({ kind: "camp", year: leg.year, title: leg.title, record: { type: "year", year: leg.year, title: leg.title, body: plain(leg.body) } });
    for (const d of DATED) {
      if (String(Math.floor(d.at / 12)) === leg.year) seq.push({ kind: "point", when: `${d.kind} · ${d.date}`, what: d.label, record: d.record });
    }
  }
  const rng = createRng(seedFrom("wanted-trail"));
  const nodes = seq.map((n, i) => ({
    ...n,
    x: r2(70 + (i * 1060) / Math.max(1, seq.length - 1)),
    y: r2(n.kind === "camp" ? (i % 2 ? 150 : 290) : i % 2 ? 130 + rng.range(0, 40) : 260 + rng.range(0, 40)),
  })) as TrailNode[];
  const geo = trailGeometry(nodes);
  return { nodes, geo, walk: walk(geo) };
}
