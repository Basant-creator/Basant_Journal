import styles from "./Wordmark.module.css";

interface WordmarkProps {
  /** Rendered at the size of its container; the viewBox does the scaling. */
  className?: string;
  /** `press` embosses into the paper/ground; `stamp` reads as struck ink. */
  variant?: "press" | "stamp";
  title?: string;
}

/**
 * THE FRONTIER, set as a letterpress impression.
 *
 * Not a font dropped into a heading. The treatment is original and built from
 * three things a press actually does:
 *
 *   1. an ink-bleed filter — turbulence displacing the outline so the edges
 *      spread into the fibre the way real ink does, never the same twice
 *      across two letters;
 *   2. an emboss — a dark impression offset down-right and a warm highlight
 *      offset up-left, so the type reads as pushed *into* the surface;
 *   3. the furniture around it — rules and a lozenge, the compositor's way of
 *      centring a line.
 *
 * No game typeface is used or imitated: the letterforms are a 19th-century
 * wood-type revival, and everything that gives the mark its character is the
 * filter stack below.
 */
export function Wordmark({ className, variant = "press", title = "The Frontier" }: WordmarkProps) {
  const id = `wordmark-${variant}`;

  return (
    <svg
      className={[styles.mark, styles[variant], className].filter(Boolean).join(" ")}
      viewBox="0 0 920 220"
      role="img"
      aria-label={title}
    >
      <defs>
        {/* Ink bleed: displace the glyph edges with low-frequency noise so the
            outline spreads unevenly, then soften a hair. */}
        <filter id={`${id}-ink`} x="-8%" y="-25%" width="116%" height="150%">
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
        <filter id={`${id}-ink-deep`} x="-8%" y="-25%" width="116%" height="150%">
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

      {/* Compositor's furniture: rule, lozenge, rule. */}
      <g className={styles.rule} aria-hidden="true">
        <path d="M 96 44 H 376 M 544 44 H 824" />
        <path d="M 460 34 l 13 10 l -13 10 l -13 -10 Z" />
        <path d="M 96 186 H 824" />
        <path d="M 96 193 H 824" opacity="0.5" />
      </g>

      <text className={styles.the} x="460" y="34" textAnchor="middle" aria-hidden="true">
        THE
      </text>

      {/* The impression, then the highlight, then the face. */}
      <g aria-hidden="true">
        <text
          className={styles.impression}
          x="462.5"
          y="152"
          textAnchor="middle"
          filter={`url(#${id}-ink-deep)`}
        >
          FRONTIER
        </text>
        <text className={styles.highlight} x="458.5" y="149" textAnchor="middle">
          FRONTIER
        </text>
        <text
          className={styles.face}
          x="460"
          y="150"
          textAnchor="middle"
          filter={`url(#${id}-ink)`}
        >
          FRONTIER
        </text>
      </g>
    </svg>
  );
}
