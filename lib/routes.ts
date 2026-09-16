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
 * Resolved, not hardcoded. This was a placeholder domain typed into a
 * constant, with content/portfolio.json carrying a *second*, different
 * placeholder — so the site described itself as two origins depending on
 * which file you read. That dead field is gone; this is the only origin.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment of a project,
 * and it is always the *production* domain rather than the per-deployment
 * one. That distinction is the whole reason it is the variable used here: a
 * canonical tag, a sitemap entry and an OG URL must all point at the stable
 * address, not at the preview build that happens to be rendering them. So a
 * Vercel deployment resolves its own origin with nothing to configure.
 *
 * NEXT_PUBLIC_SITE_ORIGIN overrides it, for a custom domain or a host that is
 * not Vercel. Set it to a full origin, scheme included.
 *
 * Local builds fall back to localhost, which is correct for development and
 * wrong for anything public — so a production build that finds neither
 * variable says so rather than quietly shipping localhost into a canonical
 * tag, which is the one failure here that search engines would act on.
 */
function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  /*
    Server only. This module is imported by client components, so it runs in
    the browser too — and VERCEL_PROJECT_PRODUCTION_URL is not a NEXT_PUBLIC
    variable, so on the client it is always undefined. Without this guard a
    correctly-configured Vercel deployment would print a configuration warning
    into every visitor's console, on every page, about a variable the browser
    was never meant to see.
  */
  /*
    Server only, and deliberately repetitive.

    This module is imported by client components, so it runs in the browser
    too — and VERCEL_PROJECT_PRODUCTION_URL is not a NEXT_PUBLIC variable, so
    on the client it is always undefined. Without the window guard a correctly
    configured Vercel deployment would print a configuration warning into
    every visitor's console, on every page, about a variable the browser was
    never meant to see.

    It prints once per prerendered page during a build — Next evaluates this
    module in a separate context for each, and a module-level "already warned"
    flag does not cross those boundaries, so one was tried and removed rather
    than left in place doing nothing. Nineteen identical lines is untidy, but
    this only fires on a build that would otherwise ship localhost into its
    canonical tags, and on Vercel it never fires at all.
  */
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    console.warn(
      "[routes] No origin configured: set NEXT_PUBLIC_SITE_ORIGIN, or deploy " +
        "on Vercel where VERCEL_PROJECT_PRODUCTION_URL is supplied. Falling " +
        "back to localhost — canonical URLs, the sitemap and share previews " +
        "will all be wrong until this is set.",
    );
  }

  return "http://localhost:3000";
}

export const SITE_ORIGIN = resolveOrigin();

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
