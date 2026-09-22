import type { EvidenceTable } from "@/lib/content/types";
import styles from "./ResultTable.module.css";

interface ResultTableProps {
  evidence: EvidenceTable;
}

/**
 * A result that is a comparison, drawn as one.
 *
 * MetricPanel answers "how big is this number". Some results have no such
 * answer: TuneIt has four sequencing engines and the interesting thing about
 * them is not the speed of any one, it is that each trades how much of a
 * playlist it keeps against how smoothly the result runs. Reduced to a single
 * headline that finding disappears, and what replaces it is whichever engine
 * happened to score best on whichever axis flattered it.
 *
 * So: a real `<table>`, with a caption and column headers, because that is
 * what this is and a grid of divs would be a picture of one. Figures are
 * tabular so the columns line up as columns rather than as coincidence.
 *
 * The note underneath is load-bearing. A table is more persuasive than a
 * sentence and therefore more dangerous, and the reader is owed the thing
 * that would change how they read it — in TuneIt's case, that the engine
 * which reorders least is the one that scores highest.
 */
export function ResultTable({ evidence }: ResultTableProps) {
  return (
    <figure className={styles.figure}>
      <table className={styles.table}>
        <caption className={styles.caption}>{evidence.caption}</caption>
        <thead>
          <tr>
            {evidence.columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                /* The first column names the thing being measured; the rest
                   are the measurements. Right-aligning the figures is what
                   makes a column of numbers readable down rather than across. */
                className={i === 0 ? styles.headName : styles.headValue}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evidence.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) =>
                i === 0 ? (
                  /* A row header, not a cell: assistive technology announces
                     "Frame" with each figure instead of reading a bare number
                     out of a table it cannot see. */
                  <th key={cell} scope="row" className={styles.name}>
                    {cell}
                  </th>
                ) : (
                  <td key={`${row[0]}-${evidence.columns[i]}`} className={styles.value}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {evidence.note ? (
        <figcaption className={styles.note}>{evidence.note}</figcaption>
      ) : null}
    </figure>
  );
}
