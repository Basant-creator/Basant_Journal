"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Scene } from "@/components/scene/Scene";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { ThreeScene } from "@/components/three/ThreeScene";

/**
 * The country around the sheet, fetched rather than shipped.
 *
 * The vista and the foreground are the two heaviest things on this page and
 * the two least load-bearing: both are decorative, aria-hidden, propless, and
 * both sit inside a column that is display:none below 860px. A phone was
 * parsing every ridgeline and all 158 blades of scrub in order to show a list.
 *
 * Measured before changing anything: the hidden desktop composition was 63% of
 * this page's gzipped transfer on a phone.
 *
 * ssr:false keeps them out of the HTML; the width gate keeps the chunk itself
 * off phones, and with it the generation work — both modules build their
 * geometry at module scope, so a chunk never fetched is also a loop never run.
 *
 * What makes this free on desktop is the sheet's own 1.9s settle. The surround
 * arrives behind a sheet that is still arriving, over a stage that is already
 * painted its night colour, so there is nothing to see appearing.
 */
const MapVista = dynamic(() => import("./MapVista").then((m) => m.MapVista), {
  ssr: false,
});
const MapForeground = dynamic(
  () => import("./MapForeground").then((m) => m.MapForeground),
  { ssr: false },
);
import { TerrainLayer } from "@/components/terrain/TerrainLayer";
import { VISTA_HEIGHT, VISTA_WIDTH } from "@/lib/world/vista";
import {
  locations,
  meta,
  originLocationId,
  primaryLocationId,
} from "@/lib/content/portfolio";
import type { NavigationLocation } from "@/lib/content/types";
import {
  type Camera,
  RESTING_CAMERA,
  cameraFor,
  primaryTrail,
  primaryTrailArrows,
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
import { TrailheadAction } from "./TrailheadAction";
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
type MapState =
  "initial" | "exploring" | "location-focused" | "location-active";

export function FrontierMap() {
  const prefersReducedMotion = useReducedMotion();

  /* Matches the breakpoint that hides the sheet column in CSS. The two are
     the same decision and have to stay the same number. */
  const [surround, setSurround] = useState(false);

  const [state, setState] = useState<MapState>("exploring");
  // Camp is the initial active location — the sheet opens at the trailhead.
  const [activeId, setActiveId] = useState<string | null>(originLocationId);
  const [engagedId, setEngagedId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  /** The trail control is hovered or focused: the journey, previewed. */
  const [trailPreview, setTrailPreview] = useState(false);
  /** The journey itself is playing. */
  const [running, setRunning] = useState(false);

  const nodeRefs = useRef<Array<NodeRef>>([]);
  const trailTimers = useRef<number[]>([]);

  const primary = useMemo(
    () => locations.find((l) => l.id === primaryLocationId) ?? null,
    [],
  );

  /* The surround is desktop-only, so the gate is too. Same number as the CSS
     breakpoint that hides the sheet column, and the same decision. */
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 861px)");
    const sync = () => setSurround(wide.matches);
    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);

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

  /* --- following the trail ------------------------------------------------ */

  /**
   * The journey, on the map: Camp takes the emphasis, the primary trail
   * lights, the camera frames Camp and then walks it to the Journal, and the
   * world deepens around the move.
   *
   * It starts on pointer-down, so the map has begun to move before the
   * browser is asked for anything, and it does not touch navigation — the
   * control is a real link and the route change happens on its own schedule.
   * The paper wipe that carries the cut is announced separately, on the click
   * itself, because only a click knows whether it is actually navigating here.
   */
  const followTrail = useCallback(() => {
    if (trailTimers.current.length > 0) return;

    setRunning(true);
    setEngagedId(originLocationId);
    setState("location-active");

    trailTimers.current.push(
      window.setTimeout(() => setEngagedId(primaryLocationId), 300),
      // If no navigation follows — a link the browser declined, an offline
      // route — the map does not sit forever in a state that says it is on
      // its way somewhere.
      window.setTimeout(() => {
        trailTimers.current = [];
        setRunning(false);
        setEngagedId(null);
        setState("exploring");
      }, 2600),
    );
  }, []);

  useEffect(
    () => () => {
      for (const id of trailTimers.current) window.clearTimeout(id);
    },
    [],
  );

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
    const lit = new Set<string>();
    // Previewing the journey lights the route itself, and only that route —
    // the other trails that happen to touch its ends are not part of it.
    if (trailPreview && primaryTrail) lit.add(primaryTrail.id);

    const id = engagedId ?? activeId;
    if (id) for (const trail of trailsTouching(id)) lit.add(trail);

    return lit;
  }, [activeId, engagedId, trailPreview]);

  const camera: Camera = useMemo(() => {
    if (prefersReducedMotion) return RESTING_CAMERA;
    if (state === "location-active" && engagedId) {
      const location = locations.find((l) => l.id === engagedId);
      if (location) return cameraFor(location.coord);
    }
    return RESTING_CAMERA;
  }, [engagedId, prefersReducedMotion, state]);

  const noted: NavigationLocation | null = useMemo(() => {
    // Camp's annotation is the trailhead card, which is always on screen, so
    // it never also gets the generic hover note.
    if (!activeId || activeId === originLocationId) return null;
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
      {/* data-camera is the one thing the environment is told about the map's
          state: when the camera travels, the world deepens around it. It is an
          attribute rather than a prop so the reaction stays in CSS and costs
          no render. */}
      <div
        className={styles.sheetColumn}
        data-camera={state === "location-active" ? "active" : "rest"}
        data-trail={running ? "running" : undefined}
        data-preview={trailPreview ? "true" : undefined}
      >
        {/*
          THE SCENE.

          The map engine is untouched — same SVG, same camera, same markers,
          same keys. What changed is where it is: a frame of world around the
          sheet, with the sheet inset into it. The inset here and SHEET_INSET
          in lib/world/vista.ts are the same composition written twice, so the
          ridge crest lands on the sheet's top edge and the bank on its bottom
          one. Move one and you move both.

          entry={false} deliberately: the sheet already has a 1.9s settle of
          its own, and a second arrival animation stacked on the first is how
          a cinematic becomes a wait.
        */}
        <Scene
          className={styles.stage}
          width={VISTA_WIDTH}
          height={VISTA_HEIGHT}
          compactRatio={`${VISTA_WIDTH} / ${VISTA_HEIGHT}`}
          entry={false}
        >
          {/*
            The country, rendered where a machine can and drawn where it
            cannot — and the drawing is the same one either way.

            The width gate stays outside the door on purpose. ThreeScene
            would fall back to MapVista below 860px, and MapVista is itself a
            deferred chunk: letting it get that far would load the 20 kB of
            silhouettes back onto exactly the phones step 26 took it off.
            Narrow gets neither, which is what it got before and what it
            wants.

            label={null} because this is scenery. The sheet in front of it is
            already a described navigation region; announcing the ridges
            would put a picture between a reader and the map.
          */}
          {surround ? (
            <ThreeScene
              scene="vista"
              className={styles.vistaLayer}
              label={null}
              fallback={<MapVista />}
            />
          ) : null}

          {/* Air, behind the paper. The wrapper is what puts it there: it
              opens a stacking context so the atmosphere's own z-index is
              scoped inside this layer instead of floating over the map. */}
          <div className={styles.air}>
            <SceneAtmosphere variant="drift" />
          </div>

          <div className={styles.sheetHolder}>
            <div className={styles.sheet}>
              <svg
                className={styles.svg}
                viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
                role="navigation"
                /* Counted from the model, like every other statement of this
                   number. A screen reader announcing "six locations" over a
                   sheet carrying seven is a worse failure than the visible
                   copy making the same mistake, because nothing on screen
                   contradicts it. */
                aria-label={`Frontier survey map. ${locations.length} locations; arrow keys move to the nearest location in that direction.`}
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
                        <Trail
                          key={trail.id}
                          trail={trail}
                          lit={litTrails.has(trail.id)}
                        />
                      ))}
                    </MapLayer>

                    {/* ---- THE HAND: someone walked this and wrote on it ------ */}
                    <MapLayer name="annotations" className={styles.hand}>
                      {/* The arrow points from the trailhead card into Camp. The
                          words that used to sit here now live in that card, where
                          they can carry a real link. */}
                      <path
                        className={styles.handMark}
                        d="M 176 676 Q 224 692 262 699"
                        markerEnd="url(#handArrow)"
                      />

                      {/* Direction along the primary trail, stated by static marks
                          so it still reads with every animation switched off. */}
                      {primaryTrailArrows.map((point, i) => (
                        <path
                          key={`survey-arrow-${i}`}
                          className={styles.trailArrow}
                          d="M -7 -6 L 1.5 0 L -7 6"
                          transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${point.angle.toFixed(1)})`}
                        />
                      ))}

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

                    {/* The drawn trail responds to the pointer, but it is never
                        the only way in: the trailhead card below is the real
                        control, and it is keyboard and screen-reader reachable. */}
                    {primaryTrail ? (
                      <MapLayer name="trail-target" interactive>
                        {/* onMouseOver/onMouseOut rather than the Enter/Leave
                            pair: React synthesises enter/leave from the over/out
                            events, and that synthesis does not fire reliably for
                            an SVG <path> hit-tested by its stroke. The plain
                            bubbling events do. */}
                        <path
                          className={styles.trailTarget}
                          d={primaryTrail.path}
                          onMouseOver={() => enter(primaryLocationId)}
                          onMouseOut={leave}
                        />
                      </MapLayer>
                    ) : null}

                    {/* ---- interaction layer --------------------------------- */}
                    <MapLayer name="locations" interactive>
                      {locations.map((location, index) => (
                        <LocationNode
                          key={location.id}
                          location={location}
                          index={index}
                          hovered={
                            activeId === location.id ||
                            (trailPreview &&
                              (location.id === originLocationId ||
                                location.id === primaryLocationId))
                          }
                          active={engagedId === location.id}
                          tabIndex={focusIndex === index ? 0 : -1}
                          anchorRef={(el) => {
                            nodeRefs.current[index] = el;
                          }}
                          onEnter={enter}
                          onLeave={leave}
                          onFocus={(event) =>
                            onNodeFocus(event, index, location.id)
                          }
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
                <div
                  className={styles.fieldNote}
                  style={notePlacement}
                  aria-hidden="true"
                >
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
          </div>

          {surround ? <MapForeground /> : null}

          {/* The scene's title, in the film sense: a location card burned into
              the frame rather than a heading in the page. It sits in the
              bottom margin, over the stretch of ground the generator keeps
              short, and says what the sheet's own title block would say. The
              page header carries the same three facts in real markup, so this
              is decoration. */}
          <p className={styles.sceneCaption} aria-hidden="true">
            <span>The Frontier Territory</span>
            <span className={styles.captionRule} />
            <span>{meta.sheet}</span>
            <span className={styles.captionRule} />
            <span>Surveyed {meta.surveyed}</span>
          </p>
        </Scene>

        {/* THE TRAILHEAD.
            Camp carries two separate ideas: the marker is a location and leads
            to /about; this is the trailhead and leads to /projects. They are
            deliberately different objects, so neither is mistaken for the
            other.

            It sits beneath the sheet rather than on it. Pinned beside Camp it
            overlapped the marker's own hit area — the control for the journey
            would have been covering the location it points at, at some
            breakpoints blocking it entirely. Below the sheet it is always
            fully visible, never blocks the map, and cannot collide with a
            marker at any size. */}
        <div className={styles.trailhead}>
          <div className={styles.trailheadText}>
            <p className={styles.trailheadTag}>Camp · Trailhead</p>
            <p className={styles.trailheadBody}>
              Begin the survey. The primary trail runs from camp straight to the
              engineering work.
            </p>
          </div>
          <TrailheadAction
            className={styles.trailheadAction}
            onRun={followTrail}
            onPreviewChange={setTrailPreview}
          />
        </div>

        <p className={styles.hint}>
          Hover or tab a location. Arrow keys move to the nearest location in
          that direction; Enter opens it; Escape dismisses the note.
        </p>
      </div>

      {/* ================= the non-spatial route ========================== */}
      <aside className={styles.indexColumn}>
        <MapLegend
          activeId={activeId}
          onHover={(id) => (id ? enter(id) : leave())}
        />
      </aside>

      {/* ================= mobile: a different composition ================ */}
      <div className={styles.mobile}>
        <MobileTrail />
      </div>
    </div>
  );
}
