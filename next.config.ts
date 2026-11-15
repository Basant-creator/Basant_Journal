import type { NextConfig } from "next";
import content from "./content/portfolio.json";
import { CARD, KEY_CASES } from "./lib/cards/keys";
import { cardRoute, projectRoute, routes, workRoute } from "./lib/routes";

/**
 * The earlier site's addresses, pointed at their places in the title cards.
 *
 * The title cards are the site (app/(cards)), with a professional view at
 * the same address the earlier site used for one. The earlier site's pages are
 * kept in the repository for review, unlinked; anyone holding one of their
 * links lands on the matching card or case file instead. Temporary (307)
 * while the earlier site is under review, so nothing is cached as final.
 */
const keyCases: readonly string[] = KEY_CASES;
const earlier: { source: string; destination: string }[] = [
  { source: routes.frontier, destination: routes.home },
  { source: routes.projects, destination: cardRoute(KEY_CASES[0]) },
  /* A project the cards bill opens its case file; one they do not, the deck. */
  ...content.projects.map((p) => ({
    source: projectRoute(p.id),
    destination: keyCases.includes(p.id) ? workRoute(p.id) : routes.home,
  })),
  { source: routes.journey, destination: cardRoute(CARD.about) },
  { source: routes.about, destination: cardRoute(CARD.about) },
  { source: routes.skills, destination: cardRoute(CARD.toolbox) },
  { source: routes.notes, destination: routes.home },
  { source: routes.bounties, destination: routes.home },
  { source: routes.archive, destination: cardRoute(CARD.record) },
  { source: routes.contact, destination: cardRoute(CARD.contact) },
  /* Where the cards were tried out before they became the site. */
  { source: "/lab/titlecards", destination: routes.home },
  { source: "/lab/titlecards/:project", destination: `${workRoute("")}:project` },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return earlier.map((r) => ({ ...r, permanent: false }));
  },
};

export default nextConfig;
