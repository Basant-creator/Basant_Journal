"use client";

import { FieldPhotograph } from "@/components/world/FieldPhotograph";
import { TornPaper } from "@/components/world/TornPaper";
import type { CampObjectId } from "@/lib/world/camp";
import styles from "./CampScene.module.css";

export type CampRecordId = Exclude<CampObjectId, "map">;

export interface EducationEntry {
  qualification: string;
  institution: string;
  period: string;
  place: string;
}

export interface CampRecordContent {
  name: string;
  role: string;
  summary: string;
  interests: string[];
  education: EducationEntry[];
}

export const CAMP_RECORD_TITLES: Record<CampRecordId, string> = {
  notebook: "The notebook",
  photograph: "The photograph",
  notes: "Field notes",
};

interface CampRecordProps extends CampRecordContent {
  open: CampRecordId;
  /** The panel's own id, and the control that names it. Both optional: on the
   *  route the record is a tabpanel in a tablist, and on the bench it is a
   *  region with no tabs to be labelled by. */
  panelId?: string;
  labelledBy?: string;
}

/**
 * What the open object says.
 *
 * Lifted out of CampScene unchanged — same markup, same stylesheet, same
 * TornPaper seed — because the production scene needs the identical record and
 * the alternative was a second copy of it. Two copies of a reading surface is
 * how one of them quietly stops matching the content model.
 *
 * This is the destination half of §17: an object in the camp is picked up, and
 * a sheet of paper carries what it holds. The scene never renders text. What
 * is on the table is an object; what is readable is here, in the DOM, in the
 * layer THE PAPER owns — which is also why the illustrated camp and the
 * rendered camp can swap underneath it without any of this moving.
 *
 * Every value comes in as a prop from `content/portfolio.json`. There is no
 * default, no placeholder and no sample: an object with nothing behind it
 * should fail to compile rather than invent something to show.
 */
export function CampRecord({
  open,
  name,
  role,
  summary,
  interests,
  education,
  panelId,
  labelledBy,
}: CampRecordProps) {
  return (
    <div
      className={styles.record}
      role={labelledBy ? "tabpanel" : "group"}
      id={panelId}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : CAMP_RECORD_TITLES[open]}
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
        <p className={styles.recordTag}>{CAMP_RECORD_TITLES[open]}</p>

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
  );
}
