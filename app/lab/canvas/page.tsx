import type { Metadata } from "next";
import { ThreeScene } from "@/components/three/ThreeScene";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "3D boundary — Lab",
  robots: { index: false, follow: false },
};

/**
 * Phase 5 steps 02-03: proof that the boundary holds.
 *
 * The fallback below is what the server renders and what every visitor sees
 * first. Only once the client confirms WebGL, a wide viewport and no
 * reduced-motion preference does the scene chunk load at all — so this page
 * is also the demonstration that three.js never reaches anyone who cannot or
 * should not receive it.
 */
export default function CanvasLabPage() {
  return (
    <>
      <header>
        <h1 className={styles.title}>3D boundary</h1>
        <p className={styles.lede}>
          The frame below renders the illustrated fallback on the server. After
          mount it checks for a real WebGL context, a viewport wider than
          860px, and no reduced-motion preference. Only if all three hold does
          the scene chunk load. Narrow this window past 860px, or switch
          reduced motion on, and the canvas is replaced — not hidden, replaced.
        </p>
      </header>

      <ThreeScene
        scene="bench"
        label="Test scene: dusk, a ridge line, a warm light and one object."
        className={styles.frame}
        fallback={
          <div className={styles.fallback}>
            <svg viewBox="0 0 800 450" className={styles.fallbackArt} aria-hidden="true">
              <rect x="0" y="0" width="800" height="450" fill="var(--scene-night)" />
              <path
                d="M -20 330 L 120 210 L 250 300 L 400 190 L 540 300 L 680 220 L 820 320 L 820 470 L -20 470 Z"
                fill="var(--scene-depth-1)"
              />
              <path
                d="M -20 390 L 180 340 L 420 380 L 660 335 L 820 385 L 820 470 L -20 470 Z"
                fill="var(--scene-depth-4)"
              />
              <circle cx="400" cy="372" r="26" fill="var(--fire-glow)" />
              <circle cx="400" cy="374" r="10" fill="var(--fire-core)" />
            </svg>
            <p className={styles.fallbackNote}>Illustrated fallback</p>
          </div>
        }
      >
        <p className={styles.overlay}>
          DOM layer — sits over the canvas, carries everything readable
        </p>
      </ThreeScene>

      <section className={styles.notes}>
        <h2 className={styles.notesTitle}>What this proves</h2>
        <ul className={styles.list}>
          <li>
            <strong>three is not in the shared bundle.</strong> It arrives as
            its own chunk, on this route only, after the capability check
            passes.
          </li>
          <li>
            <strong>Failure is invisible.</strong> No WebGL means the fallback,
            which is also the first paint for everyone — nobody watches a
            canvas fail.
          </li>
          <li>
            <strong>The loop stops.</strong> Scrolled out of view, the canvas
            draws nothing; unmounted, the renderer is disposed.
          </li>
          <li>
            <strong>The canvas takes no pointer events.</strong> Every control
            over a scene is a real DOM element.
          </li>
        </ul>
      </section>
    </>
  );
}
