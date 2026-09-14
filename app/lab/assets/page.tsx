import type { Metadata } from "next";
import { AssetsBench } from "./AssetsBench";

export const metadata: Metadata = {
  title: "Assets — Lab",
  robots: { index: false, follow: false },
};

/**
 * The contact sheet for supplied asset packs.
 *
 * Nothing gets into the Camp without being looked at first. Packs arrive with
 * names like `Object_29`, or with names that describe the pack's original
 * scene rather than what the mesh is, and a decision about what belongs in a
 * surveyor's camp cannot be made from a table of triangle counts.
 *
 * `/lab` is outside the sitemap and disallowed in robots.txt, so this costs a
 * file and nothing else.
 */
export default function AssetsLabPage() {
  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
          Supplied assets
        </h1>
        <p style={{ maxWidth: "60ch", opacity: 0.8 }}>
          Every object in each pack, isolated and normalised to its own cell. The
          numbered key below reads left to right, top to bottom.
        </p>
      </header>
      <AssetsBench />
    </>
  );
}
