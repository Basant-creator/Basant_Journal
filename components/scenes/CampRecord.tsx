"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTransition } from "@/components/transition/TransitionContext";
import { FieldPhotograph } from "@/components/world/FieldPhotograph";
import { TornPaper } from "@/components/world/TornPaper";
import type { CampObjectId } from "@/lib/world/camp";
import { routes } from "@/lib/routes";
import styles from "./CampScene.module.css";
import { useSheetArrival } from "./useSheetArrival";

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
  const sheet = useRef<HTMLDivElement | null>(null);
  useSheetArrival(sheet, labelledBy);

  /*
    The arrival waits for the curtain, for the reason §19 already cost this
    phase once.

    Measured before this existed: on a click into /about the sheet's page-turn
    started 209ms in and ran for 900, so it was finished at 1109 — and the
    chapter card does not clear until 1568. The whole of §37's signature moment
    played behind a card that was covering it. Not too fast, not too slow;
    simply over before there was anybody in the room.

    Same fix as ThreeScene's, and for the same reason: IDLE is the only phase
    in which nothing covers the page, every path through the transition ends
    there including the 2600ms guard, and a route with no chapter is IDLE from
    the start. No provider at all — the bench — reads as nothing to wait for.

    Held with `animation-play-state` rather than by delaying the mount. The
    record is real content: it is in the DOM, in the accessibility tree, and
    in the markup a crawler sees, from the first paint. Only its entrance
    waits.
  */
  const transition = useTransition();
  const held = transition !== null && transition.phase !== "IDLE";

  /*
    And a limit on the waiting.

    Holding the arrival at its first keyframe means holding the record at
    opacity 0, which is the one state this project's motion rules say never to
    depend on somebody else's liveness: "the resting state is the visible one".
    The exception is deliberate — there is a card over the page, so invisible
    is correct — but it hands the visibility of real content to a phase machine
    running somewhere else.

    The transition has its own 2600ms guard and always reaches IDLE in a live
    browser. This sits past it. If the phase ever stalls, what is lost is an
    animation nobody sees; what is not lost is the content.

    Not hypothetical: with the browser pane unpainted, the transition's own
    choreography stops advancing and the record sat at opacity 0 for seven
    seconds. That was the pane rather than the code, and it is exactly what a
    stall looks like from here.
  */
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    if (!held || waited) return;
    const id = window.setTimeout(() => setWaited(true), 3000);
    return () => window.clearTimeout(id);
  }, [held, waited]);

  const covered = held && !waited;

  return (
    <div
      className={styles.record}
      role={labelledBy ? "tabpanel" : "group"}
      id={panelId}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : CAMP_RECORD_TITLES[open]}
      tabIndex={0}
    >
      {/*
        Keyed on the subject, so this is a new element every time a different
        object is picked up and the arrival runs again.

        That is the "replay per subject, not once per session" rule, and it is
        the whole difference between a moment and a one-off: without the key
        React keeps the node, the animation has already finished on it, and
        walking from the notebook to the photograph would show nothing at all.
        TornPaper's seed is already per-subject, so the tear was being redrawn
        anyway — this only makes the element admit it.

        A wrapper around the sheet rather than the sheet itself, because
        TornPaper rests at an angle and does it with `transform: rotate(var(
        --tilt))`. Animating transform on that same element would replace the
        rest angle, and the sheet would land square — the tilt would survive
        every frame of the arrival and vanish on the last one. Two owners, one
        property. So the wrapper moves and the sheet keeps its angle.
      */}
      <div
        key={open}
        ref={sheet}
        className={styles.sheet}
        data-subject={open}
        data-waiting={covered || undefined}
      >
        <TornPaper
          seed={`camp-${open}`}
          edges={["top", "right"]}
          cornerTear="br"
          tone="light"
          tilt={-0.4}
        >
          <p className={styles.recordTag}>{CAMP_RECORD_TITLES[open]}</p>

          {open === "notebook" ? (
            <>
              <p className={styles.recordName}>{name}</p>
              <p className={styles.recordRole}>{role}</p>
              <p className={styles.recordBody}>{summary}</p>

              {/*
                The door into the book.

                Two beats rather than one, and deliberately: picking the
                notebook up shows whose it is, opening it shows what is in it.
                Collapsing them into a single click would have meant either
                losing this record — the only place on the site that says, in
                the surveyor's own hand, who is keeping it — or making the
                object mean two things depending on how many times you had
                already pressed it.

                It is a real link to a real route, so it is tabbable, it
                middle-clicks, and the notebook-opening transition that plays
                over it is choreography rather than a gate.
              */}
              <Link href={routes.projects} className={styles.openJournal}>
                <span className={styles.openJournalMark} aria-hidden="true" />
                <span>
                  Open the field journal
                  <span className={styles.openJournalHint}>
                    Contents, and the records in the back
                  </span>
                </span>
              </Link>
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
                    <span className={styles.recordStrong}>
                      {entry.qualification}
                    </span>
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
