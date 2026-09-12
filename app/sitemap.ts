import type { MetadataRoute } from "next";
import { projects } from "@/lib/content/portfolio";
import { SITE_ORIGIN, routes } from "@/lib/routes";

/**
 * The twelve routes, declared.
 *
 * Built from `routes` and the content model rather than a hand-kept list, so a
 * route cannot exist without appearing here and cannot appear here after being
 * deleted. The `/lab` benches are absent on purpose — they are development
 * surfaces with placeholder content, and `app/robots.ts` disallows them for
 * the same reason.
 *
 * Priorities say what the site is for: the landing and the map first, the
 * records and the professional view next — those are what a reader was sent a
 * link to — and the territories after them.
 */
const PRIORITY: Record<string, number> = {
  [routes.home]: 1,
  [routes.frontier]: 0.9,
  [routes.projects]: 0.9,
  [routes.professional]: 0.8,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages = [
    ...Object.values(routes),
    ...projects.map((project) => project.route),
  ];

  return pages.map((path) => ({
    url: new URL(path, SITE_ORIGIN).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: PRIORITY[path] ?? 0.7,
  }));
}
