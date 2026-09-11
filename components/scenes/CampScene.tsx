"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { TornPaper } from "@/components/world/TornPaper";
import {
  CAMP_HEIGHT,
  CAMP_OBJECTS,
  CAMP_WIDTH,
  type CampObjectId,
  SMOKE_PLUMES,
  buildStars,
  buildTreeline,
} from "@/lib/world/camp";
import { terrain } from "@/lib/map/terrain";
import styles from "./CampScene.module.css";

const TREES = buildTreeline();
const STARS = buildStars();

type RecordId = Exclude<CampObjectId, "map">;

interface EducationEntry {
  qualification: string;
  institution: string;
  period: string;
  place: string;
}

interface CampSceneProps {
  name: string;
  role: string;
  summary: string;
  interests: string[];
  education: EducationEntry[];
  mapHref: string;
}

const ORDER: RecordId[] = ["notebook", "photograph", "notes"];

const LABELS: Record<RecordId, { object: string; title: string; note: string }> = {
  notebook: {
    object: "Notebook",
    title: "The notebook",
    note: "Who is keeping this record",
  },
  photograph: {
    object: "Photograph",
    title: "The photograph",
    note: "Where the training happened",
  },
  notes: {
    object: "Field notes",
    title: "Field notes",
    note: "What is being worked on",
  },
};

/**
 * Camp — an environment rather than a biography page with a campfire behind it.
 *
 * The scene is drawn in layers (sky, ridge, treeline, tent, fire, table) and
 * the About content lives in objects resting on the table: a notebook, a
 * photograph, a bundle of field notes. Picking one up shows its record.
 *
 * Two decisions keep this honest rather than merely clever:
 *
 *   1. It is a tablist, not a hunt. The objects are real buttons with real
 *      labels, one is open on arrival, and arrow keys move between them. No
 *      content is hidden behind noticing something — discovery changes which
 *      record is showing, never whether the content exists.
 *   2. The map is a link, not a tab, because it goes somewhere else. Hovering
 *      it lights the trail drawn on it; clicking it returns to the survey.
 */
