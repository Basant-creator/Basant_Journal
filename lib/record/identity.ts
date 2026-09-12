import type { PaperVariant } from "@/components/paper/Paper";

/**
 * What each record is filed as.
 *
 * Three systems, three stocks, three marks — and one stationer. The brief asks
 * for records that feel distinctly different while clearly belonging to the
 * same portfolio, and the way to get both is to change the paper and the
 * drawing rather than the design: same headings, same rules, same measure,
 * same sheet numbering.
 *
 * It is data rather than conditionals in the page because there will be a
 * fourth project one day, and the cost of adding it should be an entry here.
 */
/**
 * How a record arrives.
 *
 *   PULL     a sheet drawn forward off a pile
 *   DRAW     a file taken out of a stack
 *   UNFOLD   a drawing opened along its crease
 *
 * Each belongs to the stock it arrives on: you pull a note, you draw a file,
 * you unfold a blueprint. Picking one at random would make the motion
 * decorative; picking the one the object would actually do makes it physical.
 */
export type RecordEntryKind = "PULL" | "DRAW" | "UNFOLD";

export interface RecordIdentity {
  /** The stock. Set once per record; a manila file is manila throughout. */
  stock: PaperVariant;
  /** What the document does on arrival. */
  entry: RecordEntryKind;
  /** The strike on the masthead, and what it means. */
  stamp: { mark: string; note: string };
  /** The figure on the architecture sheet. */
  figure: {
    label: string;
    caption: string;
    /** What the drawing shows, for anyone not seeing it. Required. */
    description: string;
  };
}

const IDENTITIES: Record<string, RecordIdentity> = {
  /* A working notebook: ruled, warm, the surface you sketch a curve on. */
  tuneit: {
    stock: "FIELD_NOTE",
    entry: "PULL",
    stamp: {
      mark: "Measured",
      note: "Sequencing throughput and smoothness measured against a 500-track benchmark.",
    },
    figure: {
      label: "Fig. 1",
      caption:
        "Harmonic matching on the Camelot wheel, and the energy trajectory a sequenced set describes.",
      description:
        "Left: a ring of twelve Camelot positions. Arcs join each position to its compatible neighbours — one step around the wheel, or the same number in the other mode. Right: an energy curve across a set, rising through the middle and settling at the end, with sampled track positions marked along it.",
    },
  },

  /* Buff manila, ruled at the head. A file that has been opened before. */
  onsight: {
    stock: "CASE_FILE",
    entry: "DRAW",
    stamp: {
      mark: "Audited",
      note: "Unauthorised access attempts are written to a persistent log rather than only refused.",
    },
    figure: {
      label: "Fig. 1",
      caption:
        "The ingestion and grading procedure, with the gates that must pass before a submission is graded.",
      description:
        "A PDF enters extraction by the multimodal model, then a JSON schema validator. Validated questions pass to the store; failed extractions branch to a fallback and re-enter. Submissions run through the grading engine under a time window, and every endpoint sits behind a hierarchical role check. Each passed gate is ticked.",
    },
  },

  /* Cyanotype: dark ground, light line. Drawings of things not yet built. */
  bobai: {
    stock: "BLUEPRINT",
    entry: "UNFOLD",
    stamp: {
      mark: "Generated",
      note: "Scaffolded, provisioned and pushed end to end, with the deployment failure path under test.",
    },
    figure: {
      label: "Fig. 1",
      caption:
        "The scaffolding pipeline: one description in, three application tiers out, and a provisioned repository.",
      description:
        "A description enters the Flask API and the scaffolding engine, which targets three tiers — vanilla JavaScript, React, and Node with Express. Generated source passes through a multi-file extraction stage with a regex fallback, gains contextual assets, and is pushed to a provisioned repository. Integration tests hang off the end. A file tree to the right shows the shape of what is produced.",
    },
  },
};

/** The default is the working notebook: the surface everything starts on. */
const FALLBACK: RecordIdentity = {
  stock: "FIELD_NOTE",
  entry: "PULL",
  stamp: { mark: "Filed", note: "Written up in full and filed." },
  figure: { label: "Fig. 1", caption: "", description: "" },
};

export function identityFor(projectId: string): RecordIdentity {
  return IDENTITIES[projectId] ?? FALLBACK;
}

export function hasFigure(projectId: string): boolean {
  return projectId in IDENTITIES;
}
