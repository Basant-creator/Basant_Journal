import type { Metadata } from "next";
import Link from "next/link";
import { BookSpread } from "@/components/book/BookSpread";
import { LeafOnward } from "@/components/book/LeafOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { SheetReference } from "@/components/map/SheetReference";
import { projects } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Field Notes",
  description:
    "What the work taught, copied out of the records: one note per system, each one linked to the write-up it came from.",
  alternates: { canonical: routes.notes },
};

/**
 * The closing leaf of the field book.
 *
 * Phase 12 asks for a Notes section at the back of the document scale, and
 * the whole question is what goes in it. **Nothing new.** Non-negotiable 1 of
 * this project is that every fact comes from content/portfolio.json, and an
 * invented reflection is exactly the kind of content that reads well and is
 * worth nothing — so this leaf is a transcription rather than a composition:
 * each project's own `lessons` field, in the surveyor's hand, attributed to
 * the record it came out of and linked back to it.
 *
 * That constraint also makes it the right closing page. A reader who has
 * turned through the journey, the journal, the records and the gear arrives
 * at the one page that says what any of it meant — in three sentences that
 * were already written, by the person who did the work, about work that is
 * documented two clicks away.
 *
 * It is a leaf, not a checkpoint. A reader here is still at the Records
 * checkpoint (§16), and the trail says so.
 */
export default function NotesPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Field Book · Notes"
        title="Field Notes"
        lede="What the ground taught. One note per system, copied out of its record — and nothing written here that is not written there."
      />

      <BookSpread
        held
        right={
          <>
            <ol className={styles.notes}>
              {projects.map((project, i) => (
                <li key={project.id}>
                  <PaperSurface as="article" edge="worn" className={styles.note}>
                    <p className={styles.mark}>
                      Note {String(i + 1).padStart(2, "0")}
                      <span className={styles.sep} aria-hidden="true">
                        ·
                      </span>
                      {project.date}
                    </p>
                    <h2 className={styles.subject}>{project.title}</h2>
                    {/* The hand, because this is the one place on the site
                        where the words are a person reflecting rather than a
                        record stating. Everywhere else the hand is reserved
                        for annotation. */}
                    <p className={styles.hand}>{project.lessons}</p>
                    <Link href={project.route} className={styles.source}>
                      Record: {project.title}
                    </Link>
                  </PaperSurface>
                </li>
              ))}
            </ol>

            {/*
              §40 and §51.3 — the sheet, kept in the book as a reference.

              The survey map left the notebook when it became a checkpoint of
              its own, and the brief asks for the book's smaller map content
              to be preserved where it is useful. This is that: the same trail
              geometry and the same locations the sheet draws, at figure
              scale, printed on the last leaf the way a report carries a key
              map. It is the motif rather than the instrument — there is no
              camera, no hover and no engine behind it.
            */}
            <SheetReference
              caption="Reference: the survey, and where these records were taken."
              className={styles.reference}
            />
          </>
        }
      />

      <LeafOnward route={routes.notes} />
    </div>
  );
}
