import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { PLATES, plate } from "./art";
import { BigName } from "./BigName";
import { Paper } from "./Partition";
import { Reveal } from "./Reveal";
import styles from "./page.module.css";

/**
 * How each chapter arrives. The four share their plate, their type, their
 * marks and their easing; what differs is the one gesture each subject
 * earns, and only one of them holds the screen.
 *
 *   window  Camp. The plate holds still for a short run: the chapter's name
 *           across the whole width with the painting in its letters, a
 *           window of the painting opened under it, opening until the
 *           painting fills the screen. The first chapter, so the one that
 *           takes its time.
 *   dust    Journey. The painting comes up through dust that blows off it,
 *           panning across the frame as it passes: movement, and time.
 *   report  Work. As the painting goes by it is reduced to its drawing on a
 *           ruled sheet, and the chapter is stamped as a field report: the
 *           story turning into the engineering.
 *   letter  Contact. Nothing held: the paper below unfolds as it arrives,
 *           and the address is on it at once.
 */
type Entrance = "window" | "dust" | "report" | "letter";
const ENTRANCE: Record<string, Entrance> = { camp: "window", journey: "dust", work: "report", contact: "letter" };

/**
 * A chapter, headed by its plate: a painting of the period, the chapter's
 * name set on it, and the caption a book would print under it. The first
 * time the painting is on screen it is chalked in and rubbed back to colour
 * (Reveal). All of the motion is the scroll position (CSS view timelines);
 * without them, or with motion asked to be still, the plate is simply the
 * painting with its title, and nothing is held.
 *
 * `paper` sets the chapter's body on a paper band torn across the dark;
 * `mark` replaces the plate's corner index with something the chapter can
 * say for itself (Journey: the years it covers).
 */
export function Chapter({
  id,
  children,
  wide = false,
  paper = false,
  mark,
}: {
  id: string;
  children: ReactNode;
  wide?: boolean;
  paper?: boolean;
  mark?: string;
}) {
  const p = plate(id);
  const entrance = ENTRANCE[id] ?? "dust";
  const body = <div className={wide ? styles.chapterBodyWide : styles.chapterBody}>{children}</div>;
  return (
    <section id={id} className={styles.chapter} data-chapter={id} data-entrance={entrance} aria-labelledby={`${id}-title`}>
      <div className={styles.plateRun}>
        <figure
          className={styles.plate}
          style={{ "--focus": p.focus } as CSSProperties}
        >
          {entrance === "window" ? (
            <BigName>{p.chapter}</BigName>
          ) : null}
          <div className={styles.plateFrame}>
            <div className={styles.plateDrift}>
              <Reveal
                src={p.src}
                lines={p.lines}
                alt={`${p.title}, ${p.artist}, ${p.year}`}
                sizes="100vw"
                seen={entrance === "window" ? 0.06 : 0.25}
                className={styles.plateImage}
                style={{ objectPosition: p.focus } as CSSProperties}
              />
              {entrance === "report" ? (
                <span className={styles.report} aria-hidden="true">
                  <span className={styles.reportVeil} />
                  <Image src={p.lines} alt="" fill sizes="100vw" className={styles.reportLines} style={{ objectPosition: p.focus }} />
                  <span className={styles.reportGrid} />
                </span>
              ) : null}
            </div>
            {entrance === "dust" ? <span className={styles.dustVeil} aria-hidden="true" /> : null}
            <span className={styles.plateShade} aria-hidden="true" />
          </div>
          <p className={styles.plateMark} data-at="start" aria-hidden="true">
            (Chapter {p.numeral})
          </p>
          <p className={styles.plateMark} data-at="end" aria-hidden="true">
            {mark ?? `${p.numeral} / ${PLATES[PLATES.length - 1].numeral}`}
          </p>
          <div className={styles.plateTitle}>
            <p className={styles.numeral}>Chapter {p.numeral}</p>
            <h2 id={`${id}-title`} className={styles.chapterName}>
              {p.chapter}
            </h2>
            {entrance === "report" ? (
              <p className={styles.reportStamp} aria-hidden="true">
                Field report · No. {p.numeral}
              </p>
            ) : null}
          </div>
          <figcaption className={styles.caption}>
            <a href={p.source} target="_blank" rel="noreferrer noopener" className={styles.inkLink} aria-describedby="new-tab">
              <cite>{p.title}</cite>, {p.artist}, {p.year}
            </a>
          </figcaption>
        </figure>
      </div>
      {paper ? (
        <Paper seed={id} last fold={entrance === "letter"}>
          {body}
        </Paper>
      ) : (
        body
      )}
    </section>
  );
}
