"use client";

import { motion, useReducedMotion } from "motion/react";
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
import { directionForKey, nearestInDirection } from "@/lib/map/navigation";
import { SHEET_HEIGHT, SHEET_WIDTH } from "@/lib/map/terrain";
import { completeEntry } from "@/lib/motion/entry";
import { survey } from "@/lib/motion/variants";
import { LocationNode, type NodeRef } from "./LocationNode";
import { MapLayer } from "./MapLayer";
import { MapLegend } from "./MapLegend";
import { MobileTrail } from "./MobileTrail";
import { Trail } from "./Trail";
import styles from "./FrontierMap.module.css";

/**
 * Interaction state.
 *
 *   initial            the entry sequence is still playing
 *   exploring          at rest, nothing under the pointer
 *   location-focused   a location is hovered or keyboard-focused
 *   location-active    a location has been engaged; the camera is travelling
 *
 * None of it reaches the URL. The URL says where the visitor is; this says
 * what they are doing there. Hover, focus, camera and selection therefore
 * create no history entries — only following a marker's link does.
 */
type MapState = "initial" | "exploring" | "location-focused" | "location-active";

export function FrontierMap() {
  const prefersReducedMotion = useReducedMotion();

  const [state, setState] = useState<MapState>("exploring");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [engagedId, setEngagedId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const nodeRefs = useRef<Array<NodeRef>>([]);

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

  /* --- hover and focus ---------------------------------------------------- */

  const enter = useCallback((id: string) => {
    setActiveId((current) => (current === id ? current : id));
    setState((s) => (s === "location-active" ? s : "location-focused"));
  }, []);

  const leave = useCallback(() => {
    setActiveId(null);
    setState((s) => (s === "location-active" ? s : "exploring"));
  }, []);

  /**
   * Engaging a location starts the camera and the active treatment. It does
   * not navigate and it does not delay navigation — the marker is a real link,
   * and the browser follows it while this plays alongside.
   */
  const engage = useCallback((id: string) => {
    setEngagedId(id);
    setState("location-active");
  }, []);

  /* --- roving tabindex, traversed by geography ---------------------------- */

  const focusAt = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, locations.length - 1));
    setFocusIndex(clamped);
    nodeRefs.current[clamped]?.focus();
  }, []);

  const onNodeKeyDown = useCallback(
    (event: KeyboardEvent, index: number) => {
      if (event.key === "Escape") {
        event.preventDefault();
        (event.currentTarget as HTMLElement | SVGElement).blur();
        leave();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusAt(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        focusAt(locations.length - 1);
        return;
      }

      // Enter and Space are left to the browser on a real link; on an unmapped
      // marker there is nothing to activate, so they do nothing either.
      const direction = directionForKey(event.key);
      if (!direction) return;

      const next = nearestInDirection(locations[index], locations, direction);
      if (!next) return;

      event.preventDefault();
      focusAt(locations.findIndex((l) => l.id === next.id));
    },
    [focusAt, leave],
  );

  const onNodeFocus = useCallback(
    (event: FocusEvent, index: number, id: string) => {
      void event;
      setFocusIndex(index);
      enter(id);
    },
    [enter],
  );

  /* --- derived ------------------------------------------------------------ */

  const litTrails = useMemo(() => {
    const id = engagedId ?? activeId;
    if (!id) return new Set<string>();
    return new Set(trailsTouching(id));
  }, [activeId, engagedId]);

  const camera: Camera = useMemo(() => {
    if (prefersReducedMotion) return RESTING_CAMERA;
    if (state === "location-active" && engagedId) {
      const location = locations.find((l) => l.id === engagedId);
      if (location) return cameraFor(location.coord);
    }
    return RESTING_CAMERA;
  }, [engagedId, prefersReducedMotion, state]);

  const noted: NavigationLocation | null = useMemo(() => {
    if (!activeId) return null;
    return locations.find((l) => l.id === activeId) ?? null;
  }, [activeId]);

  /**
   * Where the field note sits relative to its marker: clear of that marker's
   * own label plate (taller for Journal, which is drawn heavier) and inside
   * the sheet. It flips above the marker in the lower half, and anchors its
   * near edge rather than its centre close to a side.
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

    return {
      left: `${xPct}%`,
      top: `${top}%`,
      transform: `translate(${xPct > 72 ? "-100%" : xPct < 26 ? "0%" : "-50%"}, ${
        below ? "0%" : "-100%"
      })`,
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
            aria-label="Frontier survey map. Six locations; arrow keys move to the nearest location in that direction."
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
                      <path
                        d="M 0 1 L 9 5 L 0 9"
                        fill="none"
                        stroke="var(--map-hand)"
                        strokeWidth="1.6"
                      />
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
                      active={engagedId === location.id}
                      tabIndex={focusIndex === index ? 0 : -1}
                      anchorRef={(el) => {
                        nodeRefs.current[index] = el;
                      }}
                      onEnter={enter}
                      onLeave={leave}
                      onFocus={(event) => onNodeFocus(event, index, location.id)}
                      onKeyDown={(event) => onNodeKeyDown(event, index)}
                      onEngage={engage}
                    />
                  ))}
                </MapLayer>
              </motion.g>
            </g>
          </svg>

          {/* The small paper annotation beside a location. Its content is
              duplicated in the index below, so nothing here is hover-only. */}
          {noted && notePlacement ? (
            <div className={styles.fieldNote} style={notePlacement} aria-hidden="true">
              <span className={styles.fieldNoteTag}>
                {noted.status === "surveying" ? "Unmapped" : "Field note"}
              </span>
              <p className={styles.fieldNoteBody}>{noted.description}</p>
              {noted.status === "surveying" ? (
                <p className={styles.fieldNoteStatus}>
                  Survey in progress — no record filed yet.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className={styles.hint}>
          Hover or tab a location. Arrow keys move to the nearest location in that
          direction; Enter opens it; Escape dismisses the note.
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
