import Link from "next/link";
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import type { NavigationLocation } from "@/lib/content/types";
import { LocationGlyph } from "./symbols";
import styles from "./LocationNode.module.css";

interface LocationNodeProps {
  location: NavigationLocation;
  index: number;
  hovered: boolean;
  selected: boolean;
  tabIndex: number;
  /**
   * The marker is an SVG <a>, but next/link types its anchor as
   * HTMLAnchorElement. The DOM interfaces we actually use here — focus() and
   * blur() — exist on both, so the React types follow Link rather than
   * fighting it.
   */
  anchorRef?: (element: HTMLAnchorElement | null) => void;
  onEnter: (id: string) => void;
  onLeave: () => void;
  onFocus: (event: FocusEvent<HTMLAnchorElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
  onSelect: (id: string) => void;
}

const BASE_RADIUS = 30;
const TOUCH_RADIUS = 46;

/**
 * A surveyed location.
 *
 * Every state differs by shape and fill as well as colour — ring weight, a
 * filled centre, a label plate — because Phase 1's accessibility rule is that
 * nothing is conveyed by colour alone. The label is legible at rest; only the
 * supporting note is revealed on hover, and that note also lives in the
 * legend, so no information is hover-only.
 *
 * `weight` comes from the content model: Journal is 1.4, and that single
 * number is what makes the engineering work the loudest thing on the sheet.
 */
export function LocationNode({
  location,
  index,
  hovered,
  selected,
  tabIndex,
  anchorRef,
  onEnter,
  onLeave,
  onFocus,
  onKeyDown,
  onSelect,
}: LocationNodeProps) {
  const [x, y] = location.coord;
  const weight = location.weight ?? 1;
  const radius = BASE_RADIUS * weight;
  const glyphScale = weight === 1 ? 1 : 1.3;
  const labelSize = 19 * (weight === 1 ? 1 : 1.18);
  const unmapped = location.status === "surveying";

  const labelY = radius + 34;
  const plateWidth = Math.max(location.label.length * labelSize * 0.78 + 44, 124);
  const plateHeight = 48;

  const classes = [
    styles.node,
    hovered ? styles.hovered : "",
    selected ? styles.selected : "",
    unmapped ? styles.unmapped : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ "--node-delay": `${900 + index * 70}ms` } as CSSProperties}
    >
      <Link
        href={location.route}
        ref={anchorRef}
        className={classes}
        tabIndex={tabIndex}
        aria-current={selected ? "true" : undefined}
        onMouseEnter={() => onEnter(location.id)}
        onMouseLeave={onLeave}
        onFocus={onFocus}
        onBlur={onLeave}
        onKeyDown={onKeyDown}
        onClick={(event: MouseEvent) => {
          // Let modified clicks behave like normal links.
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          onSelect(location.id);
        }}
      >
        {/* SVG <title> must receive exactly one text child — React cannot
            flatten an array into a title node. */}
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
          height={plateHeight}
          rx={2}
        />

        <text className={styles.label} y={labelY} textAnchor="middle" fontSize={labelSize}>
          {location.label.toUpperCase()}
        </text>
        <text className={styles.section} y={labelY + 17} textAnchor="middle">
          {location.section.toUpperCase()}
        </text>
      </Link>
    </g>
  );
}
