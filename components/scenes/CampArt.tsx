"use client";

import { useObjectState } from "@/components/scene/SceneContext";
import { SceneLayer } from "@/components/scene/SceneLayer";
import { terrain } from "@/lib/map/terrain";
import {
  CAMP_HEIGHT,
  CAMP_PRINT,
  CAMP_WIDTH,
  type CampObjectId,
  SMOKE_PLUMES,
  buildGroundScatter,
  buildLoosePapers,
  buildStars,
  buildTreeline,
  objectTransform,
  printImageBox,
  printMatrixValues,
} from "@/lib/world/camp";
import styles from "./CampArt.module.css";

const TREES = buildTreeline();
const STARS = buildStars();
const SCATTER = buildGroundScatter();
const PAPERS = buildLoosePapers();
const PRINT_BOX = printImageBox();

/**
 * One object on the table, and how it is lying.
 *
 * The outer group carries the placement, which comes off the same record the
 * hit area does. The inner group carries the state, and has no transform
 * attribute of its own — a CSS transform replaces an SVG one rather than
 * composing with it, so an object that lifted on hover would jump to the
 * origin as it did so.
 */
function CampObject({
  id,
  rotate,
  children,
}: {
  id: CampObjectId;
  rotate: number;
  children: React.ReactNode;
}) {
  const state = useObjectState(id);

  return (
    <g transform={objectTransform(id, rotate)}>
      <g className={styles.lift} data-state={state}>
        {children}
      </g>
    </g>
  );
}

/**
 * The camp, as a place.
 *
 * Eight bands from the stars down to the table, each one a SceneLayer with a
 * real depth rather than a hand-written transform. That is the whole of what
 * changed here: this scene was built before the engine was, and carried its
 * own copy of the parallax model — three classes that happened to reference
 * the depth tokens, and a stage that happened to write --px.
 *
 * One band deliberately has no layer at all: the table. Everything else in
 * the frame drifts under the pointer; the plane the visitor actually reaches
 * into does not, and it cannot, because the art is in SVG user units and the
 * hit areas are in CSS pixels. A shared depth would be two different
 * distances, and the objects would slide out from under their own controls —
 * which is precisely what the version before this one did.
 */
