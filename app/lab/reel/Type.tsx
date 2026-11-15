import { Fragment, type CSSProperties } from "react";
import styles from "./reel.module.css";

/**
 * A line of type set by hand and pressed onto the page one sort at a time:
 * each letter its own span, its place in the line (--i) setting when it
 * lands. Read as the plain words: the letters are hidden from assistive
 * technology and the text is given whole beside them.
 */
export function Stamped({ text, start = 0 }: { text: string; start?: number }) {
  let i = start;
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((word, w) =>
          /\s/.test(word) ? (
            <Fragment key={w}> </Fragment>
          ) : (
            <span key={w} className={styles.word}>
              {[...word].map((ch, c) => (
                <span key={c} className={styles.sort} style={{ "--i": i++ } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </>
  );
}
