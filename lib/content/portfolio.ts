/**
 * The single read point for site content.
 *
 * Every component imports from here, never from the JSON directly, so the
 * shape is typed once and lookups live in one place.
 */

import data from "@/content/portfolio.json";
import { routes } from "@/lib/routes";
import type { NavigationLocation, Portfolio, Project } from "./types";

export const portfolio = data as unknown as Portfolio;

export const { meta, person, links, projects, metrics, skills } = portfolio;
export const { education, training, certifications } = portfolio;

/** Locations in trail order — the order the survey was walked. */
export const locations: NavigationLocation[] = [...portfolio.navigationLocations].sort(
  (a, b) => a.order - b.order,
);

export function getLocation(id: string): NavigationLocation | undefined {
  return locations.find((l) => l.id === id);
}

/** The location whose canonical route is this path, if any. */
export function locationForRoute(route: string): NavigationLocation | undefined {
  return locations.find((l) => l.route === route);
}

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

/** Projects that name this skill in their technology list. */
export function projectsForSkill(projectIds: string[]): Project[] {
  return projectIds
    .map((id) => getProject(id))
    .filter((p): p is Project => Boolean(p));
}

export interface RecordNeighbour {
  href: string;
  label: string;
  /** True when the step leaves the records and returns to the index. */
  isIndex: boolean;
}

/**
 * Where "previous record" and "next record" go.
 *
 * The sequence is TuneIt → OnSight → BobAI → back to the Journal. It
 * deliberately does not wrap from the last record to the first: returning to
 * the index is the end of the sequence, so the reader always knows when they
 * have seen everything.
 */
export function recordNeighbours(id: string): {
  previous: RecordNeighbour;
  next: RecordNeighbour;
} {
  const index = projects.findIndex((p) => p.id === id);
  const before = index > 0 ? projects[index - 1] : null;
  const after = index >= 0 && index < projects.length - 1 ? projects[index + 1] : null;

  return {
    previous: before
      ? { href: before.route, label: before.title, isIndex: false }
      : { href: routes.projects, label: "Journal", isIndex: true },
    next: after
      ? { href: after.route, label: after.title, isIndex: false }
      : { href: routes.projects, label: "Journal", isIndex: true },
  };
}

/**
 * The location the primary trail leads to. The map's hierarchy — node size,
 * the red shortcut, the legend emphasis — all derive from this rather than
 * hard-coding "journal" in several components.
 */
export const primaryLocationId = "journal";
export const originLocationId = "camp";
