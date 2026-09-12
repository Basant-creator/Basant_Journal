import styles from "./FrontierLoader.module.css";

interface FrontierLoaderProps {
  /** Stills the rotation. The mark still reads; it simply is not turning. */
  still?: boolean;
  className?: string;
}

/**
 * The Frontier mark.
 *
 * A surveyor's index plate: a stamped ring carrying six station marks around a
 * centred sight, with an index arm that steps round it. That is a real
 * instrument — the thing on a theodolite that clicks between bearings — and it
 * is why this shape was chosen over the obvious one. A chambered ring is
 * common to a great many period objects, most of them mechanical and one of
 * them a revolver; drawing the *instrument* rather than the weapon keeps the
 * reference where it belongs, in the drawing office.
 *
 * Everything here is drawn: eleven elements, no image, no font, nothing
 * fetched. The mark appears precisely when someone is already waiting, so it
 * must not be a thing that has to load.
 */
export function FrontierLoader({ still, className }: FrontierLoaderProps) {
  // Six stations at 60°, starting at the top.
  const stations = [0, 1, 2, 3, 4, 5].map((i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return { cx: 50 + Math.cos(angle) * 30, cy: 50 + Math.sin(angle) * 30 };
  });

  return (
    <span
      className={[styles.mark, className].filter(Boolean).join(" ")}
      data-still={still ? "true" : undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className={styles.plate} focusable="false">
        {/* The plate: a struck ring, doubled the way a stamp bites twice. */}
        <circle className={styles.rim} cx="50" cy="50" r="44" />
        <circle className={styles.rimInner} cx="50" cy="50" r="39" />

        {/* Stations. */}
        <g className={styles.stations}>
          {stations.map((s, i) => (
            <circle key={`station-${i}`} cx={s.cx} cy={s.cy} r="4.2" />
          ))}
        </g>

        {/* The sight at the centre. */}
        <circle className={styles.sight} cx="50" cy="50" r="9" />
        <circle className={styles.pupil} cx="50" cy="50" r="3" />

        {/* The index arm, stepping round. */}
        <g className={styles.arm}>
          <path d="M 50 50 L 50 14" />
          <path className={styles.armTip} d="M 46 19 L 50 11 L 54 19" />
        </g>
      </svg>
    </span>
  );
}
