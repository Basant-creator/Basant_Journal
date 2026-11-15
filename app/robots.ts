import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/routes";

/** What a crawler may have: everything, and the sitemap to find it by. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
    host: SITE_ORIGIN,
  };
}
