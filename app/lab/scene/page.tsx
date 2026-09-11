import type { Metadata } from "next";
import { ChapterCard } from "@/components/scene/ChapterCard";
import { SceneBench } from "./SceneBench";

export const metadata: Metadata = {
  title: "Scene engine — Lab",
  robots: { index: false, follow: false },
};

/**
 * Step 2's deliverable: proof that a generic Scene works.
 *
 * Background, middle and foreground bands, one interactive object per band, a
 * camera, a title and the air — with no scene-specific content anywhere in
 * it. Camp is built on this only after this page behaves.
 */
export default function SceneLabPage() {
  return (
    <>
      <ChapterCard chapter="0" title="Scene Engine" id="lab-scene" />

      <header>
        <h1 style={{ fontFamily: "var(--font-chapter)", letterSpacing: "0.06em" }}>
          Scene engine
        </h1>
        <p
          style={{
            fontFamily: "var(--font-editorial)",
            color: "var(--color-text-secondary)",
            maxWidth: "var(--measure-prose)",
            marginTop: "var(--space-4)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          Three depth bands, three interactive objects, a camera and the air.
          Parallax follows the pointer without a single React render; the
          objects are a tablist, so arrow keys walk them and one is always
          open; the camera frames the open object when switched on. Nothing on
          this page knows anything about a campfire.
        </p>
      </header>

      <SceneBench />
    </>
  );
}
