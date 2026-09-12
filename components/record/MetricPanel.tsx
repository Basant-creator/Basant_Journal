import styles from "./MetricPanel.module.css";

export interface PanelMetric {
  value: string;
  unit: string;
  label: string;
}

interface MetricPanelProps {
  metrics: PanelMetric[];
  /** Where the numbers came from. Say it, or they are decoration. */
  caption?: string;
}

/**
 * Measured values, as an instrument panel.
 *
 * Ruled cells, tabular figures, and a caption saying where the readings came
 * from. That caption is not optional garnish: a number on a portfolio with no
 * account of how it was measured is a claim, and the whole point of this
 * document system is that a record is evidence.
 *
 * Real text throughout — never an image of a number. These are the figures
 * the portfolio rests on, so they have to be selectable, searchable and
 * readable aloud.
 */
export function MetricPanel({ metrics, caption }: MetricPanelProps) {
  return (
    <figure className={styles.panel}>
      <ul className={styles.readings}>
        {metrics.map((metric) => (
          <li key={metric.label} className={styles.reading}>
            <span className={styles.value}>{metric.value}</span>
            <span className={styles.unit}>{metric.unit}</span>
            <span className={styles.label}>{metric.label}</span>
          </li>
        ))}
      </ul>
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
