"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { Scene } from "@/components/scene/Scene";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { TornPaper } from "@/components/world/TornPaper";
import { CAMP_HEIGHT, CAMP_WIDTH, type CampObjectId, objectBox } from "@/lib/world/camp";
import { CampArt } from "./CampArt";
import styles from "./CampScene.module.css";

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
 * The place is CampArt; this is what happens in it. The About content lives in
 * objects resting on the table — a notebook, a photograph, a bundle of field
 * notes — and picking one up shows its record.
 *
 * Two decisions keep this honest rather than merely clever:
 *
 *   1. It is a tablist, not a hunt. The objects are real buttons with real
 *      labels, one is open on arrival, and arrow keys move between them. No
 *      content is hidden behind noticing something — discovery changes which
 *      record is showing, never whether the content exists.
 *   2. The map is a link, not a tab, because it goes somewhere else. Hovering
 *      it lights the trail drawn on it; clicking it returns to the survey.
 *
 * The stage, the pointer and the depth model are the engine's now. This
 * component used to carry its own copy of all three — written before there
 * was an engine to carry them.
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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
      {/*
        entry={false}: /about already opens with a ChapterCard, and a stage
        that also fades itself in would be a second arrival stacked on the
        first. The ratio is load-bearing — the object hit areas are
        percentages of this box, so it has to keep the artwork's proportions
        at every width or the controls drift off the things they belong to.
      */}
      <Scene
        className={styles.stage}
        width={CAMP_WIDTH}
        height={CAMP_HEIGHT}
        compactRatio={`${CAMP_WIDTH} / ${CAMP_HEIGHT}`}
        entry={false}
      >
        <CampArt mapHot={mapHot} />

        {/* Smoke and firelight already move; this is the air between them. */}
        <SceneAtmosphere variant="drift" className={styles.air} />

        {/* ---- the interactive objects ------------------------------- */}
        <div className={styles.tablist} role="tablist" aria-label="Objects on the table">
          {ORDER.map((id, index) => {
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
                style={objectBox(id)}
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
            style={objectBox("map")}
            onMouseOver={() => setMapHot(true)}
            onMouseOut={() => setMapHot(false)}
            onFocus={() => setMapHot(true)}
            onBlur={() => setMapHot(false)}
          >
            <span className={styles.hotspotLabel}>Map</span>
            <span className={styles.hotspotNote}>Back to the survey</span>
          </Link>
        </div>
      </Scene>

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
