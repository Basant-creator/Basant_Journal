import type { Metadata } from "next";
import { Paper, type PaperVariant } from "@/components/paper/Paper";
import { Stamp } from "@/components/world/Stamp";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Paper variants — Lab",
  robots: { index: false, follow: false },
};

const VARIANTS: {
  variant: PaperVariant;
  name: string;
  role: string;
  body: string;
  tilt: number;
}[] = [
  {
    variant: "FIELD_NOTE",
    name: "Field note",
    role: "Torn from a pocket book",
    body: "Ruled, warm, handled at the edges. The everyday surface — an observation written down where it happened.",
    tilt: -0.8,
  },
  {
    variant: "JOURNAL_PAGE",
    name: "Journal page",
    role: "The bound record",
    body: "Heavier stock, a red margin rule down the left, wider measure. This is where a write-up is transcribed properly rather than jotted.",
    tilt: 0.4,
  },
  {
    variant: "CASE_FILE",
    name: "Case file",
    role: "Examination and audit",
    body: "Buff manila with a heavy rule at the head, set in the interface voice because a file is a form, not prose. OnSight's surface.",
    tilt: -0.5,
  },
  {
    variant: "BLUEPRINT",
    name: "Blueprint",
    role: "Construction and generation",
    body: "Cyanotype: dark ground, light line, a real drawing grid at two scales. It inverts the layer model, so its text tokens invert with it. BobAI's surface.",
    tilt: 0.6,
  },
  {
    variant: "NEWSPAPER",
    name: "Newspaper",
    role: "Reported, not recorded",
    body: "Greyer and thinner than journal stock, with a halftone tint at four pixels. For anything quoting the outside world.",
    tilt: -0.3,
  },
];

/**
 * Step 07's deliverable: every paper variant on one page.
 *
 * The design reference the later steps build from — project records, the
 * archive, the journal. Kept side by side deliberately, because the thing
 * that matters is whether they read as six stocks from one stationer rather
 * than six unrelated components.
 */
export default function PaperLabPage() {
  return (
    <>
      <header>
        <h1 className={styles.title}>Paper variants</h1>
        <p className={styles.lede}>
          One substrate, six treatments. What separates them is what a real
          stationer&rsquo;s difference would be — stock, rule, border, overlay,
          and the voice the type is set in. Every overlay is drawn in CSS, so
          it scales to any sheet and costs nothing to download.
        </p>
      </header>

      <div className={styles.grid}>
        {VARIANTS.map((v) => (
          <section key={v.variant} className={styles.cell}>
            <div className={styles.meta}>
              <h2 className={styles.name}>{v.name}</h2>
              <p className={styles.role}>{v.role}</p>
              <code className={styles.token}>{v.variant}</code>
            </div>
            <Paper variant={v.variant} tilt={v.tilt} className={styles.sheet}>
              <p>{v.body}</p>
            </Paper>
          </section>
        ))}

        <section className={styles.cell}>
          <div className={styles.meta}>
            <h2 className={styles.name}>Photograph</h2>
            <p className={styles.role}>A print in its mount</p>
            <code className={styles.token}>PHOTOGRAPH</code>
          </div>
          <Paper
            variant="PHOTOGRAPH"
            tilt={-1.1}
            caption="the only one of the six with a caption"
            className={styles.sheet}
          >
            <p>Image area</p>
          </Paper>
        </section>
      </div>

      <section className={styles.torn}>
        <h2 className={styles.name}>Torn edges, on any variant</h2>
        <p className={styles.lede}>
          Tearing is orthogonal to stock: pass edges and a seed and the sheet
          loses its border and radius, gains a generated edge, and takes a drop
          shadow that follows the tear instead of a box shadow that ignores it.
        </p>
        <div className={styles.tornRow}>
          <Paper
            variant="FIELD_NOTE"
            edges={["bottom", "right"]}
            seed="lab-note"
            cornerTear="bl"
            tilt={-1.4}
            className={styles.sheet}
          >
            <p>A field note, torn out.</p>
            <Stamp note="Every seam is generated from its seed." tilt={-6}>
              Surveyed
            </Stamp>
          </Paper>
          <Paper
            variant="CASE_FILE"
            edges={["top"]}
            seed="lab-file"
            tilt={0.8}
            className={styles.sheet}
          >
            <p>A case file with its head torn away.</p>
          </Paper>
          <Paper
            variant="BLUEPRINT"
            edges={["right", "bottom"]}
            seed="lab-blue"
            tilt={-0.6}
            className={styles.sheet}
          >
            <p>A blueprint, torn.</p>
          </Paper>
        </div>
      </section>
    </>
  );
}
