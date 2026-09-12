import Image from "next/image";
import styles from "./FieldPhotograph.module.css";

interface FieldPhotographProps {
  src: string;
  /** Real alt text. A portrait is content, not decoration. */
  alt: string;
  width: number;
  height: number;
  /** Written on the mount, in the hand. */
  caption?: string;
  /** Degrees. A print put down by hand is never quite square. */
  tilt?: number;
  /** Load it eagerly where it is the thing the visitor came to see. */
  priority?: boolean;
  className?: string;
}

/**
 * A photograph, printed into this world.
 *
 * A modern colour photograph dropped into a sepia frontier reads as a
 * screenshot of a different website. Four things fix that, and none of them
 * touch the file: a duotone pulled toward the site's own earth range, a
 * lifted black point because an aged print has no true black, the same grain
 * the rest of the site is dusted with, and a vignette. The original stays
 * unmodified on disk, so the treatment is a decision that can be changed
 * rather than a thing baked into an asset.
 *
 * It has its own mount rather than using Paper's PHOTOGRAPH variant. That
 * variant *draws* an image area — a placeholder for a print that did not
 * exist yet — and a real photograph needs a fixed ratio, object-fit and three
 * treatment layers over the top. They are the same object in two states, and
 * pretending otherwise would mean contorting one of them.
 */
export function FieldPhotograph({
  src,
  alt,
  width,
  height,
  caption,
  tilt = -1.2,
  priority,
  className,
}: FieldPhotographProps) {
  return (
    <figure
      className={[styles.mount, className].filter(Boolean).join(" ")}
      style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
    >
      <div className={styles.window} style={{ aspectRatio: `${width} / ${height}` }}>
        <Image
          className={styles.print}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 720px) 80vw, 340px"
          priority={priority}
        />
        <span className={styles.tone} aria-hidden="true" />
        <span className={styles.grain} aria-hidden="true" />
        <span className={styles.vignette} aria-hidden="true" />
      </div>

      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
