import { locations } from "@/lib/content/portfolio";
import { trails } from "@/lib/map/locations";
import { SHEET_HEIGHT, SHEET_WIDTH } from "@/lib/map/terrain";
import { LocationGlyph } from "./symbols";
import styles from "./SheetReference.module.css";

interface SheetReferenceProps {
  caption?: string;
  className?: string;
}

/**
 * The survey, as a figure.
 *
 * §40 asks that the same map appear inside the book as a document, and §51.3
 * that the book's smaller map content be preserved where it is useful. This
 * is both, and the distinction it draws is the important part: the sheet at
 * /frontier is an **instrument** — a camera, hover, focus, keyboard
 * traversal, a legend, a trailhead — and this is a **figure**. A key map
 * printed in a report. It has the same geometry and none of the machinery.
 *
 * Which means it is deliberately not a second copy of FrontierMap. It shares
 * what makes it recognisable — `trails` and `locations`, the identical arcs
 * off the identical coordinates — and nothing else. No terrain, no hachures,
 * no contours, no river, no atmosphere. Those are the parts of the sheet that
 * make it worth standing in front of, and at figure scale they are noise.
 *
 * Server-rendered, no state, no client JavaScript at all.
 *
 * And no links either, which is deliberate and is the reason `role="img"` is
 * safe here. That role makes an element a *leaf* in the accessibility tree —
 * its children stop existing for assistive technology — so a figure with
 * markers inside it would be a set of controls a screen reader could never
 * reach. This project has made that mistake before. Every destination drawn
 * here is reachable from the book's own bookmarks, from the trail indicator
 * and from the survey sheet itself; the figure states the shape of the route
 * and claims nothing about being the way along it.
 */
export function SheetReference({ caption, className }: SheetReferenceProps) {
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(" ")}>
      <div className={styles.sheet}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
          role="img"
          /*
            role="img" makes this a leaf in the accessibility tree — its
            children stop existing for assistive technology, which is exactly
            right here and would be a bug if the markers were the only way to
            reach these routes. They are not: the book's bookmarks, the trail
            indicator and the survey sheet itself all carry the same
            destinations, and the caption below names what this is.
          */
          aria-label={`Key map of the survey: ${locations.length} locations and the trail between them.`}
        >
          {trails.map((trail) => (
            <path
              key={trail.id}
              className={styles.trail}
              data-kind={trail.kind}
              d={trail.path}
            />
          ))}

          {locations.map((location) => (
            <g
              key={location.id}
              className={styles.node}
              transform={`translate(${location.coord[0]} ${location.coord[1]})`}
            >
              <circle className={styles.disc} r={26} />
              <g className={styles.glyph}>
                <LocationGlyph symbol={location.symbol} scale={0.9} strokeWidth={2.6} />
              </g>
              <text className={styles.label} y={66} textAnchor="middle">
                {location.label.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
