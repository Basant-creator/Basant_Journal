"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TerrainLayer } from "@/components/terrain/TerrainLayer";
import { locations, primaryLocationId } from "@/lib/content/portfolio";
import type { NavigationLocation } from "@/lib/content/types";
import {
  type Camera,
  RESTING_CAMERA,
  cameraFor,
  trails,
  trailsTouching,
} from "@/lib/map/locations";
import { SHEET_HEIGHT, SHEET_WIDTH } from "@/lib/map/terrain";
import { completeEntry } from "@/lib/motion/entry";
import { survey } from "@/lib/motion/variants";
import { LocationNode } from "./LocationNode";
import { MapLayer } from "./MapLayer";
import { MapLegend } from "./MapLegend";
import { MobileTrail } from "./MobileTrail";
import { Trail } from "./Trail";
import styles from "./FrontierMap.module.css";

/**
 * The interaction state model.
 *
 *   initial            the entry sequence is still playing
 *   exploring          at rest, nothing under the pointer
 *   location-focused   a location is hovered or keyboard-focused
 *   location-selected  a location has been chosen; the camera is travelling
 *
 * `professional-mode`, `reduced-motion` and `mobile` are deliberately not in
 * this union — they are a route, a media query and a media query
 * respectively, and modelling them as app state would mean duplicating
 * something the platform already tracks.
 */
type MapState = "initial" | "exploring" | "location-focused" | "location-selected";

/** How long the camera travels before the route actually changes. */
const TRAVEL_MS = 520;

