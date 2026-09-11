import styles from "./MapCompass.module.css";

interface MapCompassProps {
  x: number;
  y: number;
  radius: number;
}

const RAD = Math.PI / 180;

/** Point on a circle, with 0 degrees at north and angles running clockwise. */
function onCircle(r: number, deg: number) {
  const a = deg * RAD;
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}

/**
 * One arm of the rose, drawn as two triangles so the light and shade halves
 * read the way an engraved rose does.
 */
function arm(deg: number, outer: number, waist: number) {
  const tip = onCircle(outer, deg);
  const left = onCircle(waist, deg - 90);
  const right = onCircle(waist, deg + 90);
  return {
    light: `M 0 0 L ${left.x.toFixed(1)} ${left.y.toFixed(1)} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} Z`,
    shade: `M 0 0 L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${right.x.toFixed(1)} ${right.y.toFixed(1)} Z`,
  };
}

/**
 * The compass rose.
 *
 * An instrument, not an ornament — it is the thing that tells a reader this
 * sheet was made to be used. Kept clear of every location node.
 */
export function MapCompass({ x, y, radius }: MapCompassProps) {
  const cardinals = [0, 90, 180, 270];
  const ordinals = [45, 135, 225, 315];

  return (
    <g transform={`translate(${x} ${y})`} className={styles.rose} aria-hidden="true">
      <circle className={styles.ring} r={radius} />
      <circle className={styles.ringInner} r={radius * 0.74} />
      <circle className={styles.hub} r={radius * 0.075} />

      {/* Degree ticks every 30 degrees. */}
      {Array.from({ length: 12 }).map((_, i) => {
        const deg = i * 30;
        const a = onCircle(radius, deg);
        const b = onCircle(radius * 0.88, deg);
        return (
          <path
            key={`tick-${deg}`}
            className={styles.tick}
            d={`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
          />
        );
      })}

      {ordinals.map((deg) => {
        const { light, shade } = arm(deg, radius * 0.58, radius * 0.15);
        return (
          <g key={`ord-${deg}`}>
            <path className={styles.armLight} d={light} />
            <path className={styles.armShade} d={shade} />
          </g>
        );
      })}

      {cardinals.map((deg) => {
        const { light, shade } = arm(deg, radius * 0.9, radius * 0.19);
        return (
          <g key={`card-${deg}`}>
            <path className={styles.armLight} d={light} />
            <path className={styles.armShade} d={shade} />
          </g>
        );
      })}

      <text className={styles.north} y={-radius - 10} textAnchor="middle">
        N
      </text>
    </g>
  );
}
