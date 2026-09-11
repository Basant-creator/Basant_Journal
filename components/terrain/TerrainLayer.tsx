import { MapLayer } from "@/components/map/MapLayer";
import {
  COMPASS,
  SCALE_BAR,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  terrain,
} from "@/lib/map/terrain";
import { MapCompass } from "@/components/map/MapCompass";
import styles from "./TerrainLayer.module.css";

/**
 * THE TERRAIN.
 *
 * The survey sheet itself, in the layer order a draughtsman would work in:
 * field, stains, contours, relief, water, road, cover, triangulation, names,
 * neat line. Every band is its own MapLayer so it can be tuned alone.
 *
 * Phase 2 note: Phase 1 drew the map as light lines on the dark ground. The
 * brief here calls for a parchment base, so the sheet is now ink-on-parchment
 * — more honest to a surveyor's working map, and better for contrast
 * (4.98:1 for ink on the field, against 3.58:1 for the old scheme). THE DARK
 * still dominates the page: the sheet is inset, burned at the edges, and sits
 * under the atmospheric layer.
 */
export function TerrainLayer() {
  return (
    <>
      <defs>
        <radialGradient id="fieldLight" cx="44%" cy="38%" r="82%">
          <stop offset="0%" stopColor="#E0CFAB" />
          <stop offset="58%" stopColor="var(--map-field-light)" />
          <stop offset="100%" stopColor="var(--map-field)" />
        </radialGradient>

        <radialGradient id="fieldBurn" cx="50%" cy="46%" r="70%">
          <stop offset="0%" stopColor="rgba(35,27,20,0)" />
          <stop offset="78%" stopColor="rgba(35,27,20,0.06)" />
          <stop offset="100%" stopColor="var(--map-field-burn)" />
        </radialGradient>

        <radialGradient id="stainTint" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6d5a3e" />
          <stop offset="100%" stopColor="rgba(109,90,62,0)" />
        </radialGradient>
      </defs>

      {/* --- the sheet ------------------------------------------------- */}
      <MapLayer name="base" className={styles.enterBase}>
        <rect x="0" y="0" width={SHEET_WIDTH} height={SHEET_HEIGHT} fill="url(#fieldLight)" />
        {terrain.stains.map((stain, i) => (
          <ellipse
            key={`stain-${i}`}
            cx={stain.cx}
            cy={stain.cy}
            rx={stain.rx}
            ry={stain.ry}
            fill="url(#stainTint)"
            opacity={stain.opacity}
          />
        ))}
      </MapLayer>

      {/* --- relief ----------------------------------------------------- */}
      <MapLayer name="contours" className={styles.enterInk}>
        <g className={styles.contour}>
          {terrain.contours.map((d, i) => (
            <path key={`contour-${i}`} d={d} />
          ))}
        </g>
      </MapLayer>

      <MapLayer name="mountains" className={styles.enterInk}>
        <g className={styles.hachure}>
          {terrain.mountains.hachures.map((d, i) => (
            <path key={`hach-${i}`} d={d} />
          ))}
        </g>
        <g className={styles.ridge}>
          {terrain.mountains.ridges.map((d, i) => (
            <path key={`ridge-${i}`} d={d} />
          ))}
        </g>
      </MapLayer>

      {/* --- water ------------------------------------------------------ */}
      <MapLayer name="water" className={styles.enterInk}>
        <g className={styles.waterBank}>
          {terrain.river.banks.map((d, i) => (
            <path key={`bank-${i}`} d={d} />
          ))}
        </g>
        <path className={styles.waterChannel} d={terrain.river.channel} />
        <path className={styles.waterChannel} d={terrain.river.tributary} />
        <g className={styles.marsh}>
          {terrain.marsh.map((d, i) => (
            <path key={`marsh-${i}`} d={d} />
          ))}
        </g>
      </MapLayer>

      {/* --- the old post road ------------------------------------------ */}
      <MapLayer name="roads" className={styles.enterInk}>
        <g className={styles.road}>
          {terrain.road.lanes.map((d, i) => (
            <path key={`road-${i}`} d={d} />
          ))}
        </g>
        <path className={styles.bridge} d={terrain.road.bridge} />
      </MapLayer>

      {/* --- cover ------------------------------------------------------ */}
      <MapLayer name="cover" className={styles.enterInk}>
        <g className={styles.scrub}>
          {terrain.scrub.map((d, i) => (
            <path key={`scrub-${i}`} d={d} />
          ))}
        </g>
      </MapLayer>

      {/* --- triangulation: the measured lines -------------------------- */}
      <MapLayer name="triangulation" className={styles.enterInk}>
        <g className={styles.stationLine}>
          {terrain.stations.lines.map((d, i) => (
            <path key={`stline-${i}`} d={d} />
          ))}
        </g>
        <g className={styles.station}>
          {terrain.stations.markers.map((d, i) => (
            <path key={`st-${i}`} d={d} />
          ))}
        </g>
      </MapLayer>

      {/* --- place names ------------------------------------------------ */}
      <MapLayer name="placenames" className={styles.enterLate}>
        {terrain.labels.map((label, i) => (
          <text
            key={`label-${i}`}
            x={label.x}
            y={label.y}
            fontSize={label.size ?? 16}
            textAnchor={label.anchor ?? "middle"}
            transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
            className={
              label.kind === "water"
                ? styles.nameWater
                : label.kind === "survey"
                  ? styles.nameSurvey
                  : label.kind === "road"
                    ? styles.nameRoad
                    : styles.nameTerrain
            }
          >
            {label.text}
          </text>
        ))}
      </MapLayer>

      {/* --- instruments: compass and scale ----------------------------- */}
      <MapLayer name="instruments" className={styles.enterLate}>
        <MapCompass x={COMPASS.x} y={COMPASS.y} radius={COMPASS.radius} />

        <g transform={`translate(${SCALE_BAR.x} ${SCALE_BAR.y})`}>
          <rect
            className={styles.scaleFrame}
            x="0"
            y="0"
            width={SCALE_BAR.width}
            height={SCALE_BAR.height}
          />
          {Array.from({ length: SCALE_BAR.divisions }).map((_, i) =>
            i % 2 === 0 ? (
              <rect
                key={`sc-${i}`}
                className={styles.scaleFill}
                x={(SCALE_BAR.width / SCALE_BAR.divisions) * i}
                y="0"
                width={SCALE_BAR.width / SCALE_BAR.divisions}
                height={SCALE_BAR.height}
              />
            ) : null,
          )}
          <text className={styles.scaleCaption} x="0" y="26">
            {SCALE_BAR.caption}
          </text>
        </g>

        <text className={styles.sheetMark} x={SHEET_WIDTH - 60} y={SHEET_HEIGHT - 60} textAnchor="end">
          SHEET 1 OF 1 · SURVEYED 2026
        </text>
      </MapLayer>

      {/* --- burn and neat line ----------------------------------------- */}
      <MapLayer name="sheet-burn">
        <rect x="0" y="0" width={SHEET_WIDTH} height={SHEET_HEIGHT} fill="url(#fieldBurn)" />
      </MapLayer>

      <MapLayer name="neatline" className={styles.enterLate}>
        <g className={styles.frame}>
          <path d={terrain.frame.outer} />
          <path d={terrain.frame.inner} />
        </g>
        <g className={styles.tick}>
          {terrain.frame.ticks.map((d, i) => (
            <path key={`tick-${i}`} d={d} />
          ))}
        </g>
        <g className={styles.register}>
          {terrain.frame.corners.map((d, i) => (
            <path key={`reg-${i}`} d={d} />
          ))}
        </g>
      </MapLayer>
    </>
  );
}
