"use client";

import { useEffect, useId, useState } from "react";
import { Scene } from "@/components/scene/Scene";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { SceneInteraction } from "@/components/scene/SceneInteraction";
import { SceneObject } from "@/components/scene/SceneObject";
import { SceneObjects } from "@/components/scene/SceneObjects";
import { setNearFire } from "@/lib/audio/atmosphere";
import { CAMP_HEIGHT, CAMP_WIDTH, objectBox } from "@/lib/world/camp";
import {
  CampRecord,
  type CampRecordId,
  type EducationEntry,
} from "./CampRecord";
import { CampStage } from "./CampStage";
import styles from "./CampScene.module.css";

type RecordId = CampRecordId;

interface CampSceneProps {
  name: string;
  role: string;
  summary: string;
  interests: string[];
  education: EducationEntry[];
  mapHref: string;
}

const ORDER: RecordId[] = ["notebook", "photograph", "notes"];

const LABELS: Record<RecordId, { object: string; note: string }> = {
  notebook: {
    object: "Notebook",
    note: "Who is keeping this record",
  },
  photograph: {
    object: "Photograph",
    note: "Where the training happened",
  },
  notes: {
    object: "Field notes",
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

  /*
    There is a fire here, and there is one nowhere else.

    The atmosphere engine plays the territory's wind wherever it is switched
    on; the ember bed used to be mixed into that same rig at start-up, which
    meant a campfire crackling over the professional résumé. The place is the
    only thing that knows it has a fire, so the place is what says so — and
    unmounting puts it out, whether the visitor left by a link, the Back
    button or a transition that changed its mind halfway.

    Safe with the air switched off, which is how it almost always is: this
    sets a flag and starts nothing.

    The *music* used to be set here too, and is not any more. Camp's
    reflective state now comes from CheckpointAudio in the root layout,
    because a place that sets music on mount and silences it on unmount
    races the place the visitor is arriving at — Camp's cleanup runs after
    the destination's effect, so leaving here silenced wherever you went.
    A fire belongs to a place; a score belongs to the journey.
  */
  useEffect(() => {
    setNearFire(true);
    return () => setNearFire(false);
  }, []);

  return (
    <div className={styles.camp}>
      {/*
        entry={false}: /about already has an arrival — the route curtain names
        the chapter on the way in — and a stage that also fades itself in
        would be a second arrival stacked on the first. The ratio is load-bearing — the object hit areas are
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

          <SceneObjects
            label="Objects on the table"
            aside={
              <>
                {/* The map is a link: it goes somewhere, so it is not a tab. */}
                <SceneObject
                  id="map"
                  box={objectBox("map")}
                  label="Map"
                  note="Back to the survey"
                  href={mapHref}
                />
              </>
            }
          >
            {ORDER.map((id) => (
              <SceneObject
                key={id}
                id={id}
                box={objectBox(id)}
                label={LABELS[id].object}
                note={LABELS[id].note}
                /* §2: the notebook is the hero object — the one thing on the
                   table that leads somewhere rather than merely saying
                   something. It is marked here rather than inside SceneObject
                   because "which object is the door" is a fact about this
                   scene, not about scene objects in general. */
                className={id === "notebook" ? styles.hero : undefined}
              />
            ))}

          </SceneObjects>
        </SceneInteraction>
      </Scene>

      {/* ---- the record the open object carries ----------------------

           Its markup lives in CampRecord now, because the production scene
           needs the same one. Same sheet, same seed, same content model. */}
      <CampRecord
        open={open}
        name={name}
        role={role}
        summary={summary}
        interests={interests}
        education={education}
        panelId={`${baseId}-panel`}
        labelledBy={`${baseId}-tab-${open}`}
      />
    </div>
  );
}
