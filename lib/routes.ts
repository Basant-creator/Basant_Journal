/**
 * The single definition of where things are.
 *
 * Route strings are never written inline in a component. Every link resolves
 * through here or through the content model's own `route` field, so a URL can
 * be changed in one place without drift.
 */

/**
 * Where the site lives.
 *
 * Still a placeholder, and deliberately only one of them: the origin was
 * written into app/layout.tsx while content/portfolio.json carried a different
 * placeholder again, so the site described itself as two domains depending on
 * which file you read. Everything absolute now resolves from here — the
 * metadata base, the sitemap, and the robots policy — which makes pointing
 * this at the real domain a single edit rather than a search.
 */
export const SITE_ORIGIN = "https://basantbhushan.dev";

export const routes = {
  home: "/",
  frontier: "/frontier",
  projects: "/projects",
  professional: "/professional",
  about: "/about",
  skills: "/skills",
  bounties: "/bounties",
  archive: "/archive",
  contact: "/contact",
} as const;

export type RouteKey = keyof typeof routes;
export type Route = (typeof routes)[RouteKey];

/** Canonical record route for a project id. */
export function projectRoute(id: string): string {
  return `${routes.projects}/${id}`;
}

/**
 * The professional view highlights a project through a fragment rather than a
 * route of its own: it is the same document, scrolled to a section.
 */
export function professionalAnchor(id: string): string {
  return `${routes.professional}#${id}`;
}

/**
 * Sections inside a field record. These are fragments, not routes — one long
 * document with anchors, never a route per section.
 */
export const PROJECT_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "implementation", label: "Implementation" },
  { id: "metrics", label: "Metrics" },
  { id: "technology", label: "Technology" },
  { id: "notes", label: "Field notes" },
] as const;

export type ProjectSectionId = (typeof PROJECT_SECTIONS)[number]["id"];
