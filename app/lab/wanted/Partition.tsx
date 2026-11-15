import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Torn } from "./Torn";
import styles from "./partition.module.css";

/**
 * The page's ruling: where one part of a chapter ends and the next begins.
 *
 * A hairline across the column with a registration cross at each end, the
 * part's name in brackets on the left, its index on the right, the way a
 * surveyor's sheet is divided. The first time it comes up the line is
 * drawn across and its words set down after it (`data-enter`, see Stage);
 * the running head reads the part's name off it (`data-section`).
 */
export function Rule({ label, index }: { label: string; index: string }) {
  return (
    <div className={styles.rule} data-enter="" data-section={label}>
      <span className={styles.cross} data-at="start" aria-hidden="true" />
      <p className={styles.bracket}>({label})</p>
      <span className={styles.ruleLine} aria-hidden="true" />
      <p className={styles.index} aria-hidden="true">
        {index}
      </p>
      <span className={styles.cross} data-at="end" aria-hidden="true" />
    </div>
  );
}

/**
 * A band of paper across the dark: the part of a chapter that is a record
 * rather than a place. Torn at the top and (unless it ends the page) the
 * foot, a registration cross in each corner, and the page's own colours
 * turned to ink on paper, so whatever is set inside reads correctly
 * without knowing where it is.
 *
 * `fold`: it arrives folded and opens out flat from its top edge, a letter
 * being opened toward the reader, done before its first lines are halfway
 * up the screen.
 */
export function Paper({ seed, children, last = false, fold = false }: { seed: string; children: ReactNode; last?: boolean; fold?: boolean }) {
  return (
    <div className={styles.paper} data-last={last ? "" : undefined} data-fold={fold ? "" : undefined}>
      <Torn seed={`${seed}-top`} side="top" />
      <span className={styles.corner} data-corner="tl" aria-hidden="true" />
      <span className={styles.corner} data-corner="tr" aria-hidden="true" />
      {last ? null : (
        <>
          <span className={styles.corner} data-corner="bl" aria-hidden="true" />
          <span className={styles.corner} data-corner="br" aria-hidden="true" />
        </>
      )}
      <div className={styles.paperBody}>{children}</div>
      {last ? null : <Torn seed={`${seed}-foot`} side="bottom" />}
    </div>
  );
}

/**
 * A line of display type that rises into place word by word, each word
 * coming up out of its own slot, read off the scroll. The words stay one
 * piece of text to anything that reads it.
 */
export function Split({ text, as: Tag = "span", className }: { text: string; as?: "span" | "h3" | "p"; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className={styles.slot}>
            <span className={styles.word} style={{ "--w": i } as CSSProperties}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
