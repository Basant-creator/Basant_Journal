import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./wall.module.css";

export type WallItem = { id: string; title: string; subtitle: string; route: string; image: StaticImageData };

const two = (n: number) => String(n).padStart(2, "0");

/**
 * The work, pinned to the wall before it is indexed: each project's own
 * front page as a print, at its own size and place, each drifting past at
 * its own pace as the page is scrolled (a view timeline per print, moved
 * by transform alone, so the compositor carries it). Numbered, named, and
 * each one the way into its case.
 *
 * Only where there is room and a pointer that hovers: on a phone the index
 * below already carries each picture in its row, and the wall would only
 * say it twice.
 */
export function Wall({ items }: { items: WallItem[] }) {
  return (
    <div className={styles.wall}>
      {items.map((item, i) => (
        <figure key={item.id} className={styles.print} data-n={i} style={{ "--n": i } as CSSProperties}>
          <Link href={item.route} className={styles.frame} aria-label={`${item.title}: read the case`}>
            <Image src={item.image} alt={`${item.title}, its front page`} sizes="(max-width: 1399px) 44vw, 620px" placeholder="blur" />
          </Link>
          <figcaption className={styles.caption}>
            <span className={styles.number} aria-hidden="true">
              [ {two(i + 1)} ]
            </span>
            <span className={styles.title}>{item.title}</span>
            <span className={styles.sub}>{item.subtitle}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
