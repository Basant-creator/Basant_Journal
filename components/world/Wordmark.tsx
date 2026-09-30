import styles from "./Wordmark.module.css";

interface WordmarkProps {
  /** Rendered at the size of its container; the viewBox does the scaling. */
  className?: string;
  /** `press` embosses into the paper/ground; `stamp` reads as struck ink. */
  variant?: "press" | "stamp";
  title?: string;
}

/** The viewBox width, and so the width the title is fitted to. */
const WIDTH = 920;

/**
 * The graduation along the foot of the neatline: forty intervals, every fifth
 * one long, the way a sheet's margin is divided so a position can be read off
 * it. Integers throughout, so the server and the client draw the same path.
 */
const GRADUATION = Array.from({ length: 41 }, (_, i) => {
  const x = Math.round((i * WIDTH) / 40);
  return `M ${x} 186 v ${i % 5 === 0 ? 9 : 4}`;
}).join(" ");

/**
 * THE FRONTIER, lettered as the title of a survey plate.
 *
 * Not a font dropped into a heading. The treatment is original and built from
 * three things a plate actually has:
 *
 *   1. an ink-bleed filter — turbulence displacing the outline so the edges
 *      spread into the fibre the way real ink does, never the same twice
 *      across two letters;
 *   2. an emboss — a dark impression offset down-right and a warm highlight
 *      offset up-left, so the title reads as pressed *into* the surface;
 *   3. the neatline around it — a hairline over the title and the double rule
 *      under it, graduated along its foot, which is how a survey sheet frames
 *      the thing it is the survey of.
 *
 * The letters are Fell, spaced out to the neatline's full width with
 * `textLength` rather than a letter-spacing guessed against one face's
 * metrics: the title always meets the frame, whichever face ends up drawing
 * it. It was Rye — wood type from a saloon bill — centred between a pair of
 * rules and a lozenge, which is a poster's furniture and the reason the first
 * thing on the site read as a western rather than as a survey.
 */
export function Wordmark({ className, variant = "press", title = "The Frontier" }: WordmarkProps) {
  const id = `wordmark-${variant}`;

  return (
    <svg
      className={[styles.mark, styles[variant], className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${WIDTH} 200`}
      role="img"
      aria-label={title}
    >
      <defs>
        {/* Ink bleed: displace the glyph edges with low-frequency noise so the
            outline spreads unevenly, then soften a hair. */}
        <filter id={`${id}-ink`} x="-4%" y="-25%" width="108%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.22" />
        </filter>

        {/* A coarser bite for the impression beneath, so the two edges never
            line up exactly — which is what sells it as one physical strike. */}
        <filter id={`${id}-ink-deep`} x="-4%" y="-25%" width="108%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="19" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.4"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>

      {/* The neatline: a hairline over the title, the double rule under it,
          and the graduation hung from the lower of the two. */}
      <g className={styles.rule} aria-hidden="true">
        <path d={`M 0 44 H ${WIDTH}`} opacity="0.55" />
        <path d={`M 0 178 H ${WIDTH}`} />
        <path d={`M 0 186 H ${WIDTH}`} opacity="0.55" />
        <path d={GRADUATION} opacity="0.55" />
      </g>

      <text className={styles.the} x="0" y="32" aria-hidden="true">
        THE
      </text>

      {/* The impression, then the highlight, then the face. */}
      <g aria-hidden="true">
        <text
          className={styles.impression}
          x="2.5"
          y="158"
          textLength={WIDTH - 4}
          lengthAdjust="spacing"
          filter={`url(#${id}-ink-deep)`}
        >
          FRONTIER
        </text>
        <text
          className={styles.highlight}
          x="-1.5"
          y="155"
          textLength={WIDTH - 4}
          lengthAdjust="spacing"
        >
          FRONTIER
        </text>
        <text
          className={styles.face}
          x="0"
          y="156"
          textLength={WIDTH - 4}
          lengthAdjust="spacing"
          filter={`url(#${id}-ink)`}
        >
          FRONTIER
        </text>
      </g>
    </svg>
  );
}