export function CampScene({
  name,
  role,
  summary,
  interests,
  education,
  mapHref,
}: CampSceneProps) {
  const baseId = useId();
  const [open, setOpen] = useState<RecordId>("notebook");
  const [mapHot, setMapHot] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const frame = useRef<number | null>(null);

  /**
   * Pointer parallax. Layers read --px/--py and shift by a few pixels each;
   * the further back, the less it moves. Written straight to the element's
   * style inside one rAF rather than through state, so a mouse move never
   * triggers a React render.
   */
  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const stage = stageRef.current;
    if (!stage) return;

    const { clientX, clientY } = event;
    if (frame.current !== null) return;

    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      const box = stage.getBoundingClientRect();
      const px = (clientX - box.left) / box.width - 0.5;
      const py = (clientY - box.top) / box.height - 0.5;
      stage.style.setProperty("--px", px.toFixed(3));
      stage.style.setProperty("--py", py.toFixed(3));
    });
  }, []);

  const resetParallax = useCallback(() => {
    stageRef.current?.style.setProperty("--px", "0");
    stageRef.current?.style.setProperty("--py", "0");
  }, []);

  const onTabKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = ORDER.length - 1;
    if (next === null) return;

    event.preventDefault();
    const id = ORDER[(next + ORDER.length) % ORDER.length];
    setOpen(id);
    tabRefs.current[id]?.focus();
  }, []);

  return (
    <div className={styles.camp}>
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerMove={onPointerMove}
        onPointerLeave={resetParallax}
      >
        <svg
          className={styles.art}
          viewBox={`0 0 ${CAMP_WIDTH} ${CAMP_HEIGHT}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="campSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--scene-night)" />
              <stop offset="52%" stopColor="var(--scene-dark)" />
              <stop offset="84%" stopColor="var(--scene-dusk)" />
              <stop offset="100%" stopColor="var(--scene-ember)" />
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
          </defs>

          {/* --- sky ---------------------------------------------------- */}
          <g className={styles.sky}>
            <rect x="0" y="0" width={CAMP_WIDTH} height={CAMP_HEIGHT} fill="url(#campSky)" />
            {STARS.map((s, i) => (
              <circle key={`star-${i}`} cx={s.cx} cy={s.cy} r={s.r} fill="var(--color-white-warm)" opacity={s.o} />
            ))}
          </g>

          {/* --- distant ridge, reusing the survey's own mountains ------- */}
          <g className={styles.ridge}>
            <path d={terrain.mountains.silhouettes[0]} transform="translate(0 -120) scale(1 0.62)" />
            <path
              className={styles.ridgeNear}
              d={terrain.mountains.silhouettes[1]}
              transform="translate(0 -60) scale(1 0.58)"
            />
          </g>

          {/* --- treeline, three depths --------------------------------- */}
          {[0, 1, 2].map((band) => (
            <g key={`band-${band}`} className={styles[`trees${band}` as "trees0"]}>
              {TREES.filter((t) => t.band === band).map((t, i) => (
                <path key={`t-${band}-${i}`} d={t.d} />
              ))}
            </g>
          ))}

          {/* --- the fire's light on the ground ------------------------- */}
          <ellipse
            className={styles.groundGlow}
            cx="650"
            cy="600"
            rx="520"
            ry="190"
            fill="url(#fireGlow)"
          />

          {/* --- tent ---------------------------------------------------- */}
          <g className={styles.tent}>
            <path d="M 200 596 L 372 366 L 544 596 Z" />
            <path className={styles.tentDark} d="M 372 366 L 452 596 L 544 596 Z" />
            <path className={styles.tentMouth} d="M 372 596 L 372 432 L 424 596 Z" />
            <path className={styles.tentLine} d="M 372 366 L 372 596 M 372 366 l 96 -26 M 544 596 l 54 18" />
          </g>

          {/* --- smoke, then fire --------------------------------------- */}
          <g className={styles.smoke} filter="url(#smokeBlur)">
            {SMOKE_PLUMES.map((d, i) => (
              <path key={`smoke-${i}`} d={d} className={styles[`plume${i}` as "plume0"]} />
            ))}
          </g>

          <g className={styles.fire}>
            <ellipse className={styles.embers} cx="650" cy="586" rx="62" ry="16" />
            <path className={styles.log} d="M 596 590 l 108 -16 M 600 578 l 100 18" />
            <path className={styles.flameOuter} d="M 650 582 q -34 -40 -8 -78 q 10 30 26 36 q -8 -44 16 -72 q 2 42 24 62 q 16 24 -2 52 Z" />
            <path className={styles.flameInner} d="M 650 580 q -18 -26 -2 -52 q 6 20 16 24 q -4 -26 12 -44 q 0 28 12 42 q 10 16 -2 30 Z" />
          </g>

          {/* --- table -------------------------------------------------- */}
          <g className={styles.table}>
            <path d="M -40 656 L 1640 656 L 1640 940 L -40 940 Z" fill="url(#tableTop)" />
            <path className={styles.tableEdge} d="M -40 660 L 1640 660" />
            <path className={styles.grain} d="M 40 706 H 1560 M 90 758 H 1520 M 20 812 H 1580 M 120 870 H 1470" />
          </g>

          {/* --- objects on the table ----------------------------------- */}
          <g className={styles.objects}>
            {/* Notebook */}
            <g transform="translate(392 782) rotate(-2.4)" className={styles.objNotebook}>
              <rect className={styles.bookPages} x="-146" y="-72" width="292" height="140" rx="3" />
              <rect className={styles.bookCover} x="-152" y="-78" width="292" height="140" rx="4" />
              <path className={styles.bookSpine} d="M -152 -78 v 140" />
              <path className={styles.bookRibbon} d="M 92 -78 v 170 l -13 -18 l -13 18 v -170 Z" />
              <path className={styles.bookMark} d="M -96 -18 h 120 M -96 4 h 86" />
            </g>

            {/* Photograph */}
            <g transform="translate(760 806) rotate(3.6)" className={styles.objPhoto}>
              <rect className={styles.photoMat} x="-84" y="-64" width="168" height="132" />
              <rect className={styles.photoImage} x="-70" y="-50" width="140" height="92" />
              <path className={styles.photoScene} d="M -70 22 L -30 -8 L -4 12 L 26 -22 L 70 20" />
              <circle className={styles.photoSun} cx="34" cy="-28" r="9" />
            </g>

            {/* Field notes */}
            <g transform="translate(1032 780) rotate(-1.4)" className={styles.objNotes}>
              <rect className={styles.noteSheet} x="-92" y="-58" width="184" height="122" transform="rotate(-3)" />
              <rect className={styles.noteSheet} x="-88" y="-62" width="184" height="122" transform="rotate(2)" />
              <rect className={styles.noteTop} x="-90" y="-60" width="184" height="122" />
              <path className={styles.noteRule} d="M -66 -28 h 136 M -66 -6 h 136 M -66 16 h 108 M -66 38 h 124" />
              <path className={styles.noteInk} d="M -66 -46 h 58" />
            </g>

            {/* Folded map */}
            <g transform="translate(1332 790) rotate(2.2)" className={styles.objMap}>
              <rect className={styles.mapSheet} x="-108" y="-70" width="216" height="146" />
              <path className={styles.mapFold} d="M -36 -70 v 146 M 36 -70 v 146" />
              <path className={styles.mapInk} d="M -86 26 q 40 -34 86 -14 q 44 20 84 -20 M -86 -22 q 46 -12 74 -34" />
              <path
                className={mapHot ? `${styles.mapTrail} ${styles.mapTrailHot}` : styles.mapTrail}
                d="M -72 46 q 52 -40 96 -30 q 46 10 82 -46"
              />
              <circle className={styles.mapPin} cx="-72" cy="46" r="5" />
              <circle className={styles.mapPin} cx="106" cy="-30" r="5" />
            </g>
          </g>

          {/* --- foreground haze --------------------------------------- */}
          <rect
            className={styles.haze}
            x="0"
            y="0"
            width={CAMP_WIDTH}
            height={CAMP_HEIGHT}
            fill="none"
          />
        </svg>

        {/* ---- the interactive objects ------------------------------- */}
        <div
          className={styles.tablist}
          role="tablist"
          aria-label="Objects on the table"
        >
          {ORDER.map((id, index) => {
            const box = CAMP_OBJECTS[id];
            const selected = open === id;
            return (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                className={selected ? `${styles.hotspot} ${styles.hotspotOn}` : styles.hotspot}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
                onClick={() => setOpen(id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                <span className={styles.hotspotLabel}>{LABELS[id].object}</span>
                <span className={styles.hotspotNote}>{LABELS[id].note}</span>
              </button>
            );
          })}

          {/* The map is a link: it goes somewhere, so it is not a tab. */}
          <Link
            href={mapHref}
            className={`${styles.hotspot} ${styles.hotspotLink}`}
            style={{
              left: `${CAMP_OBJECTS.map.x}%`,
              top: `${CAMP_OBJECTS.map.y}%`,
              width: `${CAMP_OBJECTS.map.w}%`,
              height: `${CAMP_OBJECTS.map.h}%`,
            }}
            onMouseOver={() => setMapHot(true)}
            onMouseOut={() => setMapHot(false)}
            onFocus={() => setMapHot(true)}
            onBlur={() => setMapHot(false)}
          >
            <span className={styles.hotspotLabel}>Map</span>
            <span className={styles.hotspotNote}>Back to the survey</span>
          </Link>
        </div>
      </div>

      {/* ---- the record the open object carries ---------------------- */}
      <div
        className={styles.record}
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${open}`}
        tabIndex={0}
      >
        <TornPaper
          seed={`camp-${open}`}
          edges={["top", "right"]}
          cornerTear="br"
          tone="light"
          tilt={-0.4}
          className={styles.sheet}
        >
          <p className={styles.recordTag}>{LABELS[open].title}</p>

          {open === "notebook" ? (
            <>
              <p className={styles.recordName}>{name}</p>
              <p className={styles.recordRole}>{role}</p>
              <p className={styles.recordBody}>{summary}</p>
            </>
          ) : null}

          {open === "photograph" ? (
            <>
              <p className={styles.recordHead}>Education</p>
              <ul className={styles.recordList}>
                {education.map((entry) => (
                  <li key={entry.institution}>
                    <span className={styles.recordStrong}>{entry.qualification}</span>
                    <span className={styles.recordMeta}>
                      {entry.institution} · {entry.place}
                    </span>
                    <span className={styles.recordMeta}>{entry.period}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {open === "notes" ? (
            <>
              <p className={styles.recordHead}>Working on</p>
              <ul className={styles.recordList}>
                {interests.map((interest) => (
                  <li key={interest}>
                    <span className={styles.recordStrong}>{interest}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </TornPaper>
      </div>
    </div>
  );
}
