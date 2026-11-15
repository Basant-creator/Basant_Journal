import styles from "./skip.module.css";

/**
 * First focusable element on every page: straight to the content. On the
 * deck that is the card on screen (Deck.tsx reads #main as "focus it", not
 * as a card); on a case file or the professional view, the page itself.
 */
export function SkipLink() {
  return (
    <a href="#main" className={styles.skip}>
      Skip to content
    </a>
  );
}
