import type { Metadata } from "next";
import Link from "next/link";
import { TrailOnward } from "@/components/navigation/TrailOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { Place } from "@/components/world/Place";
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
    "Measured engineering outcomes: four sequencing engines compared on one 500-track pool, 452 of 500 tracks kept with no broken transitions, three systems shipped.",
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
 *
 * **It stands somewhere now.** §20 asks the Board to feel like a place rather
 * than a page, and the board itself was never the problem — it was already
 * planks and nails. What it lacked was ground: it was pinned to a leaf of the
 * field book, which is to say it was a picture of a notice board printed in a
 * notebook. So the book boards are gone, the structure stands on two posts
 * under a head-rail, and behind it is the same ridge the survey sheet draws
 * (see Place). The content is untouched.
 */
export default function BountiesPage() {
  return (
    <Place hour="dusk" station="Station V · Notice Board · Bounty Plateau">
      <div className={shared.page}>
        <PageHeader
          eyebrow="Bounties · Results"
          title="Bounties"
          lede="Measured outcomes, not adjectives. Every number is pinned to the record that proves it."
          symbol={location?.symbol}
        />

        {/* The structure. Two posts driven into the ground and a rail across
            the top of them — the thing that makes a board a board rather than a
            panel, and the reason it reads as standing in front of the ridge
            rather than floating over it. All decoration; the board's content is
            a list and stays one. */}
        <div className={styles.structure}>
          <span className={styles.rail} aria-hidden="true" />
          <span className={`${styles.post} ${styles.postLeft}`} aria-hidden="true" />
          <span className={`${styles.post} ${styles.postRight}`} aria-hidden="true" />

          <div className={styles.board}>
            <div className={styles.planks} aria-hidden="true" />

            {/* A heading, not a decorative line of type. The board carried an h1
                and then nothing: four measured results, and no way to reach them
                by heading. It is already styled as the board's title — it just
                was not marked as one. */}
            <h2 id="findings" className={styles.boardHead}>
              Notable findings
            </h2>

            <ul className={styles.notices} aria-labelledby="findings">
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
                        <span className={styles.findingTag}>Verified outcome · {metric.id}</span>
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
            <div className={`${styles.marks} surfaceDark`} aria-label="Filing marks" role="group">
              <Stamp note="Field-tested and written up in the Journal." tilt={-5}>
                Surveyed
              </Stamp>
              <Stamp
                /* Was "not estimated after", which claimed something about
                   *when* rather than about *how*, and the honest thing to
                   claim is reproducibility: the harness is committed, so
                   anybody can take these readings again. */
                note="Medians of five runs of a benchmark that ships in the repository, not one good run."
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
                  The caveats are on the records, not hidden under them.
                </p>
                <p className={styles.signature}>— B.B., {meta.surveyed}</p>
              </TornPaper>
            </div>
          </div>
        </div>

        <TrailOnward />
      </div>
    </Place>
  );
}
