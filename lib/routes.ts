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

/** The site's pages. */
export const routes = {
  /* The title cards: one card on screen at a time, each an anchor of its own. */
  home: "/",
  /* The same facts as one plain page; it prints as a CV. */
  professional: "/professional",
} as const;

const workRoot = "/work";

/** A project's case file. */
export function workRoute(id: string): string {
  return `${workRoot}/${id}`;
}

/** A card on the deck, by id (`/#about`, `/#toolbox`, `/#strata`). */
export function cardRoute(id: string): string {
  return `${routes.home}#${id}`;
}

/**
 * The earlier site's addresses. Nothing is served at them any more: they
 * exist only as the sources of the redirects in next.config.ts, so links
 * shared before the title cards still land somewhere that makes sense.
 */
export const earlier = {
  frontier: "/frontier",
  projects: "/projects",
  journey: "/journey",
  about: "/about",
  skills: "/skills",
  notes: "/notes",
  bounties: "/bounties",
  archive: "/archive",
  contact: "/contact",
} as const;

/** The earlier site's record page for a project. */
export function earlierProjectRoute(id: string): string {
  return `${earlier.projects}/${id}`;
}
