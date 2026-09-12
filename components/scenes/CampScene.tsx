"use client";

import { useId, useState } from "react";
import { Scene } from "@/components/scene/Scene";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { SceneInteraction } from "@/components/scene/SceneInteraction";
import { SceneObject } from "@/components/scene/SceneObject";
import { SceneObjects } from "@/components/scene/SceneObjects";
import { FieldPhotograph } from "@/components/world/FieldPhotograph";
import { TornPaper } from "@/components/world/TornPaper";
import { CAMP_HEIGHT, CAMP_WIDTH, type CampObjectId, objectBox } from "@/lib/world/camp";
import { CampStage } from "./CampStage";
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
        {/*
          The artwork sits inside the interaction provider so the objects can
          react to being reached for — a scene where an invisible rectangle
          lights up and the thing under it does nothing is not a scene. The
          tablist element is separate, because artwork has no business in one.
        */}
        <SceneInteraction
          id={baseId}
          order={ORDER}
          initial="notebook"
          onChange={(id) => setOpen(id as RecordId)}
        >
          <CampStage />

          {/* Smoke and firelight already move; this is the air between them. */}
          <SceneAtmosphere variant="drift" className={styles.air} />

          <SceneObjects label="Objects on the table">
            {ORDER.map((id) => (
              <SceneObject
                key={id}
                id={id}
                box={objectBox(id)}
                label={LABELS[id].object}
                note={LABELS[id].note}
              />
            ))}

            {/* The map is a link: it goes somewhere, so it is not a tab. */}
            <SceneObject
              id="map"
              box={objectBox("map")}
              label="Map"
              note="Back to the survey"
              href={mapHref}
            />
          </SceneObjects>
        </SceneInteraction>
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
              {/* The photograph the object actually is. It carries the record
                  rather than illustrating it: a picture of the surveyor,
                  captioned with the posting, which is what a photograph in a
                  field journal is for. */}
              <FieldPhotograph
                src="/portrait/basant.jpg"
                alt={`${name} — ${role}`}
                width={900}
                height={1125}
                caption={`${name}, Punjab`}
                className={styles.portrait}
              />

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
