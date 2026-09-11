/**
 * The single read point for site content.
 *
 * Every component imports from here, never from the JSON directly, so the
 * shape is typed once and lookups live in one place.
 */

import data from "@/content/portfolio.json";
import type {
  NavigationLocation,
  Portfolio,
  Project,
} from "./types";

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

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

/** Projects that name this skill in their technology list. */
export function projectsForSkill(projectIds: string[]): Project[] {
  return projectIds
    .map((id) => getProject(id))
    .filter((p): p is Project => Boolean(p));
}

/**
 * The location the primary trail leads to. Everything about the map's
 * hierarchy — node size, the red shortcut, the legend — derives from this
 * rather than hard-coding "journal" in several components.
 */
export const primaryLocationId = "journal";
export const originLocationId = "camp";