export function CampArt() {
  return (
    <svg
      className={styles.art}
      viewBox={`0 0 ${CAMP_WIDTH} ${CAMP_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="campSky" x1="0" y1="0" x2="0" y2="1">
          {/* Blue hour. The afterglow sits low, just above where the ridges
              cut it, and the band below cools again into haze — the same
              order the rendered camp's sky is built in, from the same
              values in globals.css. */}
          <stop offset="0%" stopColor="var(--camp-sky-zenith)" />
          <stop offset="46%" stopColor="var(--camp-sky-high)" />
          <stop offset="74%" stopColor="var(--camp-sky-mid)" />
          <stop offset="88%" stopColor="var(--camp-sky-afterglow)" />
          <stop offset="100%" stopColor="var(--camp-sky-haze)" />
        </linearGradient>

        <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--fire-glow)" />
          <stop offset="42%" stopColor="var(--fire-glow-mid)" />
          <stop offset="100%" stopColor="var(--fire-glow-edge)" />
        </radialGradient>

        <linearGradient id="tableTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--timber-light)" />
          <stop offset="100%" stopColor="var(--timber-deep)" />
        </linearGradient>

        <filter id="smokeBlur">
          <feGaussianBlur stdDeviation="9" />
        </filter>

        <filter id="nearBlur">
          <feGaussianBlur stdDeviation="5" />
        </filter>

        {/* The print on the table, printed into this world: desaturated,
            re-warmed toward the earth range, and its black point lifted the
            way an aged print's is. Done in SVG rather than CSS because the
            photograph lives inside the scene's coordinate space. */}
        <filter id="campPrint" colorInterpolationFilters="sRGB">
          {/* The print treatment, shared with the rendered camp. Both
              photographs are the same photograph; see CAMP_PRINT. */}
          <feColorMatrix type="matrix" values={printMatrixValues()} />
        </filter>

        <clipPath id="campPhotoWindow">
          <rect
            x={CAMP_PRINT.window.x}
            y={CAMP_PRINT.window.y}
            width={CAMP_PRINT.window.w}
            height={CAMP_PRINT.window.h}
          />
        </clipPath>

        <linearGradient id="campSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--fire-glow-mid)" />
          <stop offset="54%" stopColor="transparent" />
          <stop offset="100%" stopColor="var(--scene-depth-5)" />
        </linearGradient>

        <linearGradient id="campNearShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(7, 6, 5, 0)" />
          <stop offset="100%" stopColor="rgba(7, 6, 5, 0.55)" />
        </linearGradient>

        <radialGradient id="campVignette" cx="50%" cy="48%" r="72%">
          <stop offset="52%" stopColor="rgba(7, 6, 5, 0)" />
          <stop offset="100%" stopColor="rgba(7, 6, 5, 0.42)" />
        </radialGradient>
      </defs>

      {/* --- 0 · sky ---------------------------------------------------- */}
      <SceneLayer depth={0} name="sky" verticalRatio={0.14} className={styles.sky}>
        <rect x="0" y="0" width={CAMP_WIDTH} height={CAMP_HEIGHT} fill="url(#campSky)" />
        {STARS.map((s, i) => (
          <circle
            key={`star-${i}`}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="var(--color-white-warm)"
            opacity={s.o}
          />
        ))}
      </SceneLayer>

      {/* --- 1 · the country, borrowed from the survey's own mountains --- */}
      <SceneLayer depth={1} name="ridge" verticalRatio={0.2} className={styles.ridge}>
        <path d={terrain.mountains.silhouettes[0]} transform="translate(0 -120) scale(1 0.62)" />
        <path
          className={styles.ridgeNear}
          d={terrain.mountains.silhouettes[1]}
          transform="translate(0 -60) scale(1 0.58)"
        />
      </SceneLayer>

      {/* --- 2-4 · treeline, thinning and darkening toward the camp ----- */}
      {[0, 1, 2].map((band) => (
        <SceneLayer
          key={`trees-${band}`}
          depth={(band + 2) as 2 | 3 | 4}
          name={`trees-${band}`}
          verticalRatio={0.24 + band * 0.05}
          className={styles[`trees${band}` as "trees0"]}
        >
          {TREES.filter((t) => t.band === band).map((t, i) => (
            <path key={`t-${band}-${i}`} d={t.d} />
          ))}
        </SceneLayer>
      ))}

      {/* --- 4 · the fire's light, and the tent it falls on -------------- */}
      <SceneLayer depth={4} name="camp" verticalRatio={0.3}>
        <ellipse
          className={styles.groundGlow}
          cx="650"
          cy="600"
          rx="520"
          ry="190"
          fill="url(#fireGlow)"
        />

        <g className={styles.scatter}>
          {SCATTER.map((s, i) => (
            <path
              key={`scatter-${i}`}
              className={s.kind === "stone" ? styles.stone : styles.tuft}
              d={s.d}
            />
          ))}
        </g>

        <g className={styles.tent}>
          <path d="M 200 596 L 372 366 L 544 596 Z" />
          <path className={styles.tentDark} d="M 372 366 L 452 596 L 544 596 Z" />
          <path className={styles.tentMouth} d="M 372 596 L 372 432 L 424 596 Z" />
          <path
            className={styles.tentLine}
            d="M 372 366 L 372 596 M 372 366 l 96 -26 M 544 596 l 54 18"
          />
        </g>
      </SceneLayer>

      {/* --- 5 · what stands between the fire and the table -------------- */}
      <SceneLayer depth={5} name="fire" verticalRatio={0.32}>
        {/* The chair. Nobody is in it, which is the point: the camp is
            occupied by whoever is reading the table. */}
        <g className={styles.chair} transform="translate(1206 648)">
          <path className={styles.chairLeg} d="M -58 0 L -18 -96 M 58 0 L 18 -96 M -52 -14 L 52 -14" />
          <path className={styles.chairSeat} d="M -62 -92 q 62 26 124 0 l -6 22 q -56 22 -112 0 Z" />
          <path className={styles.chairBack} d="M -46 -96 L -38 -184 q 38 -14 76 0 l 8 88" />
          <path className={styles.chairFrame} d="M -46 -96 L -38 -184 M 46 -96 L 38 -184" />
        </g>

        <g className={styles.smoke} filter="url(#smokeBlur)">
          {SMOKE_PLUMES.map((d, i) => (
            <path key={`smoke-${i}`} d={d} className={styles[`plume${i}` as "plume0"]} />
          ))}
        </g>

        <g className={styles.fire}>
          <ellipse className={styles.embers} cx="650" cy="586" rx="62" ry="16" />
          <path className={styles.log} d="M 596 590 l 108 -16 M 600 578 l 100 18" />
          <path
            className={styles.flameOuter}
            d="M 650 582 q -34 -40 -8 -78 q 10 30 26 36 q -8 -44 16 -72 q 2 42 24 62 q 16 24 -2 52 Z"
          />
          <path
            className={styles.flameInner}
            d="M 650 580 q -18 -26 -2 -52 q 6 20 16 24 q -4 -26 12 -44 q 0 28 12 42 q 10 16 -2 30 Z"
          />
        </g>
      </SceneLayer>

      {/*
        The table. No SceneLayer, on purpose — see the note on this component.
        This is the plane the visitor reaches into, and it holds still.
      */}
      <g className={styles.table}>
        <path d="M -40 656 L 1640 656 L 1640 940 L -40 940 Z" fill="url(#tableTop)" />
        <path className={styles.tableEdge} d="M -40 660 L 1640 660" />
        <path
          className={styles.grain}
          d="M 40 706 H 1560 M 90 758 H 1520 M 20 812 H 1580 M 120 870 H 1470"
        />
      </g>

      {/* Paper that has accumulated, in the gaps between the four things
          that matter. Inert: no content, no pointer events, no label. */}
      <g className={styles.papers}>
        {PAPERS.map((p, i) => (
          <g key={`paper-${i}`} transform={`translate(${p.x} ${p.y}) rotate(${p.rotate})`}>
            <rect
              className={styles.paperSheet}
              x={-p.w / 2}
              y={-p.h / 2}
              width={p.w}
              height={p.h}
            />
            <path
              className={styles.paperRule}
              d={Array.from({ length: p.rules }, (_, r) => {
                const y = -p.h / 2 + 22 + r * 20;
                return `M ${-p.w / 2 + 16} ${y} h ${p.w - 42}`;
              }).join(" ")}
            />
          </g>
        ))}
      </g>

      <g className={styles.objects}>
        {/* Notebook */}
        <CampObject id="notebook" rotate={-2.4}>
          <rect className={styles.bookPages} x="-146" y="-72" width="292" height="140" rx="3" />
          <rect className={styles.bookCover} x="-152" y="-78" width="292" height="140" rx="4" />
          <path className={styles.bookSpine} d="M -152 -78 v 140" />
          <path className={styles.bookRibbon} d="M 92 -78 v 170 l -13 -18 l -13 18 v -170 Z" />
          <path className={styles.bookMark} d="M -96 -18 h 120 M -96 4 h 86" />
        </CampObject>

        {/* Photograph */}
        <CampObject id="photograph" rotate={3.6}>
          <rect className={styles.photoMat} x="-84" y="-64" width="168" height="132" />
          <rect className={styles.photoImage} x="-70" y="-50" width="140" height="92" />
          {/* The actual print, at the size a print on a table actually is.
              aria-hidden because the scene is decorative throughout — the
              same photograph carries a real alt in the record it opens. */}
          <image
            href={CAMP_PRINT.src}
            x={PRINT_BOX.x}
            y={PRINT_BOX.y}
            width={PRINT_BOX.w}
            height={PRINT_BOX.h}
            clipPath="url(#campPhotoWindow)"
            filter="url(#campPrint)"
            aria-hidden="true"
          />
          <rect
            className={styles.photoSheen}
            x={CAMP_PRINT.window.x}
            y={CAMP_PRINT.window.y}
            width={CAMP_PRINT.window.w}
            height={CAMP_PRINT.window.h}
          />
        </CampObject>

        {/* Field notes */}
        <CampObject id="notes" rotate={-1.4}>
          <rect
            className={styles.noteSheet}
            x="-92"
            y="-58"
            width="184"
            height="122"
            transform="rotate(-3)"
          />
          <rect
            className={styles.noteSheet}
            x="-88"
            y="-62"
            width="184"
            height="122"
            transform="rotate(2)"
          />
          <rect className={styles.noteTop} x="-90" y="-60" width="184" height="122" />
          <path
            className={styles.noteRule}
            d="M -66 -28 h 136 M -66 -6 h 136 M -66 16 h 108 M -66 38 h 124"
          />
          <path className={styles.noteInk} d="M -66 -46 h 58" />
        </CampObject>

        {/* Folded map */}
        <CampObject id="map" rotate={2.2}>
          <rect className={styles.mapSheet} x="-108" y="-70" width="216" height="146" />
          <path className={styles.mapFold} d="M -36 -70 v 146 M 36 -70 v 146" />
          <path
            className={styles.mapInk}
            d="M -86 26 q 40 -34 86 -14 q 44 20 84 -20 M -86 -22 q 46 -12 74 -34"
          />
          <path className={styles.mapTrail} d="M -72 46 q 52 -40 96 -30 q 46 10 82 -46" />
          <circle className={styles.mapPin} cx="-72" cy="46" r="5" />
          <circle className={styles.mapPin} cx="106" cy="-30" r="5" />
        </CampObject>
      </g>

      {/* --- 6 · foreground --------------------------------------------- */}
      <SceneLayer depth={6} name="near" verticalRatio={0.34}>
        {/* An enamel mug, too close to the eye to be in focus and half out of
            frame. It is the only thing here that is not on the table, and
            that is what makes the table a place you are sitting at. */}
        <g className={styles.mug} filter="url(#nearBlur)">
          <path d="M -40 940 L -40 786 q 0 -26 30 -26 h 104 q 30 0 30 26 v 154 Z" />
          <path
            className={styles.mugHandle}
            d="M 124 812 q 58 4 58 46 q 0 42 -58 46"
          />
          <path className={styles.mugRim} d="M -40 792 h 164" />
          {/* Backlit. The fire is off to the right, so that is the edge that
              catches — without it the mug is a dark shape on a dark table. */}
          <path className={styles.mugLight} d="M 132 800 v 140" />
        </g>
      </SceneLayer>

      {/* The near edge of the table falling away, and the light falling off
          at the corners. Both lens, neither mood. */}
      <rect className={styles.nearShadow} x="0" y={CAMP_HEIGHT - 110} width={CAMP_WIDTH} height="110" />
      <rect className={styles.haze} x="0" y="0" width={CAMP_WIDTH} height={CAMP_HEIGHT} />
    </svg>
  );
}
