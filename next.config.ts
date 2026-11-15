import type { NextConfig } from "next";
import content from "./content/portfolio.json";
import { CARD, KEY_CASES } from "./lib/cards/keys";
import { cardRoute, earlier, earlierProjectRoute, routes, workRoute } from "./lib/routes";

/**
 * The earlier site's addresses, pointed at their places in the title cards.
 *
 * The title cards are the site (app/(cards)), with a professional view at
 * the same address the earlier site used for one. The earlier site is gone;
 * anyone holding one of its links lands on the matching card or case file
 * instead. Temporary (307) until the owner decides they are final.
 */
const keyCases: readonly string[] = KEY_CASES;
const moved: { source: string; destination: string }[] = [
  { source: earlier.frontier, destination: routes.home },
  { source: earlier.projects, destination: cardRoute(KEY_CASES[0]) },
  /* A project the cards bill opens its case file; one they do not, the deck. */
  ...content.projects.map((p) => ({
    source: earlierProjectRoute(p.id),
    destination: keyCases.includes(p.id) ? workRoute(p.id) : routes.home,
  })),
  { source: earlier.journey, destination: cardRoute(CARD.about) },
  { source: earlier.about, destination: cardRoute(CARD.about) },
  { source: earlier.skills, destination: cardRoute(CARD.toolbox) },
  { source: earlier.notes, destination: routes.home },
  { source: earlier.bounties, destination: routes.home },
  { source: earlier.archive, destination: cardRoute(CARD.record) },
  { source: earlier.contact, destination: cardRoute(CARD.contact) },
  /* Where the cards were tried out, in the lab, before they became the site. */
  { source: "/lab/titlecards", destination: routes.home },
  { source: "/lab/titlecards/:project", destination: `${workRoute("")}:project` },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return moved.map((r) => ({ ...r, permanent: false }));
  },
};

export default nextConfig;
