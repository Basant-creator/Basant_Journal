import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/routes";

/**
 * What a crawler may have.
 *
 * Everything except `/lab`, which is where the benches live: paper stocks,
 * tear seams, scene rigs and title studies, all with placeholder copy written
 * to exercise a component rather than to be read. They were reachable and
 * indexable, which meant the site's own scaffolding could turn up in a search
 * for the person who built it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/lab/",
    },
    sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
    host: SITE_ORIGIN,
  };
}
