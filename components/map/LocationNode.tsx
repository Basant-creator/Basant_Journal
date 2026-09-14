import Link from "next/link";
import type { CSSProperties, FocusEvent, KeyboardEvent, ReactNode } from "react";
import type { NavigationLocation } from "@/lib/content/types";
import { triggerSurveyTick } from "@/lib/audio/atmosphere";
import { LocationGlyph } from "./symbols";
import styles from "./LocationNode.module.css";

export type NodeRef = HTMLElement | SVGElement | null;

interface LocationNodeProps {
  location: NavigationLocation;
  index: number;
  hovered: boolean;
  /** Engaged: pointer is down on it, or it has just been activated. */
  active: boolean;
  tabIndex: number;
  anchorRef?: (element: NodeRef) => void;
  onEnter: (id: string) => void;
  onLeave: () => void;
  onFocus: (event: FocusEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onEngage: (id: string) => void;
}

const BASE_RADIUS = 30;
const TOUCH_RADIUS = 46;

/**
 * A surveyed location.
 *
 * Two render modes, chosen by the content model's `status`:
 *
 *   mapped     a real link to the location's canonical route
 *   surveying  focusable, describable, and deliberately inert — no fake URL
 *
 * Promoting a location is a one-word change in portfolio.json; nothing here
 * needs rewriting.
 *
 * Every state differs by ring weight, fill and label plate as well as colour,
 * because nothing may be conveyed by colour alone. The label is legible at
 * rest; only the supporting note is revealed on hover, and that note also
 * lives in the index, so no information is hover-only.
 */
export function LocationNode({
  location,
  index,
  hovered,
  active,
  tabIndex,
  anchorRef,
  onEnter,
  onLeave,
  onFocus,
  onKeyDown,
  onEngage,
}: LocationNodeProps) {
  const [x, y] = location.coord;
  const weight = location.weight ?? 1;
  const radius = BASE_RADIUS * weight;
  const glyphScale = weight === 1 ? 1 : 1.3;
  const labelSize = 19 * (weight === 1 ? 1 : 1.18);
  const unmapped = location.status === "surveying";

  const labelY = radius + 34;
  const plateWidth = Math.max(location.label.length * labelSize * 0.78 + 44, 124);

  const classes = [
    styles.node,
    hovered ? styles.hovered : "",
    active ? styles.active : "",
    unmapped ? styles.unmapped : "",
  ]
    .filter(Boolean)
    .join(" ");

  const marker: ReactNode = (
    <>
      {/* SVG <title> takes exactly one text child. */}
      <title>{`${location.label} — ${location.section}${
        unmapped ? " (survey in progress)" : ""
      }`}</title>

      {/* Touch target, independent of the drawn marker. */}
      <circle className={styles.hit} r={TOUCH_RADIUS} />

      <circle className={styles.halo} r={radius + 12} />
      <circle className={styles.ring} r={radius} />
      <circle className={styles.core} r={weight === 1 ? 3.6 : 4.6} />

      <g className={styles.glyph}>
        <LocationGlyph symbol={location.symbol} scale={glyphScale} strokeWidth={1.8} />
      </g>

      <rect
        className={styles.plate}
        x={-plateWidth / 2}
        y={labelY - 30}
        width={plateWidth}
        height={48}
        rx={2}
      />

      <text className={styles.label} y={labelY} textAnchor="middle" fontSize={labelSize}>
        {location.label.toUpperCase()}
      </text>
      <text className={styles.section} y={labelY + 17} textAnchor="middle">
        {(unmapped ? "Unmapped" : location.section).toUpperCase()}
      </text>
    </>
  );

  const shared = {
    className: classes,
    tabIndex,
    onMouseEnter: () => onEnter(location.id),
    onMouseLeave: onLeave,
    onFocus,
    onBlur: onLeave,
    onKeyDown,
  };

  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ "--node-delay": `${900 + index * 70}ms` } as CSSProperties}
    >
      {unmapped ? (
        // Focusable and described, but it goes nowhere: a marker on the ground
        // whose record has not been written yet.
        <g
          {...shared}
          role="link"
          aria-disabled="true"
          ref={anchorRef as (el: SVGGElement | null) => void}
        >
          {marker}
        </g>
      ) : (
        <Link
          {...shared}
          href={location.route}
          ref={anchorRef as (el: HTMLAnchorElement | null) => void}
          aria-current={active ? "true" : undefined}
          // Engage on pointer down so the active treatment and the camera are
          // already moving as the route change starts. Navigation is never
          // delayed waiting for either.
          onPointerDown={() => {
            triggerSurveyTick();
            onEngage(location.id);
          }}
        >
          {marker}
        </Link>
      )}
    </g>
  );
}
