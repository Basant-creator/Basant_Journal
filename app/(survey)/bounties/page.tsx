import type { Metadata } from "next";
import Link from "next/link";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stamp } from "@/components/world/Stamp";
import { TornPaper } from "@/components/world/TornPaper";
import { getLocation, getProject, meta, metrics } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("bounties");

export const metadata: Metadata = {
  title: "Bounties — Results",
  description:
    "Measured engineering outcomes: 157K+ tracks per second, 99.7% smoothness on a 500-track benchmark, four sequencing engines, three systems shipped.",
  alternates: { canonical: routes.bounties },
};

/** Each notice hangs a little differently, but always within a degree or two. */
const HANG = [-1.6, 1.1, -0.7, 1.8];

/**
 * How each notice is fixed to the board.
 *
 * A real board is not four identical nails. Someone had a nail for the first
 * two and reached for the tape for the others, and that inconsistency is most
 * of what makes a board read as a board rather than as a grid of cards.
 */
const FIXING = ["nail", "tape", "nail", "tape"] as const;

/** Sheets are not all cut to the same length either. */
const DROP = [0, 14, 4, 22];
const EDGES = [
  ["bottom", "right"],
  ["bottom", "left"],
  ["top", "bottom"],
  ["bottom"],
] as const;

/**
 * The board.
 *
 * A frontier notice board rather than a statistics dashboard: planks, nails,
 * and four measured results pinned to them on torn paper. Every figure comes
 * from the record — nothing here is invented — and every one carries a link to
 * the write-up that substantiates it, because an unlinked number reads as
 * marketing.
 */
export default function BountiesPage() {
  return (
    <div className={shared.page}>

      <div className={shared.locate}>
        <PageHeader
          eyebrow="Bounties · Results"
          title="Bounties"
          lede="Measured outcomes, not adjectives. Every number is pinned to the record that proves it."
          symbol={location?.symbol}
        />
      </div>

      <div className={styles.board}>
        <div className={styles.planks} aria-hidden="true" />

        <p className={styles.boardHead}>Notable findings</p>

        <ul className={styles.notices}>
          {metrics.map((metric, i) => {
            const project = metric.project ? getProject(metric.project) : undefined;
            return (
              <li
                key={metric.id}
                className={styles.slot}
                style={{ "--drop": `${DROP[i % DROP.length]}px` } as React.CSSProperties}
              >
                {FIXING[i % FIXING.length] === "nail" ? (
                  <span className={styles.nail} aria-hidden="true" />
                ) : (
                  <span className={styles.tape} aria-hidden="true" />
                )}
                <TornPaper
                  as="article"
                  seed={`bounty-${metric.id}`}
                  edges={[...EDGES[i % EDGES.length]]}
                  cornerTear={i % 3 === 0 ? "bl" : "none"}
                  tone={i % 2 === 0 ? "paper" : "light"}
                  tilt={HANG[i % HANG.length]}
                  className={styles.notice}
                >
                  <div className={styles.noticeBody}>
                    <span className={styles.value}>{metric.value}</span>
                    <span className={styles.unit}>{metric.unit}</span>
                    <p className={styles.context}>{metric.context}</p>
                    <Link
                      href={project ? project.route : routes.projects}
                      className={styles.source}
                    >
                      {project ? `Record: ${project.title}` : "Record: the Journal"}
                    </Link>
                  </div>
                </TornPaper>
              </li>
            );
          })}
        </ul>

        {/* The marks are struck on the board itself, not on a notice: the
            dark-surface treatment is what keeps them legible there. */}
        <div className={`${styles.marks} surfaceDark`}>
          <Stamp note="Field-tested and written up in the Journal." tilt={-5}>
            Surveyed
          </Stamp>
          <Stamp
            note="Taken on a 500-track benchmark during TuneIt's development, not estimated after."
            tone="ink"
            tilt={3}
          >
            Measured
          </Stamp>

          {/* The card someone tacked up beside the stamps. It says what the
              stamps mean, in the hand of whoever struck them — which is the
              one annotation this board actually needed. */}
          <TornPaper
            seed="bounty-card"
            edges={["right", "bottom"]}
            cornerTear="tr"
            tone="light"
            tilt={-2.4}
            className={styles.card}
          >
            <span className={styles.pin} aria-hidden="true" />
            <p className={styles.hand}>
              Taken while the work was running, not written up afterwards.
            </p>
            <p className={styles.signature}>— B.B., {meta.surveyed}</p>
          </TornPaper>
        </div>
      </div>

      <OnwardNav
        previous={{ href: routes.projects, caption: "Back along the trail", label: "Journal" }}
        next={{ href: routes.archive, caption: "Next on the trail", label: "Archive" }}
      />
    </div>
  );
}
