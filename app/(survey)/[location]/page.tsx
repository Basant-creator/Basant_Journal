import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { Metric } from "@/components/metrics/Metric";
import { ButtonLink } from "@/components/shared/Button";
import { LocationGlyph } from "@/components/map/symbols";
import { getLocation, locations, projects } from "@/lib/content/portfolio";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ location: string }>;
}

export function generateStaticParams() {
  return locations.map((l) => ({ location: l.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location: id } = await params;
  const location = getLocation(id);
  if (!location) return {};

  return {
    title: `${location.label} — ${location.section}`,
    description: location.description,
    alternates: { canonical: location.route },
  };
}

/**
 * A location on the sheet.
 *
 * Phase 2 builds the shell, not the content. A location that has not been
 * written up says so plainly rather than presenting an empty page dressed as
 * a finished one — the brief's rule, and the honest version of a portfolio
 * that is genuinely still being made.
 *
 * Journal is the exception: the primary trail has to lead somewhere real, so
 * it shows the three systems it will eventually document in full.
 */
export default async function LocationPage({ params }: PageProps) {
  const { location: id } = await params;
  const location = getLocation(id);
  if (!location) notFound();

  const isJournal = location.id === "journal";
  const index = locations.findIndex((l) => l.id === location.id);
  const next = locations[(index + 1) % locations.length];

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <span className={styles.glyph} aria-hidden="true">
          <svg viewBox="-20 -20 40 40" width="46" height="46">
            <LocationGlyph symbol={location.symbol} strokeWidth={1.6} />
          </svg>
        </span>
        <div>
          <p className={styles.eyebrow}>{location.section}</p>
          <h1 className={styles.title}>{location.label}</h1>
        </div>
      </header>

      <p className={styles.lede}>{location.description}</p>

      {isJournal ? (
        <section className={styles.journal} aria-labelledby="journal-heading">
          <h2 id="journal-heading" className={styles.sectionHeading}>
            Three systems
          </h2>

          <ul className={styles.entries}>
            {projects.map((project) => (
              <li key={project.id}>
                <PaperSurface as="article" edge="worn" className={styles.entry}>
                  <p className={styles.chapter}>Chapter {project.chapter}</p>
                  <h3 className={styles.entryTitle}>{project.title}</h3>
                  <p className={styles.entrySubtitle}>{project.subtitle}</p>
                  <p className={styles.entryDate}>{project.date}</p>
                  <p className={styles.entrySummary}>{project.summary}</p>

                  <div className={styles.entryMetrics}>
                    {project.metrics.map((metric) => (
                      <Metric
                        key={metric.label}
                        value={metric.value}
                        unit={metric.unit}
                      />
                    ))}
                  </div>

                  <ul className={styles.stack}>
                    {project.technologies.slice(0, 6).map((tech) => (
                      <li key={tech} className={styles.tag}>
                        {tech}
                      </li>
                    ))}
                  </ul>

                  <p className={styles.entryPending}>
                    Full write-up — problem, architecture, challenges, results —
                    is being transcribed.
                    {project.linksStatus === "unresolved"
                      ? " Repository and demo links are not yet recorded."
                      : null}
                  </p>
                </PaperSurface>
              </li>
            ))}
          </ul>

          <SurveyAnnotation tag="Field note" className={styles.note}>
            Every number on these cards comes from the record, not from
            marketing — and each one will link to the section that proves it.
          </SurveyAnnotation>
        </section>
      ) : (
        <PaperSurface edge="worn" className={styles.stub}>
          <p className={styles.stubTag}>Survey in progress</p>
          <p>
            This location is mapped but not yet written up. The trail, the
            marker and the route are surveyed; the record that belongs here is
            still being transcribed.
          </p>
          <p className={styles.stubMeta}>
            In the meantime, the professional view carries every fact this
            section will hold — plainly, on one page.
          </p>
          <div className={styles.stubActions}>
            <ButtonLink href="/professional" variant="primary">
              Professional view
            </ButtonLink>
            <ButtonLink href="/frontier" variant="secondary">
              Back to the map
            </ButtonLink>
          </div>
        </PaperSurface>
      )}

      <nav className={styles.onward} aria-label="Continue along the trail">
        <Link href={next.route} className={styles.onwardLink}>
          <span className={styles.onwardLabel}>Next on the trail</span>
          <span className={styles.onwardName}>
            {next.label} — {next.section}
          </span>
        </Link>
        <Link href="/frontier" className={styles.onwardBack}>
          Return to the sheet
        </Link>
      </nav>
    </article>
  );
}
