import type { CSSProperties } from "react";
import styles from "./titles.module.css";

/**
 * A title set a letter at a time, so each letter can slam onto the card in
 * turn (`--i` is its place in the whole title). The letters are hidden from
 * assistive technology and the title is read once, whole, from a visually
 * hidden copy. Each word is its own unbreakable box, so a line never breaks
 * inside a word.
 *
 * Under it, a few puffs of dust, kicked up along the foot of the title as
 * its letters land, left to right (titles.module.css). Decoration: at rest,
 * and with reduced motion, there is no dust at all.
 */
const PUFFS = 5;
export function Slam({ text }: { text: string }) {
  const words = text.split(" ");
  const starts = words.map((_, w) => words.slice(0, w).reduce((n, word) => n + word.length, 0));
  const letters = words.join("").length;
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            {w > 0 ? " " : null}
            <span className={styles.word}>
              {[...word].map((ch, k) => (
                <span key={k} className={styles.ch} style={{ "--i": starts[w] + k } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
      <span className={styles.dust} aria-hidden="true" style={{ "--n": letters } as CSSProperties}>
        {Array.from({ length: PUFFS }, (_, k) => (
          <span key={k} style={{ "--at": k / (PUFFS - 1) } as CSSProperties} />
        ))}
      </span>
    </>
  );
}
