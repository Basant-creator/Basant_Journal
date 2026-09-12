import styles from "./FrontierBootMark.module.css";

/**
 * The boot emblem.
 *
 * The same instrument as the route loader — a surveyor's index plate — drawn
 * at the size and detail something gets when it is the only thing on screen
 * for a second and a half: an engraved outer ring with graduations every five
 * degrees, a chaptered inner ring of six stations, a sighting cross, and an
 * index arm that steps round.
 *
 * It is a separate component from FrontierLoader on purpose, and §23 is right
 * to insist: the boot mark belongs to starting the site, and must never
 * reappear because somebody clicked Gear. Sharing the vocabulary is what
 * makes them the same instrument; sharing the component would let one of them
 * turn up where the other belongs.
 *
 * Drawn, and small: about sixty elements of SVG, no image, no font. The
 * emblem shown while a site loads cannot itself be a thing that loads.
 */
export function FrontierBootMark() {
  /*
    Rounded, and it matters: Math.cos and Math.sin are not required to agree
    to the last bit between JavaScript engines, so Node and the browser
    produced coordinates differing in the fifteenth decimal place and React
    reported a hydration mismatch on every load. The map's geometry has
    rounded its output for exactly this reason since it was written.
  */
  const at = (n: number) => Math.round(n * 100) / 100;

  // Graduations every 5° on the outer ring, longer every 30°.
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const angle = (i * 5 - 90) * (Math.PI / 180);
    const major = i % 6 === 0;
    const outer = 92;
    const inner = major ? 80 : 86;
    return {
      key: i,
      major,
      x1: at(100 + Math.cos(angle) * inner),
      y1: at(100 + Math.sin(angle) * inner),
      x2: at(100 + Math.cos(angle) * outer),
      y2: at(100 + Math.sin(angle) * outer),
    };
  });

  // Six stations, as on the route plate.
  const stations = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return {
      key: i,
      cx: at(100 + Math.cos(angle) * 56),
      cy: at(100 + Math.sin(angle) * 56),
    };
  });

  return (
    <span className={styles.mark}>
      <svg viewBox="0 0 200 200" className={styles.plate} focusable="false" aria-hidden="true">
        {/* The struck ring, bitten twice and slightly out of register. */}
        <circle className={styles.rim} cx="100" cy="100" r="92" />
        <circle className={styles.rimGhost} cx="100" cy="100" r="92" />
        <circle className={styles.rimInner} cx="100" cy="100" r="72" />

        <g className={styles.ticks}>
          {ticks.map((t) => (
            <line
              key={t.key}
              className={t.major ? styles.tickMajor : styles.tick}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
            />
          ))}
        </g>

        <g className={styles.stations}>
          {stations.map((s) => (
            <circle key={s.key} cx={s.cx} cy={s.cy} r="5.4" />
          ))}
        </g>

        {/* The sight: a cross in a ring, as on any instrument you aim. */}
        <circle className={styles.sight} cx="100" cy="100" r="20" />
        <path className={styles.cross} d="M 100 84 V 116 M 84 100 H 116" />
        <circle className={styles.pupil} cx="100" cy="100" r="4.4" />

        {/* The index arm, stepping between stations. */}
        <g className={styles.arm}>
          <path d="M 100 100 L 100 34" />
          <path className={styles.armTip} d="M 93 42 L 100 28 L 107 42" />
          <circle className={styles.armPivot} cx="100" cy="100" r="8.6" />
        </g>
      </svg>
    </span>
  );
}
