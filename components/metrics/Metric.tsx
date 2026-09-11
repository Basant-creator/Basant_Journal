import styles from "./Metric.module.css";

interface MetricProps {
  value: string;
  unit: string;
  label?: string;
  /** Large is for the Bounties wall; small is inline in a document. */
  size?: "sm" | "lg";
}

/**
 * A measurement. Real text, never an image — these numbers are the evidence
 * the whole portfolio rests on, so they have to be selectable and readable by
 * a screen reader.
 */
export function Metric({ value, unit, label, size = "sm" }: MetricProps) {
  return (
    <div className={size === "lg" ? `${styles.metric} ${styles.lg}` : styles.metric}>
      <span className={styles.value}>{value}</span>
      <span className={styles.unit}>{unit}</span>
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  );
}