export function FrontierMap() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [state, setState] = useState<MapState>("exploring");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const anchorRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const travelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primary = useMemo(
    () => locations.find((l) => l.id === primaryLocationId) ?? null,
    [],
  );

  /* --- entry: complete on any interaction, and remember the visit --------- */
  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-entry") !== "play") {
      completeEntry();
      return;
    }

    setState("initial");
    const done = () => {
      completeEntry();
      setState((s) => (s === "initial" ? "exploring" : s));
    };

    const timer = setTimeout(done, 2100);
    const skip = () => {
      clearTimeout(timer);
      done();
    };

    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
  }, []);

  useEffect(
    () => () => {
      if (travelTimer.current) clearTimeout(travelTimer.current);
    },
    [],
  );

  /* --- hover and focus ---------------------------------------------------- */

  const enter = useCallback((id: string) => {
    setActiveId((current) => (current === id ? current : id));
    setState((s) => (s === "location-selected" ? s : "location-focused"));
  }, []);

  const leave = useCallback(() => {
    setActiveId(null);
    setState((s) => (s === "location-selected" ? s : "exploring"));
  }, []);

  /* --- selection: the camera travels, then the route changes -------------- */

  const select = useCallback(
    (id: string) => {
      const location = locations.find((l) => l.id === id);
      if (!location) return;

      setSelectedId(id);
      setState("location-selected");

      if (prefersReducedMotion) {
        router.push(location.route);
        return;
      }

      if (travelTimer.current) clearTimeout(travelTimer.current);
      travelTimer.current = setTimeout(() => {
        router.push(location.route);
      }, TRAVEL_MS);
    },
    [prefersReducedMotion, router],
  );

  /* --- roving tabindex: the map is one composite widget ------------------- */

  const moveFocus = useCallback((next: number) => {
    const clamped = (next + locations.length) % locations.length;
    setFocusIndex(clamped);
    anchorRefs.current[clamped]?.focus();
  }, []);

  const onNodeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveFocus(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveFocus(index - 1);
          break;
        case "Home":
          event.preventDefault();
          moveFocus(0);
          break;
        case "End":
          event.preventDefault();
          moveFocus(locations.length - 1);
          break;
        case "Escape":
          event.preventDefault();
          event.currentTarget.blur();
          leave();
          break;
        default:
          break;
      }
    },
    [leave, moveFocus],
  );

  const onNodeFocus = useCallback(
    (event: FocusEvent<HTMLAnchorElement>, index: number, id: string) => {
      void event;
      setFocusIndex(index);
      enter(id);
    },
    [enter],
  );

  /* --- derived ------------------------------------------------------------ */

  const litTrails = useMemo(() => {
    const id = selectedId ?? activeId;
    if (!id) return new Set<string>();
    return new Set(trailsTouching(id));
  }, [activeId, selectedId]);

  const camera: Camera = useMemo(() => {
    if (prefersReducedMotion) return RESTING_CAMERA;
    if (state === "location-selected" && selectedId) {
      const location = locations.find((l) => l.id === selectedId);
      if (location) return cameraFor(location.coord);
    }
    return RESTING_CAMERA;
  }, [prefersReducedMotion, selectedId, state]);

  const noted: NavigationLocation | null = useMemo(() => {
    if (!activeId || state === "location-selected") return null;
    return locations.find((l) => l.id === activeId) ?? null;
  }, [activeId, state]);

  /**
   * Where the field note sits relative to its marker.
   *
   * It has to clear the marker's own label plate — which is taller for
   * Journal, because Journal is drawn heavier — and stay inside the sheet.
   * So it flips above the marker in the lower half, and anchors its near edge
   * rather than its centre when the marker is close to a side.
   */
  const notePlacement = useMemo(() => {
    if (!noted) return null;

    const [x, y] = noted.coord;
    const radius = 30 * (noted.weight ?? 1);
    const below = y < 620;
    const xPct = (x / SHEET_WIDTH) * 100;

    const top = below
      ? ((y + radius + 92) / SHEET_HEIGHT) * 100
      : ((y - radius - 30) / SHEET_HEIGHT) * 100;

    const tx = xPct > 72 ? "-100%" : xPct < 26 ? "0%" : "-50%";
    const ty = below ? "0%" : "-100%";

    return {
      left: `${xPct}%`,
      top: `${top}%`,
      transform: `translate(${tx}, ${ty})`,
    };
  }, [noted]);

  return (
    <div className={styles.layout}>
      {/* ================= desktop and tablet: the survey sheet ============ */}
      <div className={styles.sheetColumn}>
        <div className={styles.sheet}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
            role="navigation"
            aria-label="Frontier survey map. Seven locations; use arrow keys to move between them."
          >
            {/* Outer group: the entry settle, in CSS so it cannot fight Motion. */}
            <g className={styles.settle}>
              {/* Inner group: the interactive camera. */}
              <motion.g
                className={styles.camera}
                animate={{ x: camera.x, y: camera.y, scale: camera.scale }}
                initial={false}
                transition={survey}
              >
                <TerrainLayer />

                <MapLayer name="trails">
                  {trails.map((trail) => (
                    <Trail key={trail.id} trail={trail} lit={litTrails.has(trail.id)} />
                  ))}
                </MapLayer>

                {/* ---- THE HAND: someone walked this and wrote on it ------ */}
                <MapLayer name="annotations" className={styles.hand}>
                  <text className={styles.handText} x={84} y={672} textAnchor="start">
                    START HERE
                  </text>
                  <path
                    className={styles.handMark}
                    d="M 196 682 Q 236 694 262 699"
                    markerEnd="url(#handArrow)"
                  />

                  {primary ? (
                    <ellipse
                      className={styles.handRing}
                      cx={primary.coord[0]}
                      cy={primary.coord[1]}
                      rx={74}
                      ry={62}
                      transform={`rotate(-8 ${primary.coord[0]} ${primary.coord[1]})`}
                    />
                  ) : null}

                  <text
                    className={styles.handText}
                    x={520}
                    y={642}
                    textAnchor="middle"
                    transform="rotate(-25 520 642)"
                  >
                    PRIMARY TRAIL
                  </text>

                  <g className={styles.handMark}>
                    <path d="M 372 690 l 10 -18 M 402 676 l 10 -18" />
                  </g>
                  <text
                    className={styles.handNote}
                    x={392}
                    y={706}
                    textAnchor="middle"
                    transform="rotate(-25 392 706)"
                  >
                    4.2 mi
                  </text>

                  <defs>
                    <marker
                      id="handArrow"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="var(--map-hand)" strokeWidth="1.6" />
                    </marker>
                  </defs>
                </MapLayer>

                {/* ---- interaction layer --------------------------------- */}
                <MapLayer name="locations" interactive>
                  {locations.map((location, index) => (
                    <LocationNode
                      key={location.id}
                      location={location}
                      index={index}
                      hovered={activeId === location.id}
                      selected={selectedId === location.id}
                      tabIndex={focusIndex === index ? 0 : -1}
                      anchorRef={(el) => {
                        anchorRefs.current[index] = el;
                      }}
                      onEnter={enter}
                      onLeave={leave}
                      onFocus={(event) => onNodeFocus(event, index, location.id)}
                      onKeyDown={(event) => onNodeKeyDown(event, index)}
                      onSelect={select}
                    />
                  ))}
                </MapLayer>
              </motion.g>
            </g>
          </svg>

          {/* The small paper annotation that appears beside a location.
              Its content is duplicated in the index below, so nothing here is
              hover-only. Hidden while the camera is travelling, because the
              overlay is positioned against the resting sheet. */}
          {noted && notePlacement ? (
            <div className={styles.fieldNote} style={notePlacement} aria-hidden="true">
              <span className={styles.fieldNoteTag}>Field note</span>
              <p className={styles.fieldNoteBody}>{noted.description}</p>
            </div>
          ) : null}
        </div>

        <p className={styles.hint}>
          Hover or tab a location. Arrow keys move along the trail; Enter travels.
        </p>
      </div>

      {/* ================= the non-spatial route ========================== */}
      <aside className={styles.indexColumn}>
        <MapLegend activeId={activeId} onHover={(id) => (id ? enter(id) : leave())} />
      </aside>

      {/* ================= mobile: a different composition ================ */}
      <div className={styles.mobile}>
        <MobileTrail />
      </div>
    </div>
  );
}
