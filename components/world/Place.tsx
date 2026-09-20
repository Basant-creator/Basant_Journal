import type { ReactNode } from "react";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { terrain } from "@/lib/map/terrain";
import styles from "./Place.module.css";

/**
 * How late in the day it is here.
 *
 * §24 asks that the world get quieter the further along the trail the visitor
 * walks — current findings, then historical record, then the last stop — and
 * the cheapest honest way to say that is the light. The Board is posted at
 * dusk while there is still someone to read it; the Archive is lit by a lamp
 * after the sun has gone; Trail End is the blue half hour with nothing left
 * to survey.
 *
 * It is one attribute and three sets of numbers, deliberately. The alternative
 * — three environments — is exactly the "another giant 3D world" the brief
 * rules out, and it would also break the thing this component exists for: all
 * three places have to be visibly the *same country* at different hours.
 */
export type PlaceHour = "dusk" | "lamplight" | "last-light";

interface PlaceProps {
  /** The ground this place stands on. */
  hour?: PlaceHour;
  /** Burned into the frame, bottom left. A surveyor's station note. */
  station?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A place in the territory.
 *
 * Three checkpoints stand on this — the Board, the Archive and Trail End —
 * and the reason they share one component rather than each having their own
 * is §6 and §40, which are the same instruction said twice: the visitor must
 * subconsciously recognise the ground. So the ridge behind all three is not a
 * ridge *like* the one on the survey sheet. It is the identical path data,
 * out of `lib/map/terrain`, drawn from the same seed that draws the sheet's
 * own mountains and the ones Camp stands in front of. One territory, surveyed
 * once, seen from three different spots on it.
 *
 * **Server-rendered on purpose.** The terrain module builds its geometry at
 * module scope, and pulling it into a client component would ship the whole
 * generator — ridges, hachures, contours, the river, the stains — to a
 * browser that needs three path strings. Rendered here it runs at build time
 * and the page carries the finished `d` attributes in its HTML. The only
 * JavaScript any of these three checkpoints loads for their environment is
 * none.
 *
 * §41: no renderer, no particles, no shaders. The strongest scene stays the
 * Camp, and these are composed rather than simulated.
 */
export function Place({
  hour = "dusk",
  station,
  children,
  className,
}: PlaceProps) {
  return (
    <div
      className={[styles.place, className].filter(Boolean).join(" ")}
      data-hour={hour}
    >
      <div className={styles.country} aria-hidden="true">
        <div className={styles.sky} />

        {/*
          The same three ridges as the sheet.

          `slice` rather than `meet`, and anchored to the bottom: the crest has
          to land on the horizon at every width, and a ridge that letterboxes
          is a picture of a ridge rather than the country behind the place.
          The window into the sheet's coordinate space is the band the ridges
          actually occupy — they close down to y=1000, so everything below the
          crest is solid mass and the ground band takes over from there.
        */}
        <svg
          className={styles.ridges}
          viewBox="0 250 1600 420"
          preserveAspectRatio="xMidYMax slice"
        >
          {terrain.mountains.silhouettes.map((d, i) => (
            <path key={`place-ridge-${i}`} d={d} data-band={i} />
          ))}
        </svg>

        <div className={styles.ground} />

        {/* Air, and only haze. Dust belongs to a scene being looked into;
            these are places being read in. */}
        <SceneAtmosphere variant="still" className={styles.air} />
      </div>

      {station ? (
        <p className={styles.station} aria-hidden="true">
          {station}
        </p>
      ) : null}

      <div className={styles.content}>{children}</div>
    </div>
  );
}
