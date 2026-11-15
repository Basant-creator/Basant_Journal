import type { MetadataRoute } from "next";
import { CASES } from "@/lib/cards/catalog";
import { SITE_ORIGIN, routes, workRoute } from "@/lib/routes";

/**
 * Every page, declared: the title cards, the professional view, and a case
 * file for each project they bill.
 *
 * Built from the catalog rather than a hand-kept list, so a case file cannot
 * exist without appearing here and cannot appear here after being dropped.
 * The cards themselves are anchors on the home page, not pages, so they are
 * not listed. The earlier site's addresses are absent because they redirect
 * (next.config.ts), and the `/lab` benches because robots.ts disallows them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages: { path: string; priority: number }[] = [
    { path: routes.home, priority: 1 },
    { path: routes.professional, priority: 0.9 },
    ...CASES.map((c) => ({ path: workRoute(c.id), priority: 0.8 })),
  ];
  return pages.map(({ path, priority }) => ({
    url: new URL(path, SITE_ORIGIN).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
